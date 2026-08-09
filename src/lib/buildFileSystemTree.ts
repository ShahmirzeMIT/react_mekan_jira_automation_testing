// src/lib/buildFileSystemTree.ts

export interface WebContainerFile {
  path: string;
  content: string;
}

/**
 * Converts [{ path: 'src/App.tsx', content: '...' }, ...] into the nested
 * FileSystemTree shape webcontainer.mount() expects.
 */
export function buildFileSystemTree(files: WebContainerFile[]): Record<string, unknown> {
  const root: Record<string, any> = {};

  for (const { path, content } of files) {
    const parts = path.split("/").filter(Boolean);
    let node = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      if (isLast) {
        node[part] = { file: { contents: content } };
      } else {
        node[part] = node[part] || { directory: {} };
        node = node[part].directory;
      }
    });
  }

  return root;
}

/** Best-guess dev command based on package.json scripts. */
export function pickDevCommand(pkgJsonText: string): [string, string[]] {
  try {
    const pkg = JSON.parse(pkgJsonText);
    const scripts = pkg.scripts || {};
    if (scripts.dev) return ["npm", ["run", "dev"]];
    if (scripts.start) return ["npm", ["run", "start"]];
    if (scripts.serve) return ["npm", ["run", "serve"]];
  } catch {
    // fall through
  }
  return ["npm", ["run", "dev"]];
}
