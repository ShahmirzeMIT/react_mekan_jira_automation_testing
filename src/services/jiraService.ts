import { mockJiraIssuesResponse } from "@/mock/jiraIssues";
import type { JiraIssuesResponse, Task, TaskStatus } from "@/types";
import { delay, mapIssueToTask } from "@/utils";
import { apiRequest } from "@/services/apiClient";
import { db } from "@/config/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

interface JiraOAuthStartResponse {
  success: boolean;
  message: string;
  url: string;
}

export interface JiraOAuthCallbackResponse {
  success: boolean;
  message: string;
  data: {
    jiraDisplayName: string;
    cloudId: string;
    resources: { id: string; name: string; url: string; isDefault: boolean }[];
  };
}

interface CanvasIssuesRequest {
  accessToken: string;
  cloudId: string;
  accountId: string;
}

const CANVAS_ISSUES_COLLECTION = "jira_canvas_issues";

function sortForSignature(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForSignature);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortForSignature((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}

function stableSignature(value: unknown): string {
  const text = JSON.stringify(sortForSignature(value));
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function canvasIssueDocId(cloudId: string, accountId: string, issueKey: string): string {
  return [cloudId, accountId, issueKey]
    .join("_")
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .slice(0, 1_400);
}

async function syncCanvasIssuesToFirestore(
  response: JiraIssuesResponse,
  { cloudId, accountId }: CanvasIssuesRequest,
): Promise<void> {
  if (!db || !response.success || !response.data?.success) return;

  const issues = response.data.issues ?? [];
  await Promise.all(
    issues.map(async (issue) => {
      const issueSignature = stableSignature(issue);
      const issueRef = doc(
        db,
        CANVAS_ISSUES_COLLECTION,
        canvasIssueDocId(cloudId, accountId, issue.key),
      );
      const snapshot = await getDoc(issueRef);

      if (snapshot.exists() && snapshot.data()["issueSignature"] === issueSignature) {
        return;
      }

      await setDoc(
        issueRef,
        {
          accountId,
          cloudId,
          issue,
          issueId: issue.id,
          issueKey: issue.key,
          issueSignature,
          syncedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }),
  );
}

export const jiraService = {
  async beginOAuth(token?: string | null): Promise<string> {
    const response = await apiRequest<JiraOAuthStartResponse>("/auth/jira", { token: token ?? null });
    if (!response.success || !response.url) throw new Error(response.message || "Unable to start Jira OAuth.");

    // Atlassian must also list this URL as an allowed OAuth callback in its app settings.
    const authorizationUrl = new URL(response.url);
    authorizationUrl.searchParams.set("redirect_uri", `${window.location.origin}/jira/callback`);
    return authorizationUrl.toString();
  },

  async completeOAuthCallback(
    code: string,
    state?: string | null,
    token?: string | null,
  ): Promise<JiraOAuthCallbackResponse> {
    const query = new URLSearchParams({ code });
    if (state) query.set("state", state);
    const response = await apiRequest<JiraOAuthCallbackResponse>(`/auth/jira/callback?${query}`, { token: token ?? null });
    if (!response.success) throw new Error(response.message || "Unable to connect Jira.");
    return response;
  },

  async disconnect() {
    await delay(400);
    return { connected: false };
  },

  async getRawIssues(): Promise<JiraIssuesResponse> {
    await delay(600);
    return mockJiraIssuesResponse;
  },

  async getCanvasIssues(request: CanvasIssuesRequest): Promise<JiraIssuesResponse> {
    const { accessToken, cloudId, accountId } = request;
    const response = await apiRequest<JiraIssuesResponse>("/canvas/jira/issues", {
      method: "POST",
      token: accessToken,
      body: JSON.stringify({ cloudId, accountId }),
    });

    try {
      await syncCanvasIssuesToFirestore(response, request);
    } catch (error) {
      console.error("Unable to sync Jira canvas issues to Firestore:", error);
    }

    return response;
  },

  async getCanvasTasks(request: CanvasIssuesRequest): Promise<Task[]> {
    const response = await jiraService.getCanvasIssues(request);
    if (!response.success || !response.data?.success) throw new Error(response.message || "Unable to load Jira issues.");
    return (response.data.issues ?? []).map((issue) => mapIssueToTask(issue));
  },

  async getTasks(): Promise<Task[]> {
    const response = await jiraService.getRawIssues();
    if (!response.success) throw new Error(response.message);
    return response.data.issues.map((issue) => mapIssueToTask(issue));
  },

  async getTask(key: string): Promise<Task | undefined> {
    const tasks = await jiraService.getTasks();
    return tasks.find((t) => t.key === key);
  },

  async updateTaskStatus(key: string, status: TaskStatus) {
    await delay(700);
    return { key, status, synced: true };
  },

  async syncTask(key: string) {
    await delay(900);
    return { key, syncedAt: new Date().toISOString() };
  },
};
