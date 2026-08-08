import type { RepoFile } from "@/types";

const githubService = `import { httpClient } from "@/lib/httpClient";
import type { Repository, RepoFile, Commit } from "@/types";

const GITHUB_API = "https://api.github.com";

export class GithubService {
  constructor(private readonly token: string) {}

  private headers(): HeadersInit {
    return {
      Accept: "application/vnd.github+json",
      Authorization: \`Bearer \${this.token}\`,
    };
  }

  async listRepositories(): Promise<Repository[]> {
    const res = await httpClient.get(\`\${GITHUB_API}/user/repos?per_page=100\`, {
      headers: this.headers(),
    });
    return res.data.map(mapRepository);
  }

  async getFile(repo: string, path: string, ref: string): Promise<RepoFile> {
    const res = await httpClient.get(
      \`\${GITHUB_API}/repos/\${repo}/contents/\${path}?ref=\${ref}\`,
      { headers: this.headers() },
    );
    return {
      path,
      language: detectLanguage(path),
      size: formatBytes(res.data.size),
      content: atob(res.data.content),
      lastCommit: res.data.sha.slice(0, 7),
      updatedAt: new Date().toISOString(),
    };
  }

  async listCommits(repo: string, branch: string): Promise<Commit[]> {
    const res = await httpClient.get(
      \`\${GITHUB_API}/repos/\${repo}/commits?sha=\${branch}&per_page=10\`,
      { headers: this.headers() },
    );
    return res.data.map(mapCommit);
  }
}
`;

const authService = `import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import type { AuthUser } from "@/types";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    avatar: user.photoURL,
    provider: user.providerData[0]?.providerId ?? "google.com",
  };
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const credential = await signInWithPopup(auth, provider);
  return mapFirebaseUser(credential.user)!;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribe(cb: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user) => cb(mapFirebaseUser(user)));
}
`;

const jiraService = `import { httpClient } from "@/lib/httpClient";
import type { JiraIssuesResponse, Task } from "@/types";
import { mapIssueToTask } from "@/utils/jiraMapper";

export async function getAssignedIssues(project: string): Promise<Task[]> {
  const response = await httpClient.get<JiraIssuesResponse>(
    \`/api/jira/issues?project=\${project}&assignee=currentUser\`,
  );
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data.issues.map(mapIssueToTask);
}

export async function transitionIssue(key: string, statusId: string) {
  await httpClient.post(\`/api/jira/issues/\${key}/transitions\`, {
    transition: { id: statusId },
  });
}
`;

const taskCard = `import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Task } from "@/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";

interface TaskCardProps {
  task: Task;
  projectId: string;
}

export const TaskCard = memo(function TaskCard({ task, projectId }: TaskCardProps) {
  return (
    <Link
      to="/projects/$projectId/tasks/$taskId"
      params={{ projectId, taskId: task.key }}
      className="surface block p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{task.key}</span>
        <TaskPriorityBadge priority={task.priority} />
      </div>
      <p className="mt-2 text-sm font-medium">{task.title}</p>
      <TaskStatusBadge status={task.status} className="mt-3" />
    </Link>
  );
});
`;

const useTasks = `import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/taskService";

export function useTasks(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => taskService.getTasks(projectId),
    staleTime: 30_000,
    enabled,
  });
}
`;

const loginPage = `import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/store/appStore";

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleGoogle() {
    await signIn();
    navigate({ to: "/projects" });
  }

  if (isAuthenticated) navigate({ to: "/projects" });

  return <button onClick={handleGoogle}>Continue with Google</button>;
}
`;

const readme = `# devflow-ai

Web client for the DevFlow AI developer workflow platform.

## Stack
- React 19 + TypeScript
- TanStack Router / Query
- Tailwind CSS

## Scripts
- \`npm run dev\` — start the dev server
- \`npm test\` — run the unit test suite
`;

const pkg = `{
  "name": "devflow-ai",
  "private": true,
  "version": "0.9.3",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "test": "vitest run"
  }
}
`;

export const mockFiles: RepoFile[] = [
  { path: "README.md", language: "markdown", size: "1.1 KB", lastCommit: "51ee2d4", updatedAt: "3 days ago", content: readme },
  { path: "package.json", language: "json", size: "0.4 KB", lastCommit: "51ee2d4", updatedAt: "3 days ago", content: pkg },
  { path: "src/services/github.ts", language: "typescript", size: "4.2 KB", lastCommit: "9f2c1ab", updatedAt: "2 hours ago", content: githubService },
  { path: "src/services/auth.ts", language: "typescript", size: "2.1 KB", lastCommit: "9f2c1ab", updatedAt: "2 hours ago", content: authService },
  { path: "src/services/jira.ts", language: "typescript", size: "1.8 KB", lastCommit: "4de77b0", updatedAt: "6 hours ago", content: jiraService },
  { path: "src/components/TaskCard.tsx", language: "typescript", size: "1.4 KB", lastCommit: "0c81f3e", updatedAt: "Yesterday", content: taskCard },
  { path: "src/hooks/useTasks.ts", language: "typescript", size: "0.6 KB", lastCommit: "0c81f3e", updatedAt: "Yesterday", content: useTasks },
  { path: "src/pages/Login.tsx", language: "typescript", size: "0.9 KB", lastCommit: "b71a4c9", updatedAt: "Yesterday", content: loginPage },
  { path: "src/pages/TaskDetails.tsx", language: "typescript", size: "3.6 KB", lastCommit: "b71a4c9", updatedAt: "Yesterday", content: taskCard },
  { path: "tests/TaskSync.test.ts", language: "typescript", size: "1.2 KB", lastCommit: "0c81f3e", updatedAt: "Yesterday", content: `import { describe, expect, it } from "vitest";\nimport { syncTask } from "@/services/taskService";\n\ndescribe("task synchronization", () => {\n  it("marks the issue as done in Jira", async () => {\n    const result = await syncTask("DEV-142", "DONE");\n    expect(result.status).toBe("Done");\n  });\n});\n` },
];

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let level = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");
      let node = level.find((n) => n.name === part);
      if (!node) {
        node = isFile
          ? { name: part, path: currentPath, type: "file" }
          : { name: part, path: currentPath, type: "folder", children: [] };
        level.push(node);
      }
      if (!isFile) {
        node.children ??= [];
        level = node.children;
      }
    });
  }
  return root;
}

export const mockFileTree = buildFileTree(mockFiles.map((f) => f.path));