// types/github.ts

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  language: string;
}

export interface GithubReposResponse {
  success: boolean;
  count: number;
  repos: GithubRepo[];
}

export interface GithubBranch {
  name: string;
  protected: boolean;
  commitSha: string;
}

export interface GithubBranchesResponse {
  success: boolean;
  repoFullName: string;
  totalBranches: number;
  branches: GithubBranch[];
  status: number;
}

export interface CreatePRRequest {
  repoFullName: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface CreatePRResponse {
  success: boolean;
  pr: {
    number: number;
    url: string;
    title: string;
  };
}