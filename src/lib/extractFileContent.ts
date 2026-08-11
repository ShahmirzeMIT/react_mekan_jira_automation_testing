// src/lib/extractFileContent.ts

// fetchFileContent-in cavabı backend-dən müxtəlif formada gələ bilər:
// { content, status } | { data: { content } } | base64 encoded | sadə string və s.
// Bu funksiya bütün halları sınayıb faktiki mətn content-ini çıxarır.
export function extractFileContent(result: unknown): string {
  if (result == null) return "";

  if (typeof result === "string") {
    // Bəzən backend JSON-u string kimi qaytarır - əvvəlcə parse etməyə cəhd edirik
    try {
      const parsed = JSON.parse(result);
      return extractFileContent(parsed);
    } catch {
      // Parse olmursa, deməli özü artıq düz mətndir
      return result;
    }
  }

  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;

    if (typeof obj.content === "string") {
      // GitHub Contents API bəzən base64 qaytarır
      if (obj.encoding === "base64") {
        try {
          return decodeURIComponent(escape(atob(obj.content.replace(/\n/g, ""))));
        } catch {
          return obj.content;
        }
      }
      return obj.content;
    }

    // { data: {...} } və ya { data: { data: {...} } } kimi nested formatlar
    if (obj.data != null) return extractFileContent(obj.data);
    if (obj.file != null) return extractFileContent(obj.file);
    if (typeof obj.text === "string") return obj.text;
  }

  // Heç nə tapılmadı - debug üçün özünü JSON kimi göstər (boş qalmasın deyə)
  return JSON.stringify(result, null, 2);
}
