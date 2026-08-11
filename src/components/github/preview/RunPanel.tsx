
// src/components/github/preview/RunPanel.tsx
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LoadingOutlined } from "@ant-design/icons";
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
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const busy =
    status === "boot" || status === "install" || status === "build";

  return (
    <div>
      <Button size="sm" onClick={onRun} disabled={disabled || busy}>
        {busy && <LoadingOutlined spin />}
        {status === "idle" || status === "error"
          ? "Run"
          : "Run again"}

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
      </Button>

      <div
        ref={logRef}
        className="h-28 overflow-y-auto rounded-md bg-black text-emerald-300 text-xs font-mono p-2 whitespace-pre-wrap"
      >
        {log || "Logs will appear here…"}
      </div>
    </div>
  );
}

