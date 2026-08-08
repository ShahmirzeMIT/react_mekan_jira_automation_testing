import type { AIMessage, CodeDiff, TestResult } from "@/types";

export const analysisResponse = `**DEV-142 — GitHub OAuth flow**

The current implementation stores a personal access token in the client. Three areas need to change:

1. \`src/services/github.ts\` — replace the static token with an injected credential provider.
2. \`src/services/auth.ts\` — add the OAuth callback exchange and persist the session.
3. Login surface — expose the "Connect GitHub" entry point and surface error states.

Repository access should be requested with the narrowest scope (\`repo:read\`), and every failure path must produce a user-visible message.`;

export const implementationPlan = [
  "Update authentication service",
  "Add OAuth callback handling",
  "Update authenticated state",
  "Add error handling",
  "Add tests",
];

export const initialConversation: AIMessage[] = [
  {
    id: "m-1",
    role: "user",
    content: "Analyze this task and explain what needs to be changed.",
    createdAt: "10:02",
  },
  {
    id: "m-2",
    role: "assistant",
    content: analysisResponse,
    plan: implementationPlan,
    createdAt: "10:02",
  },
];

export const generatedDiff: CodeDiff[] = [
  {
    path: "src/services/github.ts",
    language: "typescript",
    hunks: [
      { type: "context", text: "export class GithubService {" },
      { type: "remove", text: "  constructor(private readonly token: string) {}" },
      { type: "add", text: "  constructor(private readonly credentials: OAuthCredentialProvider) {}" },
      { type: "context", text: "" },
      { type: "context", text: "  private headers(): HeadersInit {" },
      { type: "remove", text: "      Authorization: `Bearer ${this.token}`," },
      { type: "add", text: "      Authorization: `Bearer ${this.credentials.accessToken()}`," },
      { type: "context", text: "    };" },
      { type: "context", text: "  }" },
    ],
    newContent: `import { httpClient } from "@/lib/httpClient";
import type { OAuthCredentialProvider } from "@/services/auth";
import type { Repository } from "@/types";

const GITHUB_API = "https://api.github.com";

export class GithubService {
  constructor(private readonly credentials: OAuthCredentialProvider) {}

  private headers(): HeadersInit {
    return {
      Accept: "application/vnd.github+json",
      Authorization: \`Bearer \${this.credentials.accessToken()}\`,
    };
  }

  async listRepositories(): Promise<Repository[]> {
    const res = await httpClient.get(\`\${GITHUB_API}/user/repos?per_page=100\`, {
      headers: this.headers(),
    });
    return res.data.map(mapRepository);
  }
}
`,
  },
  {
    path: "src/services/auth.ts",
    language: "typescript",
    hunks: [
      { type: "context", text: "export async function signInWithGoogle(): Promise<AuthUser> {" },
      { type: "context", text: "  const credential = await signInWithPopup(auth, provider);" },
      { type: "add", text: "  await exchangeGithubCode(credential);" },
      { type: "context", text: "  return mapFirebaseUser(credential.user)!;" },
      { type: "context", text: "}" },
      { type: "add", text: "" },
      { type: "add", text: "export interface OAuthCredentialProvider {" },
      { type: "add", text: "  accessToken(): string;" },
      { type: "add", text: "  refresh(): Promise<void>;" },
      { type: "add", text: "}" },
    ],
    newContent: `export interface OAuthCredentialProvider {
  accessToken(): string;
  refresh(): Promise<void>;
}

export async function exchangeGithubCode(code: string): Promise<OAuthCredentialProvider> {
  const response = await fetch("/api/github/oauth/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error("GitHub authorization failed");
  const session = await response.json();
  return {
    accessToken: () => session.access_token,
    refresh: async () => { await fetch("/api/github/oauth/refresh", { method: "POST" }); },
  };
}
`,
  },
];

export const passingTests: TestResult[] = [
  { name: "authentication test", passed: true },
  { name: "github repository test", passed: true },
  { name: "task service test", passed: true },
  { name: "task synchronization test", passed: true },
];

export const failingTests: TestResult[] = [
  { name: "authentication test", passed: true },
  { name: "github repository test", passed: true },
  { name: "task service test", passed: true },
  { name: "TaskSync.test.ts › synchronizes status", passed: false, expected: "Done", received: "In Progress" },
];

export const quickResponses: Record<string, string> = {
  "Analyze Task": analysisResponse,
  "Generate Implementation Plan": `Here is a sequenced plan for DEV-142. Each step is independently reviewable and testable.`,
  "Review Code": `**Review — 2 files**

- \`github.ts:14\` — the credential provider is not memoized; every request builds new headers. Acceptable, but cache it if request volume grows.
- \`auth.ts:22\` — the callback exchange has no timeout. Wrap the fetch in an abort controller.
- No secrets are read on the client. Good.`,
  "Find Bugs": `**2 potential issues**

1. \`auth.ts:18\` — a rejected popup leaves \`isLoading\` true; reset it in a \`finally\` block.
2. \`github.ts:31\` — \`atob\` fails on UTF-8 content. Decode via \`TextDecoder\` instead.`,
  "Explain Code": `\`GithubService\` wraps the REST client. Headers are built per request so a refreshed token is always used, and each method maps the raw payload into the app's domain types before returning — keeping the GitHub response shape out of the UI layer.`,
  "Generate Tests": `Generated 4 test cases from the acceptance criteria: authorization redirect, code exchange success, code exchange failure, and session persistence across reloads.`,
  "Optimize Code": `Two safe optimizations: memoize the header object per token value, and batch repository requests with \`Promise.all\` instead of sequential awaits.`,
};