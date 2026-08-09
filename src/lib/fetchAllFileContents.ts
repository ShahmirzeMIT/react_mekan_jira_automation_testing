// src/lib/fetchAllFileContents.ts
import { extractFileContent } from "@/lib/extractFileContent";
import type { WebContainerFile } from "@/lib/buildFileSystemTree";
import type { RepoFileEntry } from "@/components/github/RepoFileTree";

const SKIP_PATTERN = /\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|lock)$/i;
const MAX_FILES = 400;
const CONCURRENCY = 6;

type FetchFileContentFn = (
  repo: string,
  branch: string,
  path: string
) => Promise<unknown>;

/**
 * repoFiles (from fetchRepoContent) only carries paths/structure — the actual
 * text is fetched per-file lazily in the UI. Before we can mount anything in
 * WebContainer we need *every* file's content, so this fans the same
 * fetchFileContent call out across all files with a small concurrency limit.
 */
export async function fetchAllFileContents(
  entries: RepoFileEntry[],
  repo: string,
  branch: string,
  fetchFileContent: FetchFileContentFn
): Promise<WebContainerFile[]> {
  const targets = entries
    // RepoFileEntry may or may not carry a `type` field depending on your
    // backend — this drops obvious non-files without breaking if it's absent.
    .filter((e: any) => e.type !== "dir" && e.type !== "directory" && !SKIP_PATTERN.test(e.path))
    .slice(0, MAX_FILES);

  const results: WebContainerFile[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const entry = targets[cursor++];
      try {
        const raw = await fetchFileContent(repo, branch, entry.path);
        const content = extractFileContent(raw);
        if (content) results.push({ path: entry.path, content });
      } catch (err) {
        console.warn(`Fayl alınmadı: ${entry.path}`, err);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (!results.some((f) => f.path === "package.json")) {
    throw new Error(
      "Bu branch-də package.json tapılmadı (və ya alınmadı) — WebContainer npm layihəsi tələb edir."
    );
  }

  return results;
}
