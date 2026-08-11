import { jiraService } from "./jiraService";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { delay } from "@/utils";

/** Local overrides simulate write operations until a backend exists. */
const overrides = new Map<string, Partial<Task>>();
const created: Task[] = [];

function apply(tasks: Task[]): Task[] {
  return [...created, ...tasks].map((t) => ({ ...t, ...(overrides.get(t.key) ?? {}) }));
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: "me" | "everyone";
  labels?: string[];
  github?: "connected" | "not_connected";
  ai?: "assisted" | "not_assisted";
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    return apply(await jiraService.getTasks());
  },

  async getTask(key: string): Promise<Task | undefined> {
    return (await taskService.getTasks()).find((t) => t.key === key);
  },

  async createTask(input: {
    title: string;
    description: string;
    priority: TaskPriority;
    assignee: string;
    labels: string[];
  }): Promise<Task> {
    await delay(700);
    const seq = 143 + created.length;
    const now = new Date().toISOString();
    const task: Task = {
      id: `local-${seq}`,
      key: `DEV-${seq}`,
      title: input.title,
      description: input.description,
      acceptanceCriteria: ["Implementation matches the task description"],
      status: "TODO",
      priority: input.priority,
      assignee: { id: "u-1", name: input.assignee, email: "shahmir@devflow.ai", role: "Developer" },
      jiraKey: "DEV",
      issueType: "Task",
      labels: input.labels,
      relatedFiles: [],
      aiAssisted: false,
      aiState: "none",
      jiraSynced: false,
      githubConnected: false,
      active: true,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    created.unshift(task);
    return task;
  },

  async updateTask(key: string, patch: Partial<Task>): Promise<void> {
    await delay(400);
    overrides.set(key, { ...(overrides.get(key) ?? {}), ...patch, updatedAt: new Date().toISOString() });
  },

  async completeTask(key: string): Promise<{ syncedAt: string }> {
    await taskService.updateTask(key, { status: "DONE" });
    const res = await jiraService.syncTask(key);
    overrides.set(key, { ...(overrides.get(key) ?? {}), jiraSynced: true });
    return { syncedAt: res.syncedAt };
  },

  async relateFiles(key: string, files: string[], repositoryId: string, branch: string): Promise<void> {
    const current = overrides.get(key) ?? {};
    await taskService.updateTask(key, {
      relatedFiles: Array.from(new Set([...(current.relatedFiles ?? []), ...files])),
      repositoryId,
      branch,
      githubConnected: true,
    });
  },

  async unlinkFile(key: string, path: string, existing: string[]): Promise<void> {
    await taskService.updateTask(key, { relatedFiles: existing.filter((p) => p !== path) });
  },

  filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.key.toLowerCase().includes(q)) return false;
      }
      if (filters.status?.length && !filters.status.includes(task.status)) return false;
      if (filters.priority?.length && !filters.priority.includes(task.priority)) return false;
      if (filters.assignee === "me" && task.assignee.name !== "Shahmir") return false;
      if (filters.labels?.length && !filters.labels.some((l) => task.labels.includes(l))) return false;
      if (filters.github === "connected" && !task.githubConnected) return false;
      if (filters.github === "not_connected" && task.githubConnected) return false;
      if (filters.ai === "assisted" && !task.aiAssisted) return false;
      if (filters.ai === "not_assisted" && task.aiAssisted) return false;
      return true;
    });
  },

  searchTasks(tasks: Task[], query: string): Task[] {
    return taskService.filterTasks(tasks, { search: query });
  },
};
