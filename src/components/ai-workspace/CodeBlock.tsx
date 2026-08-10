// components/ai-workspace/CodeBlock.tsx
import { useState } from "react";
import { Button, Tooltip } from "antd";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { guessLanguageFromPath } from "@/lib/fileLanguage";

interface CodeBlockProps {
  path?: string;
  code: string;
}

// guessLanguageFromPath bizim daxili adlandırmadır (məs: "ts", "tsx"),
// react-syntax-highlighter (Prism) isə bəzi adları fərqli gözləyir.
// Uyğun olmayanları map edirik, qalanları olduğu kimi ötürürük.
const LANGUAGE_ALIASES: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  jsx: "jsx",
  js: "javascript",
  py: "python",
  rb: "ruby",
  cs: "csharp",
  cpp: "cpp",
  yml: "yaml",
};

function toPrismLanguage(lang: string): string {
  return LANGUAGE_ALIASES[lang] ?? lang;
}

export function CodeBlock({ path, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = path ? guessLanguageFromPath(path) : "text";
  const prismLanguage = toPrismLanguage(language);

  const lineCount = code.split("\n").length;

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 8px 24px -8px rgba(0,0,0,0.5)" }}
      className="group relative overflow-hidden rounded-lg border border-border bg-[#1e1e1e]"
    >
      {/* nazik üst xətt - hover-də sürünərək parlayır */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/70 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
      />

      {/* Editor "titlebar" - macOS-vari dot-larla */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#252526] px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex shrink-0 items-center gap-1">
            <span className="size-2 rounded-full bg-[#ff5f56]" />
            <span className="size-2 rounded-full bg-[#ffbd2e]" />
            <span className="size-2 rounded-full bg-[#27c93f]" />
          </div>
          {path && (
            <span className="truncate font-mono text-[11px] text-white/70">{path}</span>
          )}
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50"
          >
            {language}
          </motion.span>
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-white/30">{lineCount} lines</span>
          <Tooltip title={copied ? "Copied!" : "Copy code"}>
            <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}>
              <Button
                size="small"
                type="text"
                onClick={handleCopy}
                className="!text-white/60 hover:!text-white"
                icon={
                  <span className="relative inline-flex size-3.5 items-center justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.4 }}
                          transition={{ duration: 0.2, ease: "backOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="size-3.5 text-emerald-400" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.4 }}
                          transition={{ duration: 0.2, ease: "backOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Copy className="size-3.5 text-white/60" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                }
              />
            </motion.div>
          </Tooltip>
        </div>
      </div>

      {/* Əsl kod editoru hissəsi - sətir nömrələri + syntax highlighting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="max-h-[420px] overflow-auto"
      >
        <SyntaxHighlighter
          language={prismLanguage}
          style={vscDarkPlus}
          showLineNumbers
          wrapLines
          lineNumberStyle={{
            minWidth: "2.75em",
            paddingRight: "1em",
            color: "rgba(255,255,255,0.25)",
            userSelect: "none",
          }}
          customStyle={{
            margin: 0,
            padding: "12px",
            background: "transparent",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
          codeTagProps={{
            style: { fontFamily: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace" },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </motion.div>

      {/* "Copied!" toast - blokun içində, sağ alt küncdə peyda olur */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-400/30"
          >
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}