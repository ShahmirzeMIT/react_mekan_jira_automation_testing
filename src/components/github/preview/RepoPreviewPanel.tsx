// src/components/github/preview/RepoPreviewPanel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, X } from "lucide-react";
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
  fetchFileContent: (repo: string, branch: string, path: string) => Promise<unknown>;
}

export function RepoPreviewPanel({ repo, branch, files, fetchFileContent }: RepoPreviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const { status, log, path, setPath, iframeSrc, reloadKey, previewOrigin, run, navigate, reload } =
    useWebContainerRunner();

  const canOpen = !!repo && !!branch && files.length > 0;

  async function handleRun() {
    if (!repo || !branch) return;
    setPreparing(true);
    try {
      const wcFiles = await fetchAllFileContents(files, repo, branch, fetchFileContent);
      await run(wcFiles);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fayllar hazırlana bilmədi");
    } finally {
      setPreparing(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!canOpen}>
        <PlayCircle className="mr-2 h-4 w-4" />
        Preview
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:w-[560px] h-full bg-background border-l shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">Repo Preview</p>
                <p className="text-xs text-muted-foreground truncate">
                  {repo} · {branch}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <RunPanel
              status={preparing ? "boot" : status}
              log={log}
              onRun={handleRun}
              disabled={preparing}
            />

            <div className="flex-1 min-h-0">
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
