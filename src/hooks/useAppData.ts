// hooks/useAppData.ts
import { useCallback, useEffect, useState } from "react";
import { githubService } from "@/services/githubService";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";

function useServiceData<T>(load: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await load();
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, load]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useProjects() {
  return useServiceData(useCallback(() => projectService.getProjects(), []));
}

export function useProject(id?: string) {
  return useServiceData(
    useCallback(() => projectService.getProject(id ?? ""), [id]),
    Boolean(id),
  );
}

export function useTasks(projectId?: string, enabled = true) {
  return useServiceData(
    useCallback(() => taskService.getTasks(projectId ?? ""), [projectId]),
    Boolean(projectId) && enabled,
  );
}

export function useTask(projectId?: string, key?: string) {
  return useServiceData(
    useCallback(() => taskService.getTask(projectId ?? "", key ?? ""), [projectId, key]),
    Boolean(projectId && key),
  );
}

export function useRepositories(enabled = true) {
  return useServiceData(
    useCallback(() => githubService.getRepositories(), []),
    enabled,
  );
}

export function useRepositoryFiles(enabled = true) {
  return useServiceData(
    useCallback(() => githubService.getFiles(), []),
    enabled,
  );
}

export function useCommits(enabled = true) {
  return useServiceData(
    useCallback(() => githubService.getCommits(), []),
    enabled,
  );
}

export function usePullRequests(enabled = true) {
  return useServiceData(
    useCallback(() => githubService.getPullRequests(), []),
    enabled,
  );
}
