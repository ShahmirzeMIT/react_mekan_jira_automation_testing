import { useQuery } from "@tanstack/react-query";
import { githubService } from "@/services/githubService";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: projectService.getProjects, staleTime: 30_000 });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ["project", id], queryFn: () => projectService.getProject(id), staleTime: 30_000 });
}

export function useTasks(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => taskService.getTasks(projectId),
    staleTime: 10_000,
    enabled,
  });
}

export function useTask(projectId: string, key: string) {
  return useQuery({
    queryKey: ["task", projectId, key],
    queryFn: () => taskService.getTask(projectId, key),
    staleTime: 5_000,
  });
}

export function useRepositories(enabled = true) {
  return useQuery({ queryKey: ["repositories"], queryFn: githubService.getRepositories, enabled, staleTime: 60_000 });
}

export function useRepositoryFiles(enabled = true) {
  return useQuery({ queryKey: ["repo-files"], queryFn: githubService.getFiles, enabled, staleTime: 60_000 });
}

export function useCommits(enabled = true) {
  return useQuery({ queryKey: ["commits"], queryFn: githubService.getCommits, enabled, staleTime: 60_000 });
}

export function usePullRequests(enabled = true) {
  return useQuery({ queryKey: ["pull-requests"], queryFn: githubService.getPullRequests, enabled, staleTime: 60_000 });
}