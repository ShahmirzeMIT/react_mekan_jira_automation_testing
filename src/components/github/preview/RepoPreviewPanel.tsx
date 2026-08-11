import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, PlayCircle, X } from "lucide-react";
import { toast } from "sonner";
import type { RepoFileEntry } from "@/components/github/RepoFileTree";
import { useWebContainerRunner } from "@/hooks/useWebContainerRunner";
import { fetchAllFileContents } from "@/lib/fetchAllFileContents";
import { RunPanel } from "./RunPanel";
import { PreviewFrame } from "./PreviewFrame";

interface RepoPreviewPanelProps {
  repo?: string;
  branch?: string;
  files: RepoFileEntry[];
  fetchFileContent: (repo: string, branch: string, path: string) => Promise<string>;
}

export function RepoPreviewPanel({ repo, branch, files, fetchFileContent }: RepoPreviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const {
    status,
    log,
    path,
    setPath,
    iframeSrc,
    reloadKey,
    previewOrigin,
    popupBlocked,
    openRunner,
    openRunnerManually,
    run,
    navigate,
    reload,
  } = useWebContainerRunner();

  const canOpen = !!repo && !!branch && files.length > 0;

  // openRunner() MUST be the very first thing that happens in this
  // handler, synchronously, before the await below — that's what keeps
  // window.open() inside the "was this triggered by a real click"
  // window browsers check for popup blocking.
  function handleRun() {
    if (!repo || !branch) return;

    openRunner();

    setPreparing(true);
    (async () => {
      try {
        const wcFiles = await fetchAllFileContents(files, repo, branch, fetchFileContent);
        run(wcFiles);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fayllar hazırlana bilmədi");
      } finally {
        setPreparing(false);
      }
    })();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!canOpen}>
        <PlayCircle className="mr-1 h-4 w-4" />
        Preview
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close preview"
            onClick={() => setOpen(false)}
          />

          <div
            className={
              expanded
                ? "relative flex h-full w-full flex-col bg-background shadow-2xl"
                : "relative flex h-full w-full max-w-[min(1480px,96vw)] flex-col border-l border-border bg-background shadow-2xl"
            }
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Maximize2 className="size-4" aria-hidden />
                  </span>
                  <p className="text-base font-semibold">Repo Preview</p>
                </div>
                <p className="mt-1 truncate pl-10 font-mono text-xs text-muted-foreground">
                  {repo} · {branch}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpanded((current) => !current)}
                  aria-label={expanded ? "Exit full screen preview" : "Open full screen preview"}
                  title={expanded ? "Exit full screen" : "Full screen"}
                >
                  {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <RunPanel
              status={preparing ? "boot" : status}
              log={log}
              onRun={handleRun}
              disabled={preparing}
            />

            {popupBlocked && (
              <div className="flex shrink-0 flex-col gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                <span className="leading-5">
                  Brauzer runner pəncərəsini blok etdi. Zəhmət olmasa aşağıdan əl ilə aç, ya da bu
                  sayt üçün pop-up-lara icazə ver.
                </span>
                <Button size="sm" onClick={openRunnerManually} className="shrink-0">
                  Runner-i aç
                </Button>
              </div>
            )}

            <div className="min-h-0 flex-1 bg-muted/30 p-4">
              <PreviewFrame
                origin={previewOrigin}
                path={path}
                onPathChange={setPath}
                onNavigate={navigate}
                onReload={reload}
                iframeSrc={iframeSrc}
                reloadKey={reloadKey}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
