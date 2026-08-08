import { mockFiles, mockFileTree } from "@/mock/files";
import { mockCommits, mockPullRequests, mockRepositories } from "@/mock/repositories";
import { delay } from "@/utils";

export const githubService = {
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