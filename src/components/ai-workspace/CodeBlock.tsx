// components/ai-workspace/CodeBlock.tsx
import { useState } from "react";
import { Button, Tooltip } from "antd";
import { Check, Copy } from "lucide-react";
import { guessLanguageFromPath } from "@/lib/fileLanguage";

interface CodeBlockProps {
  path?: string;
  code: string;
}

export function CodeBlock({ path, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = path ? guessLanguageFromPath(path) : "text";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (permissions) - sakitcə keç
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {path && (
            <span className="truncate font-mono text-[11px] text-white/70">{path}</span>
          )}
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
            {language}
          </span>
        </div>
        <Tooltip title={copied ? "Copied!" : "Copy code"}>
          <Button
            size="small"
            type="text"
            icon={copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-white/60" />}
            onClick={handleCopy}
            className="!text-white/60 hover:!text-white"
          />
        </Tooltip>
      </div>
      <pre className="max-h-[420px] overflow-auto p-3 text-[12px] leading-relaxed">
        <code className="whitespace-pre text-white/90">{code}</code>
      </pre>
    </div>
  );
}