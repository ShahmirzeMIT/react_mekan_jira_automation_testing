import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, SendHorizontal } from "lucide-react";

interface PreviewFrameProps {
  origin: string;
  path: string;
  onPathChange: (path: string) => void;
  onNavigate: (path: string) => void;
  onReload: () => void;
  iframeSrc: string;
  reloadKey: number;
}

export function PreviewFrame({
  origin,
  path,
  onPathChange,
  onNavigate,
  onReload,
  iframeSrc,
  reloadKey,
}: PreviewFrameProps) {
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

          <Button
            asChild
            size="icon"
            variant="outline"
            className={!origin ? "pointer-events-none opacity-50" : undefined}
          >
            <a
              href={iframeSrc || undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!origin}
              aria-label="Open preview in new tab"
              title="Open preview in new tab"
            >
              <ExternalLink className="size-4" />
            </a>
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
    </div>
  );
}
