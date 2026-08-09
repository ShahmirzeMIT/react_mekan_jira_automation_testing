// src/components/github/preview/RunPanel.tsx
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LoadingOutlined } from "@ant-design/icons";
import type { RunStatus } from "@/hooks/useWebContainerRunner";

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: "Hazır deyil",
  boot: "Konteyner qalxır",
  install: "npm install",
  build: "Dev server başlayır",
  live: "Canlı",
  error: "Xəta",
};

interface RunPanelProps {
  status: RunStatus;
  log: string;
  onRun: () => void;
  disabled?: boolean;
}

export function RunPanel({ status, log, onRun, disabled }: RunPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const busy = status === "boot" || status === "install" || status === "build";

  return (
    <div className="p-3 border-b space-y-2 shrink-0">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={onRun} disabled={disabled || busy}>
          {busy && <LoadingOutlined className="mr-2 animate-spin" />}
          {status === "idle" || status === "error" ? "Run" : "Yenidən run et"}
        </Button>
        <span
          className={
            "text-xs uppercase tracking-wide " +
            (status === "error"
              ? "text-destructive"
              : status === "live"
              ? "text-emerald-500"
              : "text-muted-foreground")
          }
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div
        ref={logRef}
        className="h-28 overflow-y-auto rounded-md bg-black text-emerald-300 text-xs font-mono p-2 whitespace-pre-wrap"
      >
        {log || "log burada görünəcək…"}
      </div>
    </div>
  );
}
