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
  // plus the task, and ask the backend which files are actually needed.
  // Endi bu, birbaşa Gemini-yə yox, backend-ə (/ai/llm-select-files) gedir.
  const askGeminiSelectFiles = async (
    jiraTask: string,
    fileStructure: RepoFileMeta[],
  ): Promise<any | null> => {
    setSelecting(true);
    setSelectError(null);

    try {
      const result = await apiCall<any>("/ai/llm-select-files", "POST", {
        jiraTask,
        fileStructure,
      });
     if(result.status==200){
        const parsed = (result?.data ?? result) as GeminiFileSelectionResult;
        return parsed;
     }

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