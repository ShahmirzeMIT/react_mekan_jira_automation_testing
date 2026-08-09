export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  provider: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";
export type TaskPriority = "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorType: "user" | "ai";
  body: string;
  createdAt: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User;
  projectId: string;
  jiraProject: string;
  issueType: string;
  labels: string[];
  repositoryId?: string;
  branch?: string;
  relatedFiles: string[];
  aiAssisted: boolean;
  aiState?: "none" | "assisted" | "generated" | "reviewed";
  jiraSynced: boolean;
  githubConnected: boolean;
  active?: boolean;
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  jiraProject: string;
  githubRepository: string;
  defaultBranch: string;
  icon: string;
  color: string;
  status: "Active" | "Paused" | "Archived";
  tasks: number;
  completed: number;
  aiAssisted: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  commits: number;
  branches: string[];
  pullRequests: number;
  languages: string[];
  visibility: "private" | "public";
  updatedAt: string;
}

export interface RepoFile {
  path: string;
  language: string;
  size: string;
  lastCommit: string;
  updatedAt: string;
  content: string;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

export interface PullRequest {
  id: number;
  title: string;
  author: string;
  branch: string;
  status: "open" | "merged" | "draft";
  createdAt: string;
  comments: number;
}

export type ActivityKind = "task" | "ai" | "github" | "jira" | "test" | "code";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  user: string;
  time: string;
  taskKey?: string;
  repository?: string;
}

export type AIStatus =
  "ready" | "analyzing" | "generating" | "reviewing" | "changes_ready" | "applied" | "error";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: string[];
  diff?: CodeDiff[];
}

export interface CodeDiff {
  path: string;
  language: string;
  hunks: { type: "context" | "add" | "remove"; text: string }[];
  newContent: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
  expected?: string;
  received?: string;
}

/** Jira REST API v3 shaped mock response */
export interface JiraIssue {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    labels?: string[];
    issuetype: {
      id: string;
      name: string;
      subtask: boolean;
      hierarchyLevel: number;
      description: string;
      iconUrl: string;
      self: string;
    };
    created: string;
    updated: string;
    project: {
      self: string;
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
      simplified: boolean;
    };
    priority: { self: string; iconUrl: string; name: string; id: string };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
      avatarUrls: Record<string, string>;
    };
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: { self: string; id: number; key: string; colorName: string; name: string };
    };
  };
}

export interface JiraIssuesResponse {
  success: boolean;
  status: number;
  message: string;
  data: { success: boolean; issues: JiraIssue[]; isLast: boolean };
}
