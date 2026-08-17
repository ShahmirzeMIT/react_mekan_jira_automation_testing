// components/ai-workspace/AIResultDrawer.tsx
import { useState } from "react";
import { Drawer, Collapse, Tag, Alert, Empty, Input, Spin } from "antd";
import {
  FileCode2,
  FileCheck2,
  AlertTriangle,
  UploadCloud,
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { GeminiTaskResult } from "@/types/gemini";
import { CodeBlock } from "./CodeBlock";
import { Button } from "@/components/ui/button";
import { apiCall } from "@/api/apiCall";

interface AIResultDrawerProps {
  open: boolean;
  onClose: () => void;
  result: GeminiTaskResult | null;
  rawFallback?: string | null;
  // Commit/push üçün lazım olan repo konteksti. Verilmirsə düymələr gizlənir.
  userId?: string | null;
  owner?: string | null;
  repo?: string | null;
  branch?: string | null;
}

interface CommitApiResponse {
  success: boolean;
  commit: unknown;
}

interface PushApiResponse {
  success: boolean;
  commit: unknown;
}

export function AIResultDrawer({
  open,
  onClose,
  result,
  rawFallback,
  userId,
  owner,
  repo,
  branch,
}: AIResultDrawerProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [committingPath, setCommittingPath] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);

  const canCommitOrPush = Boolean(userId && owner && repo);
  const effectiveBranch = branch || "main";
  const isBusy = pushing || committingPath !== null;

  function defaultMessage(fallback: string) {
    return commitMessage.trim() || fallback;
  }

  async function handleCommitFile(path: string, content: string) {
    if (!canCommitOrPush) {
      toast.error("Repository konteksti tapılmadı (owner/repo/userId).");
      return;
    }
    if (isBusy) return;

    setCommittingPath(path);
    try {
      const res = await apiCall<CommitApiResponse>("/github/commit", "POST", {
        userId,
        owner,
        repo,
        path,
        content,
        message: defaultMessage(`Update ${path}`),
      });

      if (res?.success) {
        toast.success(`Commit edildi: ${path}`);
      } else {
        toast.error(`Commit uğursuz oldu: ${path}`);
      }
    } catch (err) {
      console.error("Commit error:", err);
      toast.error(err instanceof Error ? err.message : `Commit alınmadı: ${path}`);
    } finally {
      setCommittingPath(null);
    }
  }

  async function handlePushAll() {
    if (!canCommitOrPush) {
      toast.error("Repository konteksti tapılmadı (owner/repo/userId).");
      return;
    }
    if (!result?.files?.length) {
      toast.error("Push ediləcək dəyişən fayl yoxdur.");
      return;
    }
    if (isBusy) return;

    setPushing(true);
    try {
      const files = result.files.map((f) => ({
        path: f.path,
        content: f.content,
      }));

      const res = await apiCall<PushApiResponse>("/github/push", "POST", {
        userId,
        owner,
        repo,
        branch: effectiveBranch,
        files,
        message: defaultMessage(`AI: ${result.summary || result.task || "update files"}`),
      });

      if (res?.success) {
        toast.success(`${files.length} fayl "${effectiveBranch}" branch-ına push edildi.`);
      } else {
        toast.error("Push uğursuz oldu.");
      }
    } catch (err) {
      console.error("Push error:", err);
      toast.error(err instanceof Error ? err.message : "Push alınmadı.");
    } finally {
      setPushing(false);
    }
  }

  const showRepoActions =
    result && result.status !== "needs_more_information" && (result.files?.length ?? 0) > 0;

  return (
    <Drawer
      title={result ? result.task : "AI Response"}
      open={open}
      onClose={isBusy ? undefined : onClose}
      closable={!isBusy}
      maskClosable={!isBusy}
      width="min(760px, 100vw)"
      destroyOnClose
    >
      {!result ? (
        rawFallback ? (
          // JSON parse alınmadı - heç olmasa xam cavabı göstərək ki, itməsin.
          <div className="space-y-2">
            <Alert
              type="warning"
              showIcon
              message="AI cavabı gözlənilən JSON formatında deyil"
              description="Xam cavab aşağıda göstərilir."
            />
            <CodeBlock code={rawFallback} />
          </div>
        ) : (
          <Empty description="Nəticə yoxdur" />
        )
      ) : (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag color={result.status === "success" ? "green" : "orange"}>
              {result.status === "success" ? "Success" : "Needs more information"}
            </Tag>
            {result.language && <Tag color="blue">{result.language}</Tag>}
            {result.framework && <Tag color="purple">{result.framework}</Tag>}
          </div>

          {/* Summary - text hissə, kod hissəsindən ayrı */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<AlertTriangle className="size-4" />}
              message="Warnings"
              description={
                <ul className="list-disc pl-4 text-xs space-y-0.5">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              }
            />
          )}

          {/* Commit/Push paneli */}
          {showRepoActions && (
            <Spin spinning={isBusy} tip={pushing ? "Push edilir…" : "Commit edilir…"}>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Repository-ə göndər
                  </p>
                  {(owner || repo) && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {owner}/{repo} → {effectiveBranch}
                    </span>
                  )}
                </div>

                <Input
                  placeholder="Commit mesajı (boş buraxsanız avtomatik yaranacaq)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={!canCommitOrPush || isBusy}
                />

                <div className="flex items-center justify-between gap-2">
                  {!canCommitOrPush && (
                    <span className="text-[11px] text-destructive">
                      Repository seçilməyib — commit/push deaktivdir.
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handlePushAll}
                    disabled={!canCommitOrPush || isBusy || (result.files?.length ?? 0) === 0}
                    className="ml-auto"
                  >
                    {pushing ? (
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    ) : (
                      <UploadCloud className="mr-2 size-4" aria-hidden />
                    )}
                    {pushing ? "Push edilir…" : `Bütün faylları push et (${result.files.length})`}
                  </Button>
                </div>
              </div>
            </Spin>
          )}

          {/* needs_more_information halında fayl göstərmirik, izah kifayətdir */}
          {result.status === "needs_more_information" ? null : (
            <>
              {/* Dəyişən fayllar */}
              {result.files?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileCode2 className="size-3.5" />
                    Changed files ({result.files.length})
                  </h3>
                  <Collapse
                    bordered={false}
                    defaultActiveKey={result.files.length === 1 ? [result.files[0].path] : []}
                    className="bg-transparent"
                  >
                    {result.files.map((file) => {
                      const isCommittingThis = committingPath === file.path;
                      return (
                        <Collapse.Panel
                          key={file.path}
                          header={<span className="font-mono text-xs">{file.path}</span>}
                        >
                          <Spin spinning={isCommittingThis} tip="Commit edilir…">
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">{file.reason}</p>
                              {file.changes?.length > 0 && (
                                <ul className="list-disc pl-4 text-xs space-y-0.5">
                                  {file.changes.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              )}
                              <CodeBlock path={file.path} code={file.content} />

                              {canCommitOrPush && (
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCommitFile(file.path, file.content)}
                                    disabled={isBusy}
                                  >
                                    {isCommittingThis ? (
                                      <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
                                    ) : (
                                      <GitCommitHorizontal className="mr-2 size-3.5" aria-hidden />
                                    )}
                                    {isCommittingThis ? "Commit edilir…" : "Bu faylı commit et"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Spin>
                        </Collapse.Panel>
                      );
                    })}
                  </Collapse>
                </div>
              )}

              {/* Dəyişməyən fayllar */}
              {result.unchangedFiles?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileCheck2 className="size-3.5" />
                    Unchanged files ({result.unchangedFiles.length})
                  </h3>
                  <Collapse bordered={false} className="bg-transparent">
                    {result.unchangedFiles.map((file) => (
                      <Collapse.Panel key={file.path} header={<span className="font-mono text-xs">{file.path}</span>}>
                        <p className="text-xs text-muted-foreground">{file.reason}</p>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}