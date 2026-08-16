import { useState } from "react";
import { apiCall } from "@/api/apiCall";

// yalnız bu sətri dəyiş, faylın qalanı olduğu kimi qalsın:
export interface FileData {
  path: string;
  content: string;
  language?: string;
}

const SYSTEM_PROMPT = `
You are an expert Senior Software Engineer and Code Modification Agent.
... (unchanged)
`;

export function useGemini() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askGemini = async (jiraTask: string, files: FileData[]) => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const result2 = await apiCall<any>("/ai/llm-generate", "POST", {
        jiraTask,
        files,
      });


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

  return {
    askGemini,
    response,
    loading,
    error,
  };
}