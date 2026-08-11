export interface PreviewEnvConfig {
  backendEnv: string;
  frontendEnv: string;
}

export const EMPTY_PREVIEW_ENV: PreviewEnvConfig = {
  backendEnv: "",
  frontendEnv: "",
};

export function buildPreviewEnvFileContent(env: PreviewEnvConfig): string {
  const parts = [env.backendEnv.trim(), env.frontendEnv.trim()].filter(Boolean);
  return parts.join("\n\n");
}

export function parseDotEnv(contents: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trimStart() : trimmed;
    const equalsIndex = withoutExport.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = withoutExport.slice(0, equalsIndex).trim();
    if (!key) continue;

    let value = withoutExport.slice(equalsIndex + 1).trim();
    if (!value) {
      env[key] = "";
      continue;
    }

    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));

    if (isQuoted && value.length >= 2) {
      value = value.slice(1, -1);
      if (value.includes("\\")) {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\");
      }
    } else {
      const inlineCommentIndex = value.indexOf(" #");
      if (inlineCommentIndex >= 0) {
        value = value.slice(0, inlineCommentIndex).trimEnd();
      }
    }

    if (/PRIVATE_KEY/i.test(key)) {
      value = value.replace(/\\n/g, "\n");
    }

    env[key] = value;
  }

  return env;
}
