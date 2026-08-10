// types/gemini.ts

export interface GeminiFileChange {
  path: string;
  changed: boolean;
  reason: string;
  changes: string[];
  content: string;
}

export interface GeminiUnchangedFile {
  path: string;
  reason: string;
}

export interface GeminiTaskResult {
  task: string;
  status: "success" | "needs_more_information";
  summary: string;
  language?: string;
  framework?: string;
  files: GeminiFileChange[];
  unchangedFiles: GeminiUnchangedFile[];
  warnings: string[];
  // "needs_more_information" halında model bunu "summary" içində izah edir,
  // amma bəzən ayrıca sahə göndərə bilər deyə optional saxlayırıq.
  missingInfo?: string;
}