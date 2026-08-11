// hooks/useAppData.ts
import { useCallback, useEffect, useState } from "react";
import { githubService } from "@/services/githubService";
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

export function useTasks(enabled = true) {
  return useServiceData(
    useCallback(() => taskService.getTasks(), []),
    enabled,
  );
}

export function useTask(key?: string) {
  return useServiceData(
    useCallback(() => taskService.getTask(key ?? ""), [key]),
    Boolean(key),
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
