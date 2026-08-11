import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Maximize2, Minimize2, PlayCircle, Radio, X } from "lucide-react";
import { toast } from "sonner";
import type { RepoFileEntry } from "@/components/github/RepoFileTree";
import { useWebContainerRunner } from "@/hooks/useWebContainerRunner";
import { fetchAllFileContents } from "@/lib/fetchAllFileContents";
import type { PreviewRunMode } from "@/lib/buildFileSystemTree";
import type { PreviewEnvConfig } from "@/lib/previewEnv";
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
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [runMode, setRunMode] = useState<PreviewRunMode>("auto");
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
  const effectiveStatus = preparing ? "boot" : status;
  const isLive = effectiveStatus === "ready" || effectiveStatus === "running";

  // Mount closed, then flip to visible on the next frame so the
  // enter transition (opacity + translate) actually animates instead
  // of snapping in.
  useEffect(() => {
    if (!open) return;
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function close() {
    setVisible(false);
    window.setTimeout(() => setOpen(false), 180);
  }

  // openRunner() MUST be the very first thing that happens in this
  // handler, synchronously, before the await below — that's what keeps
  // window.open() inside the "was this triggered by a real click"
  // window browsers check for popup blocking.
  function handleRun(envs: PreviewEnvConfig) {
    if (!repo || !branch) return;

    openRunner();

    setPreparing(true);
    (async () => {
      try {
        const wcFiles = await fetchAllFileContents(files, repo, branch, fetchFileContent);
        run(wcFiles, runMode, envs);
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
        <PlayCircle className="mr-1.5 h-4 w-4" />
        Preview
      </Button>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close preview"
            onClick={close}
          />

          <div
            className={`relative flex h-full w-full flex-col border-l border-border bg-background shadow-2xl transition-transform duration-200 ease-out ${
              expanded ? "max-w-full" : "max-w-[min(1480px,96vw)]"
            } ${visible ? "translate-x-0" : "translate-x-6"}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex size-2 shrink-0 rounded-full ${
                    isLive
                      ? "bg-emerald-500"
                      : effectiveStatus === "error"
                        ? "bg-red-500"
                        : "bg-muted-foreground/40"
                  }`}
                  aria-hidden
                >
                  {isLive && (
                    <span className="size-2 animate-ping rounded-full bg-emerald-500" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">Repo Preview</p>
                  <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">{repo}</span>{" "}
                    <span className="text-muted-foreground/60">·</span> {branch}
                  </p>
                </div>
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
                <Button size="icon" variant="ghost" onClick={close} aria-label="Close preview">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <RunPanel
              status={effectiveStatus}
              log={log}
              mode={runMode}
              onModeChange={setRunMode}
              onRun={handleRun}
              disabled={preparing}
            />

            {popupBlocked && (
              <div className="flex shrink-0 flex-col gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2 leading-5 sm:items-center">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden />
                  Brauzer runner pəncərəsini blok etdi. Zəhmət olmasa aşağıdan əl ilə aç, ya da bu
                  sayt üçün pop-up-lara icazə ver.
                </span>
                <Button size="sm" onClick={openRunnerManually} className="shrink-0">
                  Runner-i aç
                </Button>
              </div>
            )}

            <div className="min-h-0 flex-1 bg-muted/30 p-4">
              <div className="h-full overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                <PreviewFrame
                  origin={previewOrigin}
                  path={path}
                  onPathChange={setPath}
                  onNavigate={navigate}
                  onReload={reload}
                  iframeSrc={iframeSrc}
                  reloadKey={reloadKey}
                  mode={runMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}