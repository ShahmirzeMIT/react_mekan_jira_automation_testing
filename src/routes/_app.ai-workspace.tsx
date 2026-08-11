// pages/AIWorkspacePage.tsx
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { SelectedFilesMenu } from "@/components/ai-workspace/SelectedFilesMenu";
import GithubFiles, {
  GithubFilesHandle,
  SelectedGithubFile,
} from "@/components/ai-workspace/GithubFiles";
import { AIResultDrawer } from "@/components/ai-workspace/AIResultDrawer";
import { useGemini } from "@/hooks/useGemini";
import { parseGeminiResponse } from "@/lib/parseGeminiResponse";
import { guessLanguageFromPath } from "@/lib/fileLanguage";
import { GeminiTaskResult } from "@/types/gemini";

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string; iconUrl: string };
    priority: { name: string; iconUrl: string };
    status: {
      name: string;
      statusCategory: { colorName: string; name: string };
    };
    created: string;
    updated: string;
  };
}

const DEMO_ISSUES: JiraIssue[] = [
  {
    id: "10007",
    key: "SCRUM-8",
    fields: {
      summary:
        "Update the Contact page by converting all user-facing text to English and improving the contact form. Add Full Name, Email, Phone Number, Company, Subject, and Message fields. Make Full Name, Email, Phone Number, Subject, and Message required, while Company should remain optional. Add proper validation for every field, including email format, phone number format, minimum character requirements, and maximum character limits where appropriate. Display clear English validation messages for invalid fields and make sure errors disappear when the user corrects the input. Prevent form submission when validation fails, show a loading state while submitting, and disable the submit button during submission. Preserve the existing form submission functionality, styling, responsive behavior, and project architecture. Reuse existing shared form components, validation utilities, hooks, and UI components where possible, and avoid modifying unrelated files or functionality. Ensure the final implementation is fully typed, accessible, and does not introduce any TypeScript, import, or runtime errors.",
      issuetype: {
        name: "Story",
        iconUrl:
          "https://api.atlassian.com/ex/jira/d2e6b2e3-44d7-4511-a410-21e5f6195476/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium",
      },
      priority: {
        name: "Medium",
        iconUrl: "https://sahmirzememmedyarov.atlassian.net/images/icons/priorities/medium_new.svg",
      },
      status: {
        name: "Done",
        statusCategory: { colorName: "green", name: "Done" },
      },
      created: "2026-08-08T14:58:50.863+0400",
      updated: "2026-08-08T18:25:24.837+0400",
    },
  },
  {
    id: "10005",
    key: "SCRUM-6",
    fields: {
      summary: "burada yenilik elemek lazimdir bekar durmaq olmaz",
      issuetype: {
        name: "Story",
        iconUrl:
          "https://api.atlassian.com/ex/jira/d2e6b2e3-44d7-4511-a410-21e5f6195476/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium",
      },
      priority: {
        name: "Medium",
        iconUrl: "https://sahmirzememmedyarov.atlassian.net/images/icons/priorities/medium_new.svg",
      },
      status: {
        name: "In Progress",
        statusCategory: { colorName: "yellow", name: "In Progress" },
      },
      created: "2026-08-08T14:57:46.689+0400",
      updated: "2026-08-08T14:57:53.612+0400",
    },
  },
];

const STATUS_STYLES: Record<string, { rail: string; dot: string; pill: string }> = {
  green: {
    rail: "bg-emerald-500",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  yellow: {
    rail: "bg-amber-500",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "blue-gray": {
    rail: "bg-sky-500",
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  gray: {
    rail: "bg-slate-400",
    dot: "bg-slate-400",
    pill: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  },
};

function statusStyle(colorName: string) {
  return STATUS_STYLES[colorName] ?? STATUS_STYLES.gray;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function AIWorkspacePage() {
  const issues = useMemo(
    () =>
      [...DEMO_ISSUES].sort((a, b) => +new Date(b.fields.updated) - +new Date(a.fields.updated)),
    [],
  );

  const { askGemini } = useGemini();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const [selectedGithubFiles, setSelectedGithubFiles] = useState<SelectedGithubFile[]>([]);
  const githubFilesRef = useRef<GithubFilesHandle>(null);

  // AI nəticəsi üçün drawer state-i
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiTaskResult | null>(null);
  const [aiRawFallback, setAiRawFallback] = useState<string | null>(null);

  const selected = useMemo(
    () => issues.find((i) => i.key === selectedKey) ?? null,
    [issues, selectedKey],
  );
  const handleRemoveGithubFile = (path: string) => {
    githubFilesRef.current?.removeSelectedFile(path);
  };

  async function handleDispatch() {
    if (!selected) return;

    const readyFiles = selectedGithubFiles.filter((f) => !f.loading);
    if (readyFiles.length === 0) {
      toast.error("Zəhmət olmasa ən azı bir GitHub faylı seçin.");
      return;
    }

    setSending(true);
    setAiResult(null);
    setAiRawFallback(null);

    try {
      const jiraTask = [selected.fields.summary, notes.trim() ? `Notes: ${notes.trim()}` : ""]
        .filter(Boolean)
        .join("\n\n");

      const filesForAI = readyFiles.map(({ path, content }) => ({
        path,
        content,
        language: guessLanguageFromPath(path),
      }));

      const rawText = await askGemini(jiraTask, filesForAI);
      const parsed = parseGeminiResponse(rawText);

      if (parsed) {
        setAiResult(parsed);
      } else {
        // JSON parse alınmadı - xam mətni fallback kimi saxlayırıq ki, itməsin.
        setAiRawFallback(rawText);
      }
      setDrawerOpen(true);

      toast.success(`AI cavabı hazırdır: ${selected.key}`);
    } catch (err) {
      toast.error("Could not send this task. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background p-4">
      <div className="mx-auto flex h-full max-w-7xl gap-4">
        {/* Queue — pick exactly one issue */}
        <aside className="flex w-[260px] shrink-0 flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold tracking-tight"> Queue</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Select one issue</p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {issues.length.toString().padStart(2, "0")}
            </span>
          </div>

          <ul className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1.5">
            {issues.map((issue) => {
              const isSelected = issue.key === selectedKey;
              const style = statusStyle(issue.fields.status.statusCategory.colorName);
              return (
                <li key={issue.key}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedKey(isSelected ? null : issue.key)}
                    className={
                      "group relative flex w-full items-start gap-2 overflow-hidden rounded-lg border p-2.5 pl-3.5 text-left transition-all " +
                      (isSelected
                        ? "border-primary bg-primary/[0.06] shadow-sm"
                        : "border-border/60 hover:border-border hover:bg-muted/40")
                    }
                  >
                    <span
                      className={`absolute left-0 top-0 h-full w-1 ${style.rail}`}
                      aria-hidden
                    />

                    <img
                      src={issue.fields.issuetype.iconUrl}
                      alt={issue.fields.issuetype.name}
                      className="mt-0.5 size-3.5 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
                          {issue.key}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {relativeTime(issue.fields.updated)}
                        </span>
                      </div>

                      <p
                        className={
                          "mt-1 line-clamp-2 text-xs leading-snug " +
                          (isSelected ? "text-foreground" : "text-foreground/90")
                        }
                      >
                        {issue.fields.summary}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${style.pill}`}
                        >
                          <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
                          {issue.fields.status.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                          <img
                            src={issue.fields.priority.iconUrl}
                            alt=""
                            className="size-2.5"
                            aria-hidden
                          />
                          {issue.fields.priority.name}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Composer — instructions + repo browser for the one loaded issue */}
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-3">
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Loaded issue
              </p>
              <p className="truncate text-sm font-medium">
                {selected
                  ? (() => {
                      const text = `${selected.key} — ${selected.fields.summary}`;
                      return text.length > 100 ? `${text.slice(0, 100)}...` : text;
                    })()
                  : "Nothing selected yet"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SelectedFilesMenu files={selectedGithubFiles} onRemove={handleRemoveGithubFile} />
              <Button onClick={handleDispatch} disabled={!selected || sending}>
                <Send className="mr-2 size-4" aria-hidden />
                {sending ? "Sending…" : "Send to AI"}
              </Button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60">
            <GithubFiles ref={githubFilesRef} onSelectedFilesChange={setSelectedGithubFiles} />
          </div>
        </section>
      </div>

      <AIResultDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        result={aiResult}
        rawFallback={aiRawFallback}
      />
    </div>
  );
}
