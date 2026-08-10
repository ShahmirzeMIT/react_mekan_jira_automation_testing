// components/ai-workspace/GithubFiles.tsx

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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

export default function GithubFiles() {
  const { integrations } = useAppStore();
  const { user } = useAuth();
  const { projectId = "p-1" } = useParams();

  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Repo faylları (tree üçün)
  const [repoFiles, setRepoFiles] = useState<RepoFileEntry[]>([]);
  const [repoLoaded, setRepoLoaded] = useState(false);

  // Seçilmiş fayl və onun content-i
  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>();
  const [fileContent, setFileContent] = useState<string>("");
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

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
    // TODO: useGithub hook-una fetchFileContent(repo, branch, path, githubId) əlavə edin.
    // Backend-də GitHub Contents API-ni (bir fayl üçün) çağırıb base64 content-i
    // decode edərək { content: string } formatında qaytarmalıdır. Aşağıda
    // handleFileSelect içində necə istifadə olunduğunu görə bilərsiniz.
    fetchFileContent,
  } = useGithub() as any;

  const githubId = localStorage.getItem("devflow.github.id");

  useEffect(() => {
    if (isConnected && user && githubId) {
      fetchRepositories(githubId);
    }
  }, [isConnected, user]);

  const handleRepoSelect = (value: string) => {
    setSelectedRepo(value);
    // Repo dəyişəndə əvvəlki fayl ağacı və seçimi təmizlə
    setRepoFiles([]);
    setRepoLoaded(false);
    setSelectedFilePath(undefined);
    setFileContent("");
    setFileError(null);
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

  // Repo content-i çək (fayl siyahısı + folder structure) -> sağ sidebar-da tree qurulur
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

      // API cavabınız "files" massivini fərqli açarda qaytara bilər - hər ikisini yoxlayırıq
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

  // Ağacda fayl seçiləndə həmin faylın content-ini çək
  const handleFileSelect = async (path: string) => {
    setSelectedFilePath(path);
    setFileContent("");
    setFileError(null);
    setIsFileLoading(true);
    try {
      if (typeof fetchFileContent !== "function") {
        throw new Error(
          "fetchFileContent metodu useGithub hook-unda tapılmadı. Backend-də tək fayl content endpoint-i qoşub hook-a əlavə edin."
        );
      }

      const result = await fetchFileContent(selectedRepo, selectedBranch, path);

      // DEBUG: konsolda faktiki cavabın formasını görmək üçün. Problemi tapdıqdan
      // sonra bu sətri silə bilərsiniz.
      console.log("📄 fetchFileContent xam nəticə:", result);

      if (result === undefined) {
        throw new Error(
          "useGithub hook-undakı fetchFileContent heç bir dəyər qaytarmadı (undefined). Hook daxilində API cavabını return etdiyinizi yoxlayın."
        );
      }

      const extracted = extractFileContent(result);

      if (!extracted) {
        throw new Error("Fayl content-i boşdur — backend cavabının strukturunu konsoldan yoxlayın.");
      }

      setFileContent(extracted);
    } catch (err) {
      console.error("Fayl content yüklənərkən xəta:", err);
      setFileError(err instanceof Error ? err.message : "Fayl yüklənə bilmədi");
    } finally {
      setIsFileLoading(false);
    }
  };

  const isConnectedCheck = integrations.githubConnected || isConnected;

  return (
    // h-full + flex-col + overflow-hidden on the root, with only the body
    // below scrolling: this component now behaves like a panel that fits
    // whatever box it's placed in, instead of assuming it owns the whole
    // viewport. The header stays pinned; everything else scrolls under it.
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3">
        <PageHeader
          title="GitHub"
          description="Repositories connected to this workspace."
          badge={<ConnectionBadge label={isConnectedCheck ? "Connected" : "Not connected"} connected={isConnectedCheck} />}
          actions={
            !isConnectedCheck ? (
              <Button size="sm" onClick={() => connectGithub(projectId)}>
                Connect GitHub
              </Button>
            ) : undefined
          }
        />
      </div>

      {isConnectedCheck && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <Space direction="vertical" size="middle" className="w-full">
            {/* Repository / Branch seçimi və düymələr */}
            <Card size="small" className="surface">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
                <div className="min-w-[180px] flex-1">
                  <RepositorySelect repos={repos} loading={isLoadingRepos} value={selectedRepo} onChange={handleRepoSelect} />
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
                    <ReloadOutlined className={`mr-2 ${isLoadingRepos || isLoadingBranches ? "animate-spin" : ""}`} />
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
                  </span>
                </div>
              )}
            </Card>

            {/* Ortada fayl content-i, sağda fayl ağacı (sidebar) */}
            {repoLoaded && (
              <Card size="small" className="surface" bodyStyle={{ padding: 0 }}>
                {/* Fixed but modest height: this whole page already scrolls
                    (see the wrapper above), so this only needs to be tall
                    enough to be usable, not to fit everything unscrolled. */}
                <div className="flex flex-col md:flex-row h-[380px]">
                  {/* ORTA - content */}
                  <div className="flex-1 p-3 overflow-hidden min-w-0">
                    <FileContentViewer
                      filePath={selectedFilePath}
                      fileName={selectedFilePath?.split("/").pop()}
                      content={fileContent}
                      loading={isFileLoading}
                      error={fileError}
                    />
                  </div>

                  {/* SAĞ - fayl ağacı sidebar */}
                  <div className="w-full md:w-64 border-t md:border-t-0 md:border-l flex flex-col">
                    <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground shrink-0">
                      Files ({repoFiles.length})
                    </div>
                    <RepoFileTree
                      files={repoFiles}
                      selectedPath={selectedFilePath}
                      onSelectFile={handleFileSelect}
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