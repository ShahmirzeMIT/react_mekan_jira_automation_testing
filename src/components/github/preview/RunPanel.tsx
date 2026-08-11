import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LoadingOutlined } from "@ant-design/icons";
import { PlayCircle, Terminal } from "lucide-react";
import type { RunStatus } from "@/hooks/useWebContainerRunner";

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: "Not ready",
  boot: "Starting container",
  install: "npm install",
  build: "Starting dev server",
  live: "Live",
  error: "Error",
};

interface RunPanelProps {
  status: RunStatus;
  log: string;
  onRun: () => void;
  disabled?: boolean;
}

export function RunPanel({ status, log, onRun, disabled }: RunPanelProps) {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const busy = status === "boot" || status === "install" || status === "build";
  const statusClass =
    status === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : status === "live"
        ? "border-success/30 bg-success/10 text-success"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div className="shrink-0 border-b border-border bg-card px-5 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        <div className="flex min-w-[190px] flex-wrap items-center gap-2">
          <Button size="sm" onClick={onRun} disabled={disabled || busy}>
            {busy ? <LoadingOutlined spin /> : <PlayCircle className="size-4" />}
            {status === "idle" || status === "error" ? "Run" : "Run again"}
          </Button>

          <span
            className={`inline-flex h-8 items-center rounded-md border px-2.5 font-mono text-[11px] font-medium uppercase ${statusClass}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-zinc-950 shadow-inner">
          <div className="flex h-8 items-center gap-2 border-b border-white/10 px-3 text-[11px] font-medium text-zinc-400">
            <Terminal className="size-3.5" aria-hidden />
            <span>Runner Log</span>
          </div>
          <div
            ref={logRef}
            className="max-h-32 min-h-20 overflow-y-auto p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-emerald-300"
          >
            {log || "Logs will appear here..."}
          </div>
        </div>
      </div>
    </div>
  );
}
