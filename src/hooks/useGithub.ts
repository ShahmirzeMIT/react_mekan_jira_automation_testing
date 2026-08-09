// hooks/useGithub.ts

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/api/apiCall';
import { 
  GithubRepo, 
  GithubReposResponse, 
  GithubBranchesResponse,
  GithubBranch,
  CreatePRRequest,
  CreatePRResponse 
} from '@/types/github';
import { useAuth } from './useAuth';

export const useGithub = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
 const [selectedBranch, setSelectedBranch] = useState<string>('');
  // Check connection status
  useEffect(() => {
    const githubId = localStorage.getItem('devflow.github.id');
    setIsConnected(!!githubId);
  }, []);

  // Fetch repositories
  const fetchRepositories = async (userId: string) => {
    setIsLoadingRepos(true);
    try {
      const data = await apiCall<GithubReposResponse>('/github/repos', 'POST', { userId });
      if (data.success) {
        setRepos(data.repos);
        toast.success(`Loaded ${data.count} repositories`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Fetch branches for a repository
  const fetchBranches = async (repoFullName: string,userId: string) => {
    setIsLoadingBranches(true);
    try {
      const data = await apiCall<GithubBranchesResponse>('/github/repo-branch', 'POST', {
        repoFullName,
        userId
      });
      if (data.success) {
        setBranches(data.branches);
        toast.success(`Loaded ${data.branches.length} branches`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  // Create pull request
  const createPullRequest = async (prData: CreatePRRequest) => {
    try {
      const data = await apiCall<CreatePRResponse>('/github/create-pr', 'POST', {
        ...prData,
        userId: user?.uid
      });
      if (data.success) {
        toast.success(`PR #${data.pr.number} created successfully!`);
        return data;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create PR');
      throw error;
    }
  };

  // Connect GitHub
  const connectGithub = async (projectId: string) => {
    if (!user) {
      toast.error('Sign in before connecting GitHub.');
      return;
    }

    try {
      sessionStorage.setItem('devflow.github.user-id', user.uid);
      sessionStorage.setItem('devflow.github.return-project', projectId);
      
      localStorage.setItem('devflow.github.id', 'github_connected');
      setIsConnected(true);
      toast.success('GitHub connected successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to connect GitHub.');
    }
  };
  

  return {
    isConnected,
    repos,
    branches,
    isLoadingRepos,
    isLoadingBranches,
    selectedRepo,
    setSelectedRepo,
    fetchRepositories,
    selectedBranch,
    setSelectedBranch,
    fetchBranches,
    createPullRequest,
    connectGithub,
  };
};