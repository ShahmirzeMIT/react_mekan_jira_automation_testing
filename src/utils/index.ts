import type { JiraIssue, Task, TaskPriority, TaskStatus } from "@/types";

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mapJiraStatus(name: string): TaskStatus {
  switch (name.toLowerCase()) {
    case "in progress":
      return "IN_PROGRESS";
    case "in review":
      return "IN_REVIEW";
    case "done":
      return "DONE";
    case "blocked":
      return "BLOCKED";
    default:
      return "TODO";
  }
}

export function mapJiraPriority(name: string): TaskPriority {
  return (name.toUpperCase() as TaskPriority) ?? "MEDIUM";
}

export const statusLabel: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const priorityLabel: Record<TaskPriority, string> = {
  LOWEST: "Lowest",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  HIGHEST: "Highest",
};

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 2 * day) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const acceptanceByKey: Record<string, string[]> = {
  "DEV-142": [
    "User can start the GitHub authorization flow from the workspace",
    "Authorization code is exchanged for an access token server-side",
    "Repository scope is limited to read access",
    "Failed authorization shows a recoverable error state",
  ],
  "DEV-138": [
    "File tree renders folders and files for the selected branch",
    "Selecting a file opens the syntax highlighted viewer",
    "Branch selection persists across navigation",
  ],
};

const relatedByKey: Record<string, { repo: string; branch: string; files: string[] }> = {
  "DEV-142": { repo: "r-1", branch: "feature/github-auth", files: ["src/services/github.ts", "src/services/auth.ts"] },
  "DEV-138": { repo: "r-1", branch: "feature/repo-browser", files: ["src/components/TaskCard.tsx"] },
};

export function mapIssueToTask(issue: JiraIssue): Task {
  const f = issue.fields;
  const related = relatedByKey[issue.key];
  const status = mapJiraStatus(f.status.name);
  return {
    id: issue.id,
    key: issue.key,
    title: f.summary,
    description: f.description ?? "",
    acceptanceCriteria: acceptanceByKey[issue.key] ?? [
      "Implementation matches the task description",
      "Unit tests cover the new behaviour",
      "Change is reviewed and merged",
    ],
    status,
    priority: mapJiraPriority(f.priority.name),
    assignee: {
      id: f.assignee?.accountId ?? "unassigned",
      name: f.assignee?.displayName ?? "Unassigned",
      email: f.assignee?.emailAddress ?? "",
      role: "Developer",
    },
    jiraKey: f.project.key,
    issueType: f.issuetype.name,
    labels: f.labels ?? [],
    ...(related ? { repositoryId: related.repo, branch: related.branch } : {}),
    relatedFiles: related?.files ?? [],
    aiAssisted: Boolean(related),
    aiState: related ? (issue.key === "DEV-138" ? "generated" : "assisted") : "none",
    jiraSynced: true,
    githubConnected: Boolean(related),
    comments:
      issue.key === "DEV-142"
        ? [
            { id: "c-1", author: "Shahmir", authorType: "user", body: "I've linked the authentication files.", createdAt: "2h ago" },
            { id: "c-2", author: "DevFlow AI", authorType: "ai", body: "Two potential issues were identified in the callback handling.", createdAt: "1h ago" },
            { id: "c-3", author: "Elena Kovacs", authorType: "user", body: "Tests are passing now.", createdAt: "20m ago" },
          ]
        : [],
    createdAt: f.created,
    updatedAt: f.updated,
  };
}
