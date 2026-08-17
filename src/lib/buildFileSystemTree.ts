import type { FileSystemTree } from "@webcontainer/api";

export interface WebContainerFile {
  path: string;
  /** UTF-8 text content, OR base64-encoded content when `binary` is true. */
  content: string;
  /** True when `content` is base64-encoded binary data (images, fonts, etc). */
  binary?: boolean;
}

export type PreviewRunMode = "auto" | "frontend" | "node" | "python";

export interface PickedRunCommand {
  command: string;
  args: string[];
  mode: Exclude<PreviewRunMode, "auto">;
  label: string;
  install: boolean;
}

// Extensions that need to be written as real bytes, not a JS string.
// Writing an image as UTF-8 text corrupts it — invalid byte sequences
// get silently replaced — even though the import would "resolve" fine.
// Going through base64 -> Uint8Array avoids that entirely.
const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "bmp",
  "ico",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "mp3",
  "wav",
  "ogg",
  "mp4",
  "webm",
  "mov",
  "pdf",
  "zip",
]);

export function isBinaryPath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return BINARY_EXTENSIONS.has(ext);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Converts a flat file list into the nested FileSystemTree shape
 * WebContainer.mount() expects, creating intermediate directories as
 * needed. Binary files are written as raw bytes decoded from base64;
 * everything else is written as UTF-8 text.
 */
export function buildFileSystemTree(files: WebContainerFile[]): FileSystemTree {
  const root: FileSystemTree = {};

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let cursor: FileSystemTree = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      const existing = cursor[dir];
      if (!existing || !("directory" in existing)) {
        cursor[dir] = { directory: {} };
      }
      cursor = (cursor[dir] as { directory: FileSystemTree }).directory;
    }

    const filename = parts[parts.length - 1];
    const binary = file.binary ?? isBinaryPath(file.path);

    cursor[filename] = binary
      ? { file: { contents: base64ToUint8Array(file.content) } }
      : { file: { contents: file.content } };
  }

  return root;
}

function hasFile(files: WebContainerFile[], path: string): boolean {
  return files.some((file) => file.path.replace(/^\/+/, "") === path);
}

function findFirstFile(files: WebContainerFile[], candidates: string[]): string | null {
  return candidates.find((path) => hasFile(files, path)) ?? null;
}

function readTextFile(files: WebContainerFile[], path: string): string | null {
  const file = files.find((item) => item.path.replace(/^\/+/, "") === path);
  return file && !file.binary ? file.content : null;
}

function parsePackageScripts(pkgJsonRaw: string | null): Record<string, string> {
  if (!pkgJsonRaw) return {};
  try {
    const pkg = JSON.parse(pkgJsonRaw);
    return pkg && typeof pkg.scripts === "object" && pkg.scripts !== null ? pkg.scripts : {};
  } catch {
    return {};
  }
}

function hasFrontendEntry(files: WebContainerFile[]): boolean {
  return (
    hasFile(files, "index.html") ||
    files.some((file) => /(^|\/)(App|main|index)\.(tsx|jsx|ts|js)$/.test(file.path))
  );
}

function hasPythonEntry(files: WebContainerFile[]): boolean {
  return files.some((file) => file.path.endsWith(".py"));
}

function hasNodeEntry(files: WebContainerFile[]): boolean {
  return Boolean(
    findFirstFile(files, [
      "server.js",
      "server.ts",
      "app.js",
      "app.ts",
      "index.js",
      "index.ts",
      "src/server.js",
      "src/server.ts",
      "src/app.js",
      "src/app.ts",
      "src/index.js",
      "src/index.ts",
    ]),
  );
}

function chooseAutoMode(files: WebContainerFile[]): Exclude<PreviewRunMode, "auto"> {
  if (hasPythonEntry(files) && !hasFile(files, "package.json")) return "python";
  if (hasFrontendEntry(files)) return "frontend";
  if (hasNodeEntry(files) || hasFile(files, "package.json")) return "node";
  if (hasPythonEntry(files)) return "python";
  return "frontend";
}

export function pickRunCommand(
  files: WebContainerFile[],
  requestedMode: PreviewRunMode,
): PickedRunCommand {
  const mode = requestedMode === "auto" ? chooseAutoMode(files) : requestedMode;
  const scripts = parsePackageScripts(readTextFile(files, "package.json"));

  if (mode === "frontend") {
    if (scripts.dev)
      return { command: "npm", args: ["run", "dev"], mode, label: "npm run dev", install: true };
    if (scripts.start) {
      return {
        command: "npm",
        args: ["run", "start"],
        mode,
        label: "npm run start",
        install: true,
      };
    }
    return { command: "npx", args: ["vite"], mode, label: "npx vite", install: true };
  }

  if (mode === "node") {
    const script = ["dev", "start", "server", "api"].find((name) => scripts[name]);
    if (script) {
      return {
        command: "npm",
        args: ["run", script],
        mode,
        label: `npm run ${script}`,
        install: true,
      };
    }

    const entry = findFirstFile(files, [
      "server.js",
      "app.js",
      "index.js",
      "src/server.js",
      "src/app.js",
      "src/index.js",
    ]);
    if (entry)
      return {
        command: "node",
        args: [entry],
        mode,
        label: `node ${entry}`,
        install: hasFile(files, "package.json"),
      };

    const tsEntry = findFirstFile(files, [
      "server.ts",
      "app.ts",
      "index.ts",
      "src/server.ts",
      "src/app.ts",
      "src/index.ts",
    ]);
    if (tsEntry) {
      return {
        command: "npx",
        args: ["tsx", tsEntry],
        mode,
        label: `npx tsx ${tsEntry}`,
        install: true,
      };
    }
  }

  throw new Error("Bu repo üçün run command tapılmadı.");
}

export function pickPythonEntry(files: WebContainerFile[]): WebContainerFile | null {
  const candidates = [
    "main.py",
    "app.py",
    "server.py",
    "src/main.py",
    "src/app.py",
    "src/server.py",
    "index.py",
  ];
  const path = findFirstFile(files, candidates);
  if (path) return files.find((file) => file.path.replace(/^\/+/, "") === path) ?? null;
  return files.find((file) => file.path.endsWith(".py") && !file.binary) ?? null;
}

export function looksLikePythonWebServer(content: string): boolean {
  return /\b(flask|fastapi|uvicorn|django|aiohttp)\b/i.test(content);
}

/** Backward-compatible helper for older callers. */
export function pickDevCommand(pkgJsonRaw: string): [string, string[]] {
  const scripts = parsePackageScripts(pkgJsonRaw);
  if (scripts.dev) return ["npm", ["run", "dev"]];
  if (scripts.start) return ["npm", ["run", "start"]];
  return ["npx", ["vite"]];
}
