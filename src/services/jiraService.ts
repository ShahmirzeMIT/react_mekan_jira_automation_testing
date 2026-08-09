import { mockJiraIssuesResponse } from "@/mock/jiraIssues";
import type { JiraIssuesResponse, Task, TaskStatus } from "@/types";
import { delay, mapIssueToTask } from "@/utils";
import { apiRequest } from "@/services/apiClient";

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

  async getProjects() {
    await delay(300);
    return [{ id: "10000", key: "DEV", name: "Developer Productivity Platform" }];
  },

  async getRawIssues(): Promise<JiraIssuesResponse> {
    await delay(600);
    return mockJiraIssuesResponse;
  },

  async getTasks(projectId: string): Promise<Task[]> {
    const response = await jiraService.getRawIssues();
    if (!response.success) throw new Error(response.message);
    return response.data.issues.map((issue) => mapIssueToTask(issue, projectId));
  },

  async getTask(key: string, projectId: string): Promise<Task | undefined> {
    const tasks = await jiraService.getTasks(projectId);
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
