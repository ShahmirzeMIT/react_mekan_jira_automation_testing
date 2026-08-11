import type { FileSystemTree } from "@webcontainer/api";

export interface WebContainerFile {
  path: string;
  /** UTF-8 text content, OR base64-encoded content when `binary` is true. */
  content: string;
  /** True when `content` is base64-encoded binary data (images, fonts, etc). */
  binary?: boolean;
}

// Extensions that need to be written as real bytes, not a JS string.
// Writing an image as UTF-8 text corrupts it — invalid byte sequences
// get silently replaced — even though the import would "resolve" fine.
// Going through base64 -> Uint8Array avoids that entirely.
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico",
  "woff", "woff2", "ttf", "otf", "eot",
  "mp3", "wav", "ogg", "mp4", "webm", "mov",
  "pdf", "zip",
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

/**
 * Picks the dev command from package.json scripts: prefers "dev"
 * (Vite's convention), falls back to "start", and as a last resort
 * spawns `vite` directly if package.json has neither script.
 */
export function pickDevCommand(pkgJsonRaw: string): [string, string[]] {
  try {
    const pkg = JSON.parse(pkgJsonRaw);
    const scripts = pkg.scripts ?? {};
    if (scripts.dev) return ["npm", ["run", "dev"]];
    if (scripts.start) return ["npm", ["run", "start"]];
  } catch {
    // fall through to default
  }
  return ["npx", ["vite"]];
}