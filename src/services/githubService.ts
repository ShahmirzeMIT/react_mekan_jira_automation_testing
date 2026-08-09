import { mockFiles, mockFileTree } from "@/mock/files";
import { mockCommits, mockPullRequests, mockRepositories } from "@/mock/repositories";
import { delay } from "@/utils";
import { apiRequest } from "@/services/apiClient";

interface GithubLoginResponse {
  success?: boolean;
  message?: string;
  authUrl: string;
}

interface GithubCallbackResponse {
  success?: boolean;
  message?: string;
  data?: { login?: string; username?: string };
}

export const githubService = {
  async beginOAuth(userID: string): Promise<string> {
    const response = await apiRequest<GithubLoginResponse>("/github/auth/login", {
      method: "POST",
      body: JSON.stringify({ userId: userID }),
    });
    if (!response.authUrl) throw new Error(response.message || "GitHub authorization URL was not returned.");
    return response.authUrl;
  },

  async completeOAuthCallback(input: { code: string; state?: string | null; userId: string }): Promise<GithubCallbackResponse> {
    const response = await apiRequest<GithubCallbackResponse>("/github/auth/callback", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (response.success === false) throw new Error(response.message || "Unable to connect GitHub.");
    return response;
  },

  async connect(account: string) {
    await delay(1100);
    return { connected: true, account, repositories: mockRepositories.length };
  },
  async disconnect() {
    await delay(400);
    return { connected: false };
  },
  async getRepositories() {
    await delay(500);
    return mockRepositories;
  },
  async getRepository(id: string) {
    await delay(300);
    return mockRepositories.find((r) => r.id === id) ?? mockRepositories[0]!;
  },
  async getBranches(id: string) {
    await delay(250);
    return (mockRepositories.find((r) => r.id === id) ?? mockRepositories[0]!).branches;
  },
  async getFiles() {
    await delay(400);
    return { files: mockFiles, tree: mockFileTree };
  },
  async getFileContent(path: string) {
    await delay(250);
    return mockFiles.find((f) => f.path === path) ?? null;
  },
  async getCommits() {
    await delay(350);
    return mockCommits;
  },
  async getPullRequests() {
    await delay(350);
    return mockPullRequests;
  },
};
