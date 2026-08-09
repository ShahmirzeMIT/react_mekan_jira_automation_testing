// components/github/FileContentViewer.tsx

// VS Code-un öz istifadə etdiyi editor: npm install @monaco-editor/react
import { useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Loader2, FileWarning, FileCode } from "lucide-react";
import { Empty } from "antd";

interface FileContentViewerProps {
  fileName?: string;
  filePath?: string;
  content?: string;
  loading?: boolean;
  error?: string | null;
}

// Fayl uzantısına görə Monaco-nun tanıdığı dil id-sinə map edir
// (bax: https://microsoft.github.io/monaco-editor/ üçün dəstəklənən dillər)
const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  py: "python",
  java: "java",
  go: "go",
  rb: "ruby",
  php: "php",
  rs: "rust",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  swift: "swift",
  kt: "kotlin",
  yml: "yaml",
  yaml: "yaml",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  xml: "xml",
  md: "markdown",
  env: "ini",
  toml: "ini",
  vue: "html",
  graphql: "graphql",
  gql: "graphql",
};

function getLanguage(name?: string): string {
  if (!name) return "plaintext";
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

// Monaco yüklənərkən (həm ilk dəfə bundle-ı çəkəndə, həm fayl dəyişəndə)
// göstərilən VS Code üslublu "skeleton" - sətir simulyasiyası
function EditorSkeleton() {
  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-hidden p-4 space-y-2">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/10 animate-pulse"
          style={{
            width: `${30 + Math.random() * 55}%`,
            marginLeft: i % 5 === 0 ? 0 : `${(i % 4) * 14}px`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function FileContentViewer({ fileName, filePath, content, loading, error }: FileContentViewerProps) {
  const language = useMemo(() => getLanguage(fileName ?? filePath), [fileName, filePath]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 border-b pb-2 mb-3 px-1">
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
          <span className="text-sm text-muted-foreground">Fayl yüklənir...</span>
        </div>
        <div className="flex-1 rounded-md overflow-hidden border">
          <EditorSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive gap-2 py-20">
        <FileWarning className="h-6 w-6" />
        <span className="text-sm text-center max-w-sm">{error}</span>
      </div>
    );
  }

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Empty description="Baxmaq üçün sağdan bir fayl seçin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fayl dəyişəndə yumşaq fade + slide-up animasiyası */}
      <style>{`
        @keyframes fileFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .file-content-enter {
          animation: fileFadeIn 0.22s ease-out;
        }
      `}</style>

      <div className="flex items-center gap-2 border-b pb-2 mb-3 px-1">
        <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{fileName ?? filePath}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/60">
          {language}
        </span>
      </div>

      {/* key={filePath} - hər yeni faylda komponenti yenidən mount edir ki,
          fade-in animasiyası hər dəfə təzədən işləsin */}
      <div key={filePath} className="file-content-enter flex-1 rounded-md overflow-hidden border">
        <Editor
          height="100%"
          language={language}
          value={content ?? ""}
          theme="vs-dark"
          loading={<EditorSkeleton />}
          options={{
            readOnly: true,
            domReadOnly: true,
            minimap: { enabled: true, scale: 1 },
            fontSize: 13,
            fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Consolas, monospace",
            fontLigatures: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            wordWrap: "on",
            contextmenu: false,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}