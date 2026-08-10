// components/ai-workspace/SelectedFilesMenu.tsx

import { useState } from "react";
import { Popover } from "antd";
import { Paperclip, X, Loader2 } from "lucide-react";
import type { SelectedGithubFile } from "@/components/ai-workspace/GithubFiles";

interface SelectedFilesMenuProps {
  files: SelectedGithubFile[];
  onRemove: (path: string) => void;
}

export function SelectedFilesMenu({ files, onRemove }: SelectedFilesMenuProps) {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="w-72 max-h-80 overflow-y-auto">
      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          Hələ heç bir fayl seçilməyib. GitHub tree-də faylın yanındakı qutucuğa klikləyin.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {files.map((file) => (
            <li
              key={file.path}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors"
            >
              {file.loading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{file.path.split("/").pop()}</p>
                <p className="truncate text-[10px] text-muted-foreground">{file.path}</p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(file.path)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                aria-label={`${file.path} faylını seçimdən sil`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="Seçilmiş fayllar"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <button
        type="button"
        className="relative flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/60 transition-colors"
      >
        <Paperclip className="h-3.5 w-3.5" />
        Files
        {files.length > 0 && (
          <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {files.length}
          </span>
        )}
      </button>
    </Popover>
  );
}