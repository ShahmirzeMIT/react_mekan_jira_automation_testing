// lib/parseGeminiResponse.ts
import { GeminiTaskResult } from "@/types/gemini";

/**
 * Gemini bəzən JSON-u ```json ... ``` kod bloku içində qaytarır,
 * halbuki prompt-da "markdown qaytarma" deyilib. Hər ehtimala qarşı
 * fence-ləri təmizləyib parse edirik. Parse alınmasa null qaytarır,
 * çağıran tərəf xam mətni fallback kimi göstərə bilsin deyə.
 */
export function parseGeminiResponse(raw: string): GeminiTaskResult | null {
  if (!raw) return null;

  let text = raw.trim();

  // ```json ... ``` və ya ``` ... ``` fence-lərini sil
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Bəzən model JSON-dan əvvəl/sonra əlavə mətn qoyur - ilk "{" ilə son "}"
  // arasını çıxarmağa çalışaq (son çarə).
  try {
    return JSON.parse(text) as GeminiTaskResult;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as GeminiTaskResult;
      } catch {
        return null;
      }
    }
    return null;
  }
}