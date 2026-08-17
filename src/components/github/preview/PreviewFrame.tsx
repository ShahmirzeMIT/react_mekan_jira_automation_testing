import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Maximize2, RefreshCw, SendHorizontal, X } from "lucide-react";
import type { PreviewRunMode } from "@/lib/buildFileSystemTree";

interface PreviewFrameProps {
  origin: string;
  path: string;
  onPathChange: (path: string) => void;
  onNavigate: (path: string) => void;
  onReload: () => void;
  iframeSrc: string;
  reloadKey: number;
  mode: PreviewRunMode;
}

export function PreviewFrame({
  origin,
  path,
  onPathChange,
  onNavigate,
  onReload,
  iframeSrc,
  reloadKey,
  mode,
}: PreviewFrameProps) {
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiPath, setApiPath] = useState("/health");
  const [apiBody, setApiBody] = useState("");
  const [apiResponse, setApiResponse] = useState("Run the Node API, then send a request.");
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Yeni browser tab-da açanda WebContainer-in cross-origin isolation
  // handshake-i qırılır və "Connect to Project" ekranı çıxır — çünki
  // webcontainer-api.io URL-i yalnız SDK-nın qoşulduğu iframe daxilində
  // işləyir. Ona görə yeni tab əvəzinə eyni iframe-i tam ekran modalda göstəririk.
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    if (!iframeSrc && fullscreenOpen) setFullscreenOpen(false);
  }, [iframeSrc, fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreenOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenOpen]);

  const apiUrl = useMemo(() => {
    if (!origin) return "";
    const normalizedPath = apiPath.trim().startsWith("/") ? apiPath.trim() : `/${apiPath.trim()}`;
    return `${origin}${normalizedPath}`;
  }, [apiPath, origin]);

  async function sendApiRequest() {
    if (!apiUrl) return;

    setApiLoading(true);
    setApiStatus(null);
    try {
      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: apiBody.trim() ? { "Content-Type": "application/json" } : undefined,
        body: ["GET", "HEAD"].includes(apiMethod) || !apiBody.trim() ? undefined : apiBody,
      });
      const contentType = response.headers.get("content-type") ?? "";
      const text = contentType.includes("application/json")
        ? JSON.stringify(await response.json(), null, 2)
        : await response.text();
      setApiStatus(`${response.status} ${response.statusText}`);
      setApiResponse(text || "(empty response)");
    } catch (error) {
      setApiStatus("Request failed");
      setApiResponse(error instanceof Error ? error.message : String(error));
    } finally {
      setApiLoading(false);
    }
  }

  if (mode === "python") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-background/95 p-3">
          <p className="text-sm font-medium">Python Output</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Python script output appears in the runner log above.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 text-center text-sm text-muted-foreground">
          Flask/FastAPI server preview is not available in browser Python mode.
        </div>
      </div>
    );
  }

  if (mode === "node") {
    return (
      <div className="grid h-full min-h-0 gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[420px_1fr]">
        <form
          className="flex min-h-0 flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendApiRequest();
          }}
        >
          <div>
            <p className="text-sm font-semibold">API Request</p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {origin || "Waiting for Node server"}
            </p>
          </div>

          <div className="grid grid-cols-[110px_1fr] gap-2">
            <select
              value={apiMethod}
              onChange={(event) => setApiMethod(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-primary"
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input
              value={apiPath}
              onChange={(event) => setApiPath(event.target.value)}
              placeholder="/api/health"
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-primary"
            />
          </div>

          <textarea
            value={apiBody}
            onChange={(event) => setApiBody(event.target.value)}
            placeholder='{"name":"test"}'
            className="min-h-36 resize-none rounded-md border border-input bg-background p-3 font-mono text-xs outline-none focus:border-primary"
          />

          <Button type="submit" disabled={!origin || apiLoading}>
            <SendHorizontal className="size-4" />
            {apiLoading ? "Sending" : "Send"}
          </Button>
        </form>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-zinc-950">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
            <span className="text-xs font-medium text-zinc-400">Response</span>
            <span className="font-mono text-xs text-zinc-500">{apiStatus ?? apiUrl}</span>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-5 whitespace-pre-wrap text-emerald-300">
            {apiResponse}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <form
        className="flex shrink-0 flex-col gap-2 border-b border-border bg-background/95 p-3 lg:flex-row lg:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate(path);
        }}
      >
        <div className="min-w-0 rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground lg:w-[340px]">
          <p className="truncate">{origin || "Waiting for runner"}</p>
        </div>

        <input
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder="/login"
          disabled={!origin}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
        />

        <div className="flex shrink-0 gap-2">
          <Button type="submit" size="sm" disabled={!origin} className="min-w-20">
            <SendHorizontal className="size-4" />
            Go
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onReload}
            disabled={!origin}
            aria-label="Reload preview"
            title="Reload preview"
          >
            <RefreshCw className="size-4" />
          </Button>

          {/* Yeni tab əvəzinə tam ekran modalda eyni (qoşulmuş) iframe-i göstərir,
              çünki webcontainer-api.io linki xam yeni tabda "Connect to Project"
              ekranı ilə açılır. */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setFullscreenOpen(true)}
            disabled={!origin || !iframeSrc}
            aria-label="Open preview full screen"
            title="Open preview full screen"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </form>

      <div className="min-h-0 flex-1 bg-white">
        {iframeSrc ? (
          <iframe
            key={reloadKey}
            src={iframeSrc}
            title="repo-preview"
            className="h-full w-full border-0"
            allow="cross-origin-isolated"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Click "Run" to display the preview here.
          </div>
        )}
      </div>

      {fullscreenOpen && iframeSrc && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
            <p className="truncate font-mono text-xs text-muted-foreground">{iframeSrc}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onReload}
                aria-label="Reload preview"
                title="Reload preview"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setFullscreenOpen(false)}
                aria-label="Close full screen preview"
                title="Close full screen preview"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-white">
            <iframe
              key={`fullscreen-${reloadKey}`}
              src={iframeSrc}
              title="repo-preview-fullscreen"
              className="h-full w-full border-0"
              allow="cross-origin-isolated"
            />
          </div>
        </div>
      )}
    </div>
  );
}