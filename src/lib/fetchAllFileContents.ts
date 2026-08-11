import type { WebContainerFile } from "@/lib/buildFileSystemTree";
import { isBinaryPath } from "@/lib/buildFileSystemTree";

export interface RepoFileEntryLike {
  path: string;
  type?: string;
  size?: number;
}

type FetchFileContent = (repo: string, branch: string, path: string) => Promise<string>;

const MAX_FILE_SIZE = 5_000_000; // 5MB safety cap — raise if you have larger assets
const CONCURRENCY = 8;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Fetches a binary asset directly from raw.githubusercontent.com as raw
 * bytes and base64-encodes it. Works without auth for public repos.
 * Returns null on any failure (private repo, 404, network error) so the
 * caller can fall back to `fetchFileContent`.
 */
async function fetchBinaryFromRawGithub(
  repo: string,
  branch: string,
  path: string
): Promise<string | null> {
  try {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${encodedPath}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return arrayBufferToBase64(buf);
  } catch {
    return null;
  }
}

/**
 * Fetches content for every file in `entries` and returns them ready
 * for buildFileSystemTree(). Deliberately does NOT filter by extension
 * — dropping any file here (images, fonts, etc.) is exactly what causes
 * Vite's "Failed to resolve import" errors for asset imports.
 *
 * Binary files (images, fonts, audio, etc.) are fetched as raw bytes and
 * base64-encoded so buildFileSystemTree can mount them correctly. Text
 * files go through the existing `fetchFileContent` callback unchanged.
 */
export async function fetchAllFileContents(
  entries: RepoFileEntryLike[],
  repo: string,
  branch: string,
  fetchFileContent: FetchFileContent
): Promise<WebContainerFile[]> {
  const wanted = entries.filter((e) => (e.size ?? 0) < MAX_FILE_SIZE);
  const results: WebContainerFile[] = [];
  const failed: string[] = [];

  let i = 0;
  async function worker() {
    while (i < wanted.length) {
      const entry = wanted[i++];
      const binary = isBinaryPath(entry.path);

      try {
        if (binary) {
          // Try a direct raw-content fetch first — this is what
          // actually fixes corrupted images, since it gets real bytes
          // instead of routing through a text-decoding fetch fn.
          const b64 = await fetchBinaryFromRawGithub(repo, branch, entry.path);
          if (b64 !== null) {
            results.push({ path: entry.path, content: b64, binary: true });
            continue;
          }

          // Fallback for private repos or if the raw fetch failed for
          // any other reason: use the app's existing fetch function.
          // If that function decodes binary content as UTF-8 text
          // internally, the resulting asset can still come out
          // corrupted — but at least the file will exist in the
          // mounted filesystem, which is what fixes "Failed to
          // resolve import". Getting the image byte-perfect for
          // private repos requires fetchFileContent itself to support
          // returning base64 for binary paths.
          const raw = await fetchFileContent(repo, branch, entry.path);
          results.push({ path: entry.path, content: raw, binary: true });
        } else {
          const content = await fetchFileContent(repo, branch, entry.path);
          results.push({ path: entry.path, content, binary: false });
        }
      } catch (err) {
        failed.push(entry.path);
        console.warn(`Fayl alınmadı: ${entry.path}`, err);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (failed.length > 0) {
    console.warn(`${failed.length} fayl alınmadı:`, failed);
  }

  return results;
}