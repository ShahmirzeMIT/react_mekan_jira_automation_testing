import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { apiCall } from "@/api/apiCall";

const ai = new GoogleGenAI({
  apiKey: import.meta.env["VITE_GEMINI_API_KEY"],
});

// yalnız bu sətri dəyiş, faylın qalanı olduğu kimi qalsın:
export interface FileData {
  path: string;
  content: string;
  language?: string;
}

export interface RepoFileMeta {
  path: string;
  size?: number;
  sha?: string;
  type?: string;
}

export interface GeminiFileSelectionResult {
  task?: string;
  status: "success" | "needs_more_information";
  selectedFiles: string[];
  reason?: string;
  warnings?: string[];
}

const SYSTEM_PROMPT = `
You are an expert Senior Software Engineer and Code Modification Agent.
... (unchanged)
`;

// Yalnız fayl seçimi üçün ayrıca, yüngül prompt.
// Diqqət: burada fayl content-i YOXDUR, yalnız path/size/sha/type göndərilir.
const FILE_SELECTION_SYSTEM_PROMPT = `
You are an expert Senior Software Engineer.

You will be given:
1. A Jira task describing a required code change.
2. A list of repository files with ONLY their metadata (path, size, sha, type) — NOT their content.

Your job is to decide which of these files are actually relevant to implement the Jira task, based on file paths, names, and typical project structure conventions (pages, components, hooks, services, etc.).

RULES:
- Select the smallest set of files that are genuinely needed to implement the task.
- Prefer files whose path clearly relates to the feature described in the task (e.g. a "CartPage" file for a cart-related task).
- Include shared/related files only if there is a clear naming/structural signal they are involved (e.g. a hook or service used by the relevant page).
- Do NOT select unrelated files (e.g. admin pages, unrelated product pages) unless the task explicitly requires them.
- If you cannot confidently determine which files are needed from the given metadata alone, set "status" to "needs_more_information" and explain why in "reason".
- Only return paths that were provided to you. Never invent a file path.

========================
JIRA TASK
========================

{{JIRA_TASK}}

========================
REPOSITORY FILE STRUCTURE (metadata only, no content)
========================

{{FILES}}

========================
OUTPUT FORMAT
========================

Return ONLY valid JSON, no markdown, no code block, no explanations outside the JSON. Use exactly this structure:

{
  "task": "Short description of the Jira task",
  "status": "success",
  "selectedFiles": ["exact/path/to/file1.tsx", "exact/path/to/file2.tsx"],
  "reason": "Short explanation of why these files were selected",
  "warnings": []
}

If you cannot determine the needed files:

{
  "task": "Short description of the Jira task",
  "status": "needs_more_information",
  "selectedFiles": [],
  "reason": "Explain exactly what information or files are missing",
  "warnings": []
}
`;

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
}

export function useGemini() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selecting, setSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  const askGemini = async (jiraTask: string, files: FileData[]) => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const result2 = await apiCall<any>("/ai/llm-generate", "POST", {
        jiraTask,
        files,
      });
      console.log(result2, "result2");

      const text = result2?.data ? JSON.stringify(result2.data) : "";
      setResponse(text);
      return text;
    } catch (err) {
      console.error("Gemini API Error:", err);
      const message = err instanceof Error ? err.message : "Gemini API error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of the auto-flow: send only the repo file structure (path/size/sha/type)
  // plus the task, and ask Gemini which files it actually needs to see.
  // Bu, birbaşa frontenddən Gemini API-yə gedir — backend call etmir.
  const askGeminiSelectFiles = async (
    jiraTask: string,
    fileStructure: RepoFileMeta[],
  ): Promise<GeminiFileSelectionResult | null> => {
    setSelecting(true);
    setSelectError(null);

    try {
      const filesContext = JSON.stringify(fileStructure, null, 2);

      const finalPrompt = FILE_SELECTION_SYSTEM_PROMPT.replace(
        "{{JIRA_TASK}}",
        jiraTask,
      ).replace("{{FILES}}", filesContext);

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: finalPrompt,
      });

      const rawText = result.text ?? "";
      console.log(rawText, "gemini-select-files raw response");

      const cleaned = stripJsonFences(rawText);
      const parsed = JSON.parse(cleaned) as GeminiFileSelectionResult;

      return parsed;
    } catch (err) {
      console.error("Gemini file selection error:", err);
      const message = err instanceof Error ? err.message : "Gemini file selection error";
      setSelectError(message);
      throw err;
    } finally {
      setSelecting(false);
    }
  };

  return {
    askGemini,
    response,
    loading,
    error,
    askGeminiSelectFiles,
    selecting,
    selectError,
  };
}