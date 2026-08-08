import type { Commit, PullRequest, Repository } from "@/types";

export const mockRepositories: Repository[] = [
  {
    id: "r-1",
    name: "devflow-ai",
    owner: "devflow",
    description: "Web client for the DevFlow AI developer workflow platform",
    commits: 142,
    branches: ["main", "develop", "feature/github-auth", "feature/ai-workspace", "fix/branch-selector"],
    pullRequests: 7,
    languages: ["React", "TypeScript"],
    visibility: "private",
    updatedAt: "2 hours ago",
  },
  {
    id: "r-2",
    name: "devflow-api",
    owner: "devflow",
    description: "Integration gateway for Jira, GitHub and AI providers",
    commits: 318,
    branches: ["main", "develop", "feature/jira-webhooks"],
    pullRequests: 4,
    languages: ["Node.js", "TypeScript"],
    visibility: "private",
    updatedAt: "Yesterday",
  },
  {
    id: "r-3",
    name: "devflow-billing",
    owner: "devflow",
    description: "Metering and invoicing service",
    commits: 87,
    branches: ["main", "feature/usage-metering"],
    pullRequests: 2,
    languages: ["Go"],
    visibility: "private",
    updatedAt: "3 days ago",
  },
];

export const mockCommits: Commit[] = [
  { hash: "9f2c1ab", message: "feat(auth): exchange OAuth code for access token", author: "Shahmir", date: "2 hours ago", branch: "feature/github-auth" },
  { hash: "4de77b0", message: "refactor(github): extract repository client", author: "Elena Kovacs", date: "6 hours ago", branch: "feature/github-auth" },
  { hash: "0c81f3e", message: "test(task-sync): cover blocked transition", author: "Marc Duval", date: "Yesterday", branch: "develop" },
  { hash: "b71a4c9", message: "fix(ui): keep branch selection across navigation", author: "Shahmir", date: "Yesterday", branch: "fix/branch-selector" },
  { hash: "51ee2d4", message: "chore: bump editor dependencies", author: "Marc Duval", date: "3 days ago", branch: "main" },
];

export const mockPullRequests: PullRequest[] = [
  { id: 214, title: "GitHub OAuth authorization code flow", author: "Shahmir", branch: "feature/github-auth", status: "open", createdAt: "2 hours ago", comments: 6 },
  { id: 211, title: "Repository browser + file tree", author: "Shahmir", branch: "feature/repo-browser", status: "open", createdAt: "Yesterday", comments: 3 },
  { id: 208, title: "AI context builder", author: "Elena Kovacs", branch: "feature/ai-context", status: "merged", createdAt: "4 days ago", comments: 11 },
  { id: 205, title: "Draft: preview sandbox states", author: "Marc Duval", branch: "feature/preview", status: "draft", createdAt: "6 days ago", comments: 1 },
];