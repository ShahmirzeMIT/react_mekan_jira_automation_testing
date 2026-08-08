import { mockJiraIssuesResponse } from "@/mock/jiraIssues";
import type { JiraIssuesResponse, Task, TaskStatus } from "@/types";
import { delay, mapIssueToTask } from "@/utils";

/**
 * Mock Jira transport. Replace the bodies with real HTTP calls to the backend
 * gateway — the return shapes already mirror the Jira REST API v3 response.
 */
export const jiraService = {
  async connect(_input: { url: string; workspace: string; project: string }) {
    await delay(1200);
    return { connected: true, project: "DEV", issues: mockJiraIssuesResponse.data.issues.length };
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