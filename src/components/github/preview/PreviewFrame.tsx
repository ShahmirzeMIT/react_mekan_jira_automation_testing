// src/components/github/preview/PreviewFrame.tsx
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col h-full min-h-0">
      <form
        className="flex items-stretch gap-1 border-b p-2 shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate(path);
        }}
      >
        <span
          title={origin}
          className="hidden md:flex items-center px-2 text-xs text-muted-foreground truncate max-w-[35%] bg-muted rounded-l-md border"
        >
          {origin || "…"}
        </span>
        <input
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder="/login"
          disabled={!origin}
          className="flex-1 text-sm px-2 py-1 border bg-background disabled:opacity-50"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={!origin}>
          Get
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onReload} disabled={!origin}>
          ↻
        </Button>
        <a
          href={iframeSrc || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!origin}
          className="inline-flex items-center px-2 text-sm border rounded-r-md pointer-events-auto aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          ↗
        </a>
      </form>

      <div className="flex-1 min-h-0 bg-white">
        {iframeSrc ? (
          <iframe
            key={reloadKey}
            src={iframeSrc}
            title="repo-preview"
            className="w-full h-full border-0"
            allow="cross-origin-isolated"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground px-4 text-center">
            "Run" et ki, preview burada görünsün.
          </div>
        )}
      </div>
    </div>
  );
}
