// components/ai-workspace/GithubFiles.tsx

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Space, Card } from "antd";
import { ReloadOutlined, LoadingOutlined } from "@ant-design/icons";
import { toast } from "sonner";

import { useGithub } from "@/hooks/useGithub";
import { RepositorySelect } from "@/components/github/RepositorySelect";
import { BranchesDisplay } from "@/components/github/BranchesDisplay";
import { RepoFileTree, RepoFileEntry } from "@/components/github/RepoFileTree";
import { FileContentViewer } from "@/components/github/FileContentViewer";
import { RepoPreviewPanel } from "@/components/github/preview/RepoPreviewPanel";
import { extractFileContent } from "@/lib/extractFileContent";
import { LoaderPinwheelIcon } from "lucide-react";

export interface SelectedGithubFile {
  path: string;
  content: string;
  loading?: boolean;
}

export interface GithubFilesHandle {
  removeSelectedFile: (path: string) => void;
  clearSelectedFiles: () => void;
  getFileContent: (path: string) => Promise<string>;
}

interface GithubFilesProps {
  onSelectedFilesChange?: (files: SelectedGithubFile[]) => void;
  onRepoFilesChange?: (files: RepoFileEntry[]) => void;
  // Seçilmiş repo/branch dəyişdikcə parent-ə ötürür (commit/push üçün lazımdır)
  onRepoBranchChange?: (repo: string | undefined, branch: string | undefined) => void;
}

function GithubFilesInner(
  { onSelectedFilesChange, onRepoFilesChange, onRepoBranchChange }: GithubFilesProps,
  ref: React.Ref<GithubFilesHandle>,
) {
  const { integrations } = useAppStore();
  const { user } = useAuth();

  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const [repoFiles, setRepoFiles] = useState<RepoFileEntry[]>([]);
  const [repoLoaded, setRepoLoaded] = useState(false);

  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>();
  const [fileContent, setFileContent] = useState<string>("");
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [fileContentCache, setFileContentCache] = useState<Record<string, string>>({});

  const {
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
    connectGithub,
    fetchRepoContent,
    fetchFileContent,
  } = useGithub() as any;

  const githubId = localStorage.getItem("devflow.github.id");

  useEffect(() => {
    if (isConnected && user && githubId) {
      fetchRepositories(githubId);
    }
  }, [isConnected, user]);

  useEffect(() => {
    const pathsToFetch = Array.from(selectedPaths).filter((p) => !(p in fileContentCache));
    if (pathsToFetch.length === 0) return;

    pathsToFetch.forEach(async (path) => {
      try {
        const raw = await fetchFileContent(selectedRepo, selectedBranch, path);
        const extracted = extractFileContent(raw);
        setFileContentCache((prev) => ({ ...prev, [path]: extracted }));
      } catch (err) {
        console.error("Seçilmiş fayl content-i alınmadı:", path, err);
        setFileContentCache((prev) => ({ ...prev, [path]: "" }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaths]);

  useEffect(() => {
    if (!onSelectedFilesChange) return;
    const list: SelectedGithubFile[] = Array.from(selectedPaths).map((path) => ({
      path,
      content: fileContentCache[path] ?? "",
      loading: !(path in fileContentCache),
    }));
    onSelectedFilesChange(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaths, fileContentCache]);

  // Repo faylları dəyişdikcə (Load Content basıldıqda) parent-ə tam ağacı ötürür,
  // ki AI Workspace səhifəsi strukturu Gemini-yə göndərə bilsin.
  useEffect(() => {
    onRepoFilesChange?.(repoFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoFiles]);

  // Seçilmiş repo/branch dəyişdikcə parent-ə ötürür (commit/push üçün owner/repo/branch lazımdır)
  useEffect(() => {
    onRepoBranchChange?.(selectedRepo || undefined, selectedBranch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo, selectedBranch]);

  useImperativeHandle(ref, () => ({
    removeSelectedFile: (path: string) => {
      setSelectedPaths((prev) => {
        if (!prev.has(path)) return prev;
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    },
    clearSelectedFiles: () => setSelectedPaths(new Set()),
    // AI faylları seçdikdən sonra bu path-lərin content-ini əldə etmək üçün.
    // Artıq cache-də varsa yenidən fetch etmir.
    getFileContent: async (path: string) => {
      if (fileContentCache[path] !== undefined) {
        return fileContentCache[path];
      }
      if (!selectedRepo || !selectedBranch) {
        throw new Error("Repository or branch not selected.");
      }
      const raw = await fetchFileContent(selectedRepo, selectedBranch, path);
      const extracted = extractFileContent(raw);
      setFileContentCache((prev) =>
        prev[path] !== undefined ? prev : { ...prev, [path]: extracted },
      );
      return extracted;
    },
  }));

  const handleToggleFileSelection = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleRepoSelect = (value: string) => {
    setSelectedRepo(value);
    setRepoFiles([]);
    setRepoLoaded(false);
    setSelectedFilePath(undefined);
    setFileContent("");
    setFileError(null);
    setSelectedPaths(new Set());
    setFileContentCache({});
    if (value) {
      fetchBranches(value, githubId || "");
    }
  };

  const handleRefresh = async () => {
    if (!githubId) {
      toast.error("GitHub ID not found");
      return;
    }
    toast.info("Refreshing repositories...");
    await fetchRepositories(githubId);
    if (selectedRepo) {
      await fetchBranches(selectedRepo, githubId);
    }
    toast.success("Refreshed successfully!");
  };

  const handleSubmit = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository");
      return;
    }
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    setIsLoadingContent(true);
    setSelectedFilePath(undefined);
    setFileContent("");
    setFileError(null);
    try {
      toast.info(`Fetching content from ${selectedRepo} (${selectedBranch})...`);

      const data = await fetchRepoContent(selectedRepo, selectedBranch);
      const files: RepoFileEntry[] = data?.files ?? data?.data?.files ?? [];

      setRepoFiles(files);
      setRepoLoaded(true);

      toast.success(`${files.length} fayl tapıldı`);
    } catch (error) {
      console.error("❌ Error fetching repository content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch repository content");
      setRepoLoaded(false);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Ağacda fayl adına klikləndə çağırılır. Debug logları qoyulub ki,
  // problemin harada olduğunu (klik çatmır / fetch xəta verir / content boşdur)
  // dəqiq konsoldan görə biləsiniz.
  const handleFileSelect = async (path: string) => {
    console.log(
      "📂 handleFileSelect çağırıldı, path:",
      path,
      "repo:",
      selectedRepo,
      "branch:",
      selectedBranch,
    );

    setSelectedFilePath(path);
    setFileContent("");
    setFileError(null);
    setIsFileLoading(true);

    try {
      if (typeof fetchFileContent !== "function") {
        throw new Error(
          "fetchFileContent metodu useGithub hook-unda tapılmadı. Backend-də tək fayl content endpoint-i qoşub hook-a əlavə edin.",
        );
      }

      const result = await fetchFileContent(selectedRepo, selectedBranch, path);
      console.log("📄 fetchFileContent xam nəticə:", result);

      const extracted = extractFileContent(result);
      console.log("✅ extractFileContent nəticəsi (uzunluq):", extracted?.length ?? 0);

      if (!extracted) {
        throw new Error(
          "Fayl content-i boşdur — backend cavabının strukturunu konsoldan yoxlayın.",
        );
      }

      setFileContent(extracted);
      setFileContentCache((prev) =>
        prev[path] !== undefined ? prev : { ...prev, [path]: extracted },
      );
    } catch (err) {
      console.error("❌ Fayl content yüklənərkən xəta:", err);
      setFileError(err instanceof Error ? err.message : "Fayl yüklənə bilmədi");
    } finally {
      setIsFileLoading(false);
    }
  };

  const isConnectedCheck = integrations.githubConnected || isConnected;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3">
        <PageHeader
          title="GitHub"
          description="Repositories connected to this workspace."
          badge={
            <ConnectionBadge
              label={isConnectedCheck ? "Connected" : "Not connected"}
              connected={isConnectedCheck}
            />
          }
          actions={
            !isConnectedCheck ? (
              <Button size="sm" onClick={() => connectGithub()}>
                Connect GitHub
              </Button>
            ) : undefined
          }
        />
      </div>

      {isConnectedCheck && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <Space direction="vertical" size="middle" className="w-full">
            <Card size="small" className="surface">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
                <div className="min-w-[180px] flex-1">
                  <RepositorySelect
                    repos={repos}
                    loading={isLoadingRepos}
                    value={selectedRepo}
                    onChange={handleRepoSelect}
                  />
                </div>

                <div className="min-w-[180px] flex-1">
                  <BranchesDisplay
                    branches={branches}
                    loading={isLoadingBranches}
                    selectedRepo={selectedRepo}
                    selectedBranch={selectedBranch}
                    onBranchChange={setSelectedBranch}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!selectedRepo || !selectedBranch || isLoadingContent}
                    className="whitespace-nowrap"
                  >
                    {isLoadingContent ? (
                      <>
                        <LoadingOutlined className="mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <LoaderPinwheelIcon className="mr-2 h-4 w-4" />
                        Load Content
                      </>
                    )}
                  </Button>

                  <RepoPreviewPanel
                    repo={selectedRepo}
                    branch={selectedBranch}
                    files={repoFiles}
                    fetchFileContent={fetchFileContent}
                  />

                  <Button
                    size="sm"
                    onClick={handleRefresh}
                    variant="outline"
                    disabled={isLoadingRepos || isLoadingBranches || isLoadingContent}
                    className="whitespace-nowrap"
                  >
                    <ReloadOutlined
                      className={`mr-2 ${isLoadingRepos || isLoadingBranches ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              {selectedRepo && selectedBranch && (
                <div className="mt-3 p-2.5 bg-muted/50 rounded-md">
                  <span className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedRepo}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-foreground">{selectedBranch}</span>
                    {selectedPaths.size > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium text-primary">
                          {selectedPaths.size} fayl AI üçün seçilib
                        </span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </Card>

            {repoLoaded && (
              <Card size="small" className="surface" bodyStyle={{ padding: 0 }}>
                <div className="flex flex-col md:flex-row h-[380px]">
                  <div className="flex-1 p-3 overflow-hidden min-w-0">
                    <FileContentViewer
                      filePath={selectedFilePath}
                      fileName={selectedFilePath?.split("/").pop()}
                      content={fileContent}
                      loading={isFileLoading}
                      error={fileError}
                    />
                  </div>

                  <div className="w-full md:w-64 border-t md:border-t-0 md:border-l flex flex-col">
                    <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground shrink-0 flex items-center justify-between">
                      <span>Files ({repoFiles.length})</span>
                      {selectedPaths.size > 0 && (
                        <span className="text-primary">{selectedPaths.size} seçilib</span>
                      )}
                    </div>
                    <RepoFileTree
                      files={repoFiles}
                      selectedPath={selectedFilePath}
                      onSelectFile={handleFileSelect}
                      selectedFilePaths={selectedPaths}
                      onToggleSelect={handleToggleFileSelection}
                      className="flex-1"
                    />
                  </div>
                </div>
              </Card>
            )}
          </Space>
        </div>
      )}
    </div>
  );
}

const GithubFiles = forwardRef<GithubFilesHandle, GithubFilesProps>(GithubFilesInner);
export default GithubFiles;