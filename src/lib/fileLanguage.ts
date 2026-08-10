// lib/fileLanguage.ts

const EXT_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  java: "java",
  go: "go",
  rs: "rust",
  cpp: "cpp",
  cc: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  vue: "vue",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  sql: "sql",
  sh: "bash",
};

export function guessLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANGUAGE[ext] ?? "text";
}