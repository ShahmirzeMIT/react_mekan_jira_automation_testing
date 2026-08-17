import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOutlined } from "@ant-design/icons";
import { ChevronDown, ChevronUp, PlayCircle, Terminal } from "lucide-react";
import type { RunStatus } from "@/hooks/useWebContainerRunner";
import type { PreviewRunMode } from "@/lib/buildFileSystemTree";
import type { PreviewEnvConfig } from "@/lib/previewEnv";

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
  mode: PreviewRunMode;
  onModeChange: (mode: PreviewRunMode) => void;
  onRun: (envs: PreviewEnvConfig) => void;
  disabled?: boolean;
  // Detalların (log + .env editorları) defolt açıq/bağlı olması. Preview üçün
  // maksimum yer qalsın deyə default olaraq false göndərilir.
  defaultDetailsOpen?: boolean;
}

const RUN_MODES: Array<{ value: PreviewRunMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "frontend", label: "React" },
  { value: "node", label: "Node API" },
  { value: "python", label: "Python" },
];

export function RunPanel({
  status,
  log,
  mode,
  onModeChange,
  onRun,
  disabled,
  defaultDetailsOpen = false,
}: RunPanelProps) {
  const logRef = useRef<HTMLDivElement | null>(null);
  const [backendEnv, setBackendEnv] = useState("");
  const [frontendEnv, setFrontendEnv] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  // Xəta olanda logu avtomatik göstər ki, istifadəçi səbəbi görsün.
  useEffect(() => {
    if (status === "error") setDetailsOpen(true);
  }, [status]);

  const busy = status === "boot" || status === "install" || status === "build";
  const statusClass =
    status === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : status === "live"
        ? "border-success/30 bg-success/10 text-success"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div className="shrink-0 border-b border-border bg-card px-5 py-2.5">
      <div className="flex flex-col gap-2.5">
        {/* Həmişə görünən sətir: mode seçimi, Run düyməsi, status, detalları aç/bağla */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit rounded-md border border-border bg-muted p-1">
            {RUN_MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onModeChange(item.value)}
                className={`h-7 rounded px-2.5 text-xs font-medium transition-colors ${
                  mode === item.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() =>
              onRun({
                backendEnv,
                frontendEnv,
              })
            }
            disabled={disabled || busy}
          >
            {busy ? <LoadingOutlined spin /> : <PlayCircle className="size-4" />}
            {status === "idle" || status === "error" ? "Run" : "Run again"}
          </Button>

          <span
            className={`inline-flex h-8 items-center rounded-md border px-2.5 font-mono text-[11px] font-medium uppercase ${statusClass}`}
          >
            {STATUS_LABEL[status]}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setDetailsOpen((current) => !current)}
          >
            {detailsOpen ? (
              <ChevronUp className="mr-1.5 size-3.5" aria-hidden />
            ) : (
              <ChevronDown className="mr-1.5 size-3.5" aria-hidden />
            )}
            {detailsOpen ? "Detalları gizlət" : "Log / .env göstər"}
          </Button>
        </div>

        {/* Log + .env editorları — default bağlıdır, preview-ə maksimum yer qalsın */}
        {detailsOpen && (
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-zinc-950 shadow-inner">
              <div className="flex h-8 items-center gap-2 border-b border-white/10 px-3 text-[11px] font-medium text-zinc-400">
                <Terminal className="size-3.5" aria-hidden />
                <span>Runner Log</span>
              </div>
              <div
                ref={logRef}
                className="max-h-28 min-h-16 overflow-y-auto p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-emerald-300"
              >
                {log || "Logs will appear here..."}
              </div>
            </div>
          </div>
        )}

        {detailsOpen && mode === "frontend" && (
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-2">
              <p className="text-sm font-semibold">Frontend .env</p>
              <p className="mt-1 text-xs text-muted-foreground">
                React/Vite üçün buraya `VITE_` prefiksi ilə dəyişənləri yaz. Bu hissə yalnız
                frontend rejimində görünür.
              </p>
            </div>
            <Textarea
              value={frontendEnv}
              onChange={(event) => setFrontendEnv(event.target.value)}
              placeholder={"VITE_API_URL=https://frontend-api.example.com"}
              className="min-h-24 font-mono text-xs"
            />
          </div>
        )}

        {detailsOpen && (mode === "node" || mode === "python") && (
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-2">
              <p className="text-sm font-semibold">Backend .env</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Node/Python üçün root `.env` buradadır. Firebase private key üçün `\n`-i yazın;
                runner onu avtomatik real newline-a çevirir.
              </p>
            </div>
            <Textarea
              value={backendEnv}
              onChange={(event) => setBackendEnv(event.target.value)}
              placeholder={"API_URL=https://api.example.com\nFIREBASE_PROJECT_ID=demo"}
              className="min-h-24 font-mono text-xs"
            />
          </div>
        )}

        {detailsOpen && mode === "auto" && (
          <div className="rounded-lg border border-dashed border-border bg-background/40 p-3 text-sm text-muted-foreground">
            Select React, Node API, or Python to show the matching `.env` editor.
          </div>
        )}
      </div>
    </div>
  );
}