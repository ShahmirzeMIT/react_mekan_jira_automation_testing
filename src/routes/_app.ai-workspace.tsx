import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

import { SelectedFilesMenu } from "@/components/ai-workspace/SelectedFilesMenu";
import GithubFiles, {
  GithubFilesHandle,
  SelectedGithubFile,
} from "@/components/ai-workspace/GithubFiles";
import { AIResultDrawer } from "@/components/ai-workspace/AIResultDrawer";
import { Button } from "@/components/ui/button";
import { useGemini } from "@/hooks/useGemini";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/appStore";
import { db } from "@/config/firebase";
import { jiraService } from "@/services/jiraService";
import { guessLanguageFromPath } from "@/lib/fileLanguage";
import { mapIssueToTask } from "@/utils";
import { parseGeminiResponse } from "@/lib/parseGeminiResponse";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import type { GeminiTaskResult } from "@/types/gemini";

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
  red: {
    rail: "bg-rose-500",
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
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

function toStatusColor(status: TaskStatus): string {
  switch (status) {
    case "DONE":
      return "green";
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return "yellow";
    case "BLOCKED":
      return "red";
    default:
      return "blue-gray";
  }
}

function renderPriority(priority: TaskPriority): string {
  switch (priority) {
    case "LOWEST":
      return "Lowest";
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "HIGHEST":
      return "Highest";
    default:
      return priority;
  }
}

function isDoneTask(task: Task): boolean {
  return task.status === "DONE";
}

interface JiraUserRecord {
  accessToken?: unknown;
  defaultCloudId?: unknown;
  jiraAccountId?: unknown;
  jiraUserEmail?: unknown;
  jiraEmail?: unknown;
  email?: unknown;
  userEmail?: unknown;
  isActive?: unknown;
  jiraIntegration?: unknown;
}

function getUserEmail(record: JiraUserRecord): string | null {
  const integration = record.jiraIntegration;
  const integrationEmail =
    typeof integration === "object" && integration !== null
      ? (integration as Record<string, unknown>)["jiraUserEmail"]
      : undefined;
  const email =
    record.jiraUserEmail ??
    integrationEmail ??
    record.jiraEmail ??
    record.email ??
    record.userEmail;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export default function AIWorkspacePage() {
  const { integrations, ai, setTask } = useAppStore();
  const { user } = useAuth();
  const { askGemini } = useGemini();

  const [selectedKey, setSelectedKey] = useState<string | null>(ai.selectedTaskKey);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [queue, setQueue] = useState<Task[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [selectedGithubFiles, setSelectedGithubFiles] = useState<SelectedGithubFile[]>([]);
  const githubFilesRef = useRef<GithubFilesHandle>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiTaskResult | null>(null);
  const [aiRawFallback, setAiRawFallback] = useState<string | null>(null);

  useEffect(() => {
    setSelectedKey(ai.selectedTaskKey);
  }, [ai.selectedTaskKey]);

  useEffect(() => {
    let active = true;

    async function loadQueue() {
      if (!integrations.jiraConnected || !user?.email || !db) {
        if (!active) return;
        setQueue([]);
        setQueueError(null);
        setQueueLoading(false);
        return;
      }

      setQueueLoading(true);
      setQueueError(null);

      try {
        const snapshot = await getDocs(collection(db, "jira_users"));
        const normalizedUserEmail = user.email.trim().toLowerCase();
        const jiraUsers: Array<Record<string, unknown> & { id: string }> = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          }),
        );

        const jiraUser = jiraUsers.find((data) => {
          const integration = data["jiraIntegration"];
          const connected =
            data["isActive"] === true ||
            (typeof integration === "object" &&
              integration !== null &&
              (integration as Record<string, unknown>)["connected"] === true);
          return getUserEmail(data as JiraUserRecord) === normalizedUserEmail && connected;
        });

        const accessToken =
          typeof jiraUser?.["accessToken"] === "string" ? jiraUser["accessToken"] : null;
        const cloudId = jiraUser?.["defaultCloudId"];
        const accountId = jiraUser?.["jiraAccountId"];

        if (!accessToken || typeof cloudId !== "string" || typeof accountId !== "string") {
          if (!active) return;
          setQueue([]);
          setQueueError("Jira connection data is incomplete.");
          return;
        }

        const response = await jiraService.getCanvasIssues({
          accessToken,
          cloudId,
          accountId,
        });

        const tasks = (response.data.issues ?? [])
          .map((issue) => mapIssueToTask(issue))
          .filter((task) => !isDoneTask(task));

        if (!active) return;
        setQueue(tasks);
      } catch (error) {
        if (!active) return;
        console.error("Unable to load Jira canvas issues:", error);
        setQueue([]);
        setQueueError(
          error instanceof Error ? error.message : "Unable to load Jira canvas issues.",
        );
      } finally {
        if (active) setQueueLoading(false);
      }
    }

    void loadQueue();

    return () => {
      active = false;
    };
  }, [integrations.jiraConnected, user?.email]);

  const { selected, selectedQueue } = useMemo(() => {
    const sorted = [...queue].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    if (selectedKey) {
      const selectedItem = sorted.find((task) => task.key === selectedKey) ?? null;
      if (selectedItem) {
        const remainder = sorted.filter((task) => task.key !== selectedKey);
        return { selected: selectedItem, selectedQueue: [selectedItem, ...remainder] };
      }
    }
    return {
      selected: null,
      selectedQueue: sorted,
    };
  }, [queue, selectedKey]);

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
      const jiraTask = [
        selected.title,
        selected.description,
        notes.trim() ? `Notes: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const filesForAI = readyFiles.map(({ path, content }) => ({
        path,
        content,
        language: guessLanguageFromPath(path),
      }));

      console.log(jiraTask,'jiraTask');
      console.log(filesForAI,'filesForAI');
      
      const rawText = await askGemini(jiraTask, filesForAI);
      const parsed = parseGeminiResponse(rawText);

      if (parsed) {
        setAiResult(parsed);
      } else {
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
        <aside className="flex w-[260px] shrink-0 flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Queue</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Select one issue</p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {selectedQueue.length.toString().padStart(2, "0")}
            </span>
          </div>

          <ul className="flex-1 min-h-0 space-y-1.5 overflow-y-auto p-1.5">
            {queueLoading ? (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                Loading Jira issues...
              </li>
            ) : queueError ? (
              <li className="px-2 py-4 text-center text-sm text-destructive">{queueError}</li>
            ) : (
              selectedQueue.map((task) => {
                const isSelected = task.key === selectedKey;
                const style = statusStyle(toStatusColor(task.status));
                return (
                  <li key={task.key}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        const nextKey = isSelected ? null : task.key;
                        setSelectedKey(nextKey);
                        setTask(nextKey);
                      }}
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

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
                            {task.key}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {relativeTime(task.updatedAt)}
                          </span>
                        </div>

                        <p
                          className={
                            "mt-1 line-clamp-2 text-xs leading-snug " +
                            (isSelected ? "text-foreground" : "text-foreground/90")
                          }
                        >
                          {task.title}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${style.pill}`}
                          >
                            <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
                            {task.status.replaceAll("_", " ")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                            {renderPriority(task.priority)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}

            {!queueLoading && !queueError && selectedQueue.length === 0 && (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                No Jira issues available.
              </li>
            )}
          </ul>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-3">
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Loaded issue
              </p>
              <p className="truncate text-sm font-medium">
                {selected ? `${selected.key} — ${selected.title.split(' ').slice(0, 10).join(' ')}..` : "Nothing selected yet"}
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
