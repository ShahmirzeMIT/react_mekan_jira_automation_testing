import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Loader2, RefreshCcw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

import { SelectedFilesMenu } from "@/components/ai-workspace/SelectedFilesMenu";
import GithubFiles, {
  GithubFilesHandle,
  SelectedGithubFile,
} from "@/components/ai-workspace/GithubFiles";
import { RepoFileEntry } from "@/components/github/RepoFileTree";
import { AIResultDrawer } from "@/components/ai-workspace/AIResultDrawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGemini } from "@/hooks/useGemini";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/appStore";
import { db } from "@/config/firebase";
import { jiraService } from "@/services/jiraService";
// NOTE: adjust this import to wherever `apiCall` actually lives in your project
// (e.g. "@/lib/api" or "@/services/apiCall"). It is used below to hit
// POST /canvas/jira/issue/status

import { guessLanguageFromPath } from "@/lib/fileLanguage";
import { mapIssueToTask } from "@/utils";
import { parseGeminiResponse } from "@/lib/parseGeminiResponse";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import type { GeminiTaskResult } from "@/types/gemini";
import { apiCall } from "@/api/apiCall";

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

// Best-effort mapping from a free-form Jira status/transition name back to our
// internal TaskStatus enum, so the local queue list can reflect the change
// immediately without waiting for a full refetch. Extend this map if your
// Jira project uses different status names.
function mapJiraStatusNameToTaskStatus(statusName: string): TaskStatus {
  const normalized = statusName.trim().toLowerCase();
  if (["done", "closed", "resolved"].includes(normalized)) return "DONE";
  if (["in progress", "in-progress", "doing"].includes(normalized)) return "IN_PROGRESS";
  if (["in review", "review", "code review"].includes(normalized)) return "IN_REVIEW";
  if (["blocked", "blocker"].includes(normalized)) return "BLOCKED";
  return "TODO" as TaskStatus;
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

// selectedRepo dəyəri "owner/repo" formatındadırsa ayırır.
// Format fərqlidirsə (məs. yalnız repo adı), bu funksiyanı öz backend-inizə uyğun dəyişin.
function splitOwnerRepo(selectedRepo: string | undefined): {
  owner: string | null;
  repo: string | null;
} {
  if (!selectedRepo) return { owner: null, repo: null };
  const parts = selectedRepo.split("/");
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return { owner: null, repo: selectedRepo };
}

// ---------------------------------------------------------------------------
// Modern full-panel loading overlay, used both for "Send to AI" and
// "Auto Generate Code" flows. Shows a spinning gradient ring + animated
// step label so the user has visual feedback while waiting for the API.
// ---------------------------------------------------------------------------
interface AILoadingOverlayProps {
  active: boolean;
  label: string;
  subLabel?: string;
}

function AILoadingOverlay({ active, label, subLabel }: AILoadingOverlayProps) {
  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm transition-opacity duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <Sparkles className="relative size-6 text-primary animate-pulse" aria-hidden />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subLabel && (
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}

// Shape returned by Jira's "get transitions" endpoint. Adjust the field
// names below if your jiraService wraps the response differently.
interface JiraTransitionOption {
  id: string;
  name: string;
}

// Default set of statuses shown in the "Change status" modal. These are used
// as-is (rather than fetched live from Jira's transitions endpoint), so the
// `id` values below are sent as `transitionId` to POST /canvas/jira/issue/status.
// If your Jira workflow uses different transition IDs, update them here.
const DEFAULT_STATUS_TRANSITIONS: JiraTransitionOption[] = [
  { id: "11", name: "To Do" },
  { id: "21", name: "In Progress" },
  { id: "31", name: "In Review" },
  { id: "41", name: "Done" },
];

// ---------------------------------------------------------------------------
// Change-status modal: lets the user pick one of the available Jira
// transitions for the currently loaded issue and submit it.
// ---------------------------------------------------------------------------
interface ChangeStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueKey: string | undefined;
  transitions: JiraTransitionOption[];
  transitionsLoading: boolean;
  transitionsError: string | null;
  submitting: boolean;
  onSubmit: (transition: JiraTransitionOption) => void;
}

function ChangeStatusModal({
  open,
  onOpenChange,
  issueKey,
  transitions,
  transitionsLoading,
  transitionsError,
  submitting,
  onSubmit,
}: ChangeStatusModalProps) {
  const [selectedTransitionId, setSelectedTransitionId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedTransitionId("");
    }
  }, [open]);

  const selectedTransition = transitions.find((t) => t.id === selectedTransitionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            {issueKey ? `Update the status of ${issueKey}.` : "Update the status of this issue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="status-select">New status</Label>

          {transitionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading available statuses…
            </div>
          ) : transitionsError ? (
            <p className="text-sm text-destructive">{transitionsError}</p>
          ) : transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status transitions available.</p>
          ) : (
            <Select value={selectedTransitionId} onValueChange={setSelectedTransitionId}>
              <SelectTrigger id="status-select">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {transitions.map((transition) => (
                  <SelectItem key={transition.id} value={transition.id}>
                    {transition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedTransition && onSubmit(selectedTransition)}
            disabled={!selectedTransition || submitting || transitionsLoading}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            {submitting ? "Updating…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AIWorkspacePage() {
  const { integrations, ai, setTask } = useAppStore();
  const { user } = useAuth();
  const { askGemini, askGeminiSelectFiles, loading: geminiLoading, selecting: geminiSelecting } =
    useGemini();
  const githubId = localStorage.getItem("devflow.github.id");

  const [selectedKey, setSelectedKey] = useState<string | null>(ai.selectedTaskKey);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [queue, setQueue] = useState<Task[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [selectedGithubFiles, setSelectedGithubFiles] = useState<SelectedGithubFile[]>([]);
  const [repoFiles, setRepoFiles] = useState<RepoFileEntry[]>([]);

  // Auto/manual axınları üçün ortaq: hazırda seçilmiş repo/branch (commit/push-un
  // owner/repo/branch parametrləri üçün lazımdır).
  const [activeRepo, setActiveRepo] = useState<string | undefined>();
  const [activeBranch, setActiveBranch] = useState<string | undefined>();

  const githubFilesRef = useRef<GithubFilesHandle>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiTaskResult | null>(null);
  const [aiRawFallback, setAiRawFallback] = useState<string | null>(null);

  // "Auto Generate Code" axını üçün ayrıca state-lər (öz drawer-i ilə)
  const [autoSending, setAutoSending] = useState(false);
  const [autoDrawerOpen, setAutoDrawerOpen] = useState(false);
  const [autoAiResult, setAutoAiResult] = useState<GeminiTaskResult | null>(null);
  const [autoAiRawFallback, setAutoAiRawFallback] = useState<string | null>(null);

  // Auto-flow-un hansı addımda olduğunu göstərmək üçün (loading label-i dəyişdirmək üçün)
  const [autoStage, setAutoStage] = useState<
    "idle" | "selecting" | "fetching" | "generating"
  >("idle");

  // Jira auth details, resolved once in the queue-loading effect and reused
  // by the "Change status" flow so we don't have to hit Firestore again.
  const [jiraAuth, setJiraAuth] = useState<{
    accessToken: string;
    cloudId: string;
    accountId: string;
  } | null>(null);

  // ---- Change status modal state ----
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTransitions, setStatusTransitions] = useState<JiraTransitionOption[]>([]);
  const [statusTransitionsLoading, setStatusTransitionsLoading] = useState(false);
  const [statusTransitionsError, setStatusTransitionsError] = useState<string | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

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
        setJiraAuth(null);
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
          setJiraAuth(null);
          return;
        }

        if (active) {
          setJiraAuth({ accessToken, cloudId, accountId });
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

  function buildJiraTask(): string {
    return [
      selected?.title,
      selected?.description,
      notes.trim() ? `Notes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

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
      const jiraTask = buildJiraTask();

      const filesForAI = readyFiles.map(({ path, content }) => ({
        path,
        content,
        language: guessLanguageFromPath(path),
      }));

      console.log(jiraTask, "jiraTask");
      console.log(filesForAI, "filesForAI");

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

  // Yeni axın: manual fayl seçimi olmadan, bütün repo strukturunu (path/size/sha/type)
  // Gemini-yə göndərir, AI hansı faylların lazım olduğuna qərar verir, sonra həmin
  // faylların content-i /github/file-content (useGithub -> fetchFileContent) ilə alınır
  // və son olaraq real kod dəyişikliyi üçün Gemini-yə yenidən göndərilir.
  async function handleAutoDispatch() {
    if (!selected) return;

    if (repoFiles.length === 0) {
      toast.error("Əvvəlcə GitHub-da repo/branch seçib \"Load Content\" ilə strukturu yükləyin.");
      return;
    }

    setAutoSending(true);
    setAutoAiResult(null);
    setAutoAiRawFallback(null);
    setAutoStage("selecting");

    try {
      const jiraTask = buildJiraTask();

      const fileStructure = repoFiles.map(({ path, size, sha, type }) => ({
        path,
        size,
        sha,
        type,
      }));

      // Step 1: backend-dən (Gemini) hansı faylların lazım olduğunu soruş (yalnız struktur, content yox)
      const selection = await askGeminiSelectFiles(jiraTask, fileStructure);
      const selectedPaths = selection?.selectedFiles ?? [];

      if (selection?.status === "needs_more_information" || selectedPaths.length === 0) {
        toast.error("AI bu tapşırıq üçün lazımi faylları müəyyən edə bilmədi.");
        return;
      }

      // Step 2: seçilmiş hər fayl üçün real content-i GitHub-dan al
      setAutoStage("fetching");
      const filesWithContent = await Promise.all(
        selectedPaths.map(async (path) => {
          try {
            const content = (await githubFilesRef.current?.getFileContent(path)) ?? "";
            return {
              path,
              content,
              language: guessLanguageFromPath(path),
            };
          } catch (err) {
            console.error("Fayl content-i alınmadı:", path, err);
            return {
              path,
              content: "",
              language: guessLanguageFromPath(path),
            };
          }
        }),
      );

      const usableFiles = filesWithContent.filter((f) => f.content);
      if (usableFiles.length === 0) {
        toast.error("Seçilmiş faylların content-i alınmadı.");
        return;
      }

      // Step 3: real kod dəyişikliyi üçün Gemini-yə göndər
      setAutoStage("generating");
      const rawText = await askGemini(jiraTask, usableFiles);
      const parsed = parseGeminiResponse(rawText);

      if (parsed) {
        setAutoAiResult(parsed);
      } else {
        setAutoAiRawFallback(rawText);
      }
      setAutoDrawerOpen(true);

      toast.success(`AI (auto) cavabı hazırdır: ${selected.key}`);
    } catch (err) {
      toast.error("Auto generate alınmadı. Yenidən cəhd edin.");
      console.error(err);
    } finally {
      setAutoSending(false);
      setAutoStage("idle");
    }
  }

  // ---------------------------------------------------------------------
  // Change status flow
  //
  // NOTE: this now uses a fixed, default set of statuses (To Do, In
  // Progress, In Review, Done) instead of fetching live transitions from
  // Jira's "GET transitions" endpoint. If you later want to fetch the
  // real, issue-specific transitions again, replace the body of
  // `handleOpenStatusModal` with a call to your Jira transitions endpoint
  // and keep the loading/error states wired the same way.
  // ---------------------------------------------------------------------
  function handleOpenStatusModal() {
    if (!selected) return;
    if (!jiraAuth) {
      toast.error("Jira connection is not ready yet. Please try again in a moment.");
      return;
    }

    setStatusModalOpen(true);
    setStatusTransitionsError(null);
    setStatusTransitionsLoading(false);
    setStatusTransitions(DEFAULT_STATUS_TRANSITIONS);
  }

async function handleSubmitStatusChange(
  transition: JiraTransitionOption
) {
  if (!selected || !jiraAuth) return;

  setStatusSubmitting(true);

  try {
    await apiCall("/canvas/jira/issue/status", "POST", {
      cloudId: jiraAuth.cloudId,
      accountId: jiraAuth.accountId,
      issueKey: selected.key,
      transitionId: transition.id,
      statusName: transition.name,
    });

    toast.success(
      `Status updated to "${transition.name}" for ${selected.key}`
    );

    // Refresh page after successful status update
    window.location.reload();

  } catch (err) {
    console.error("Unable to update issue status:", err);
    toast.error("Could not update the status. Please try again.");
  } finally {
    setStatusSubmitting(false);
  }
}

  const { owner: activeOwner, repo: activeRepoName } = useMemo(
    () => splitOwnerRepo(activeRepo),
    [activeRepo],
  );

  const isManualBusy = sending || geminiLoading;
  const isAutoBusy = autoSending || geminiSelecting || geminiLoading;

  const autoStageLabel = useMemo(() => {
    switch (autoStage) {
      case "selecting":
        return "AI is picking the relevant files…";
      case "fetching":
        return "Fetching file contents from GitHub…";
      case "generating":
        return "Generating the code change…";
      default:
        return "Working…";
    }
  }, [autoStage]);

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
                {selected ? `${selected.key} — ${selected.title.split(' ').slice(0, 5).join(' ')}..` : "Nothing selected yet"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SelectedFilesMenu files={selectedGithubFiles} onRemove={handleRemoveGithubFile} />
              <Button
                onClick={handleOpenStatusModal}
                disabled={!selected || statusTransitionsLoading}
                variant="outline"
              >
                <RefreshCcw className="mr-2 size-4" aria-hidden />
                Change Status
              </Button>
              <Button
                onClick={handleAutoDispatch}
                disabled={!selected || isAutoBusy || isManualBusy}
                variant="secondary"
              >
                {isAutoBusy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="mr-2 size-4" aria-hidden />
                )}
                {isAutoBusy ? "Analiz edilir…" : "Auto Generate Code"}
              </Button>
              <Button onClick={handleDispatch} disabled={!selected || isManualBusy || isAutoBusy}>
                {isManualBusy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="mr-2 size-4" aria-hidden />
                )}
                {isManualBusy ? "Sending…" : "Send to AI"}
              </Button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60">
            <GithubFiles
              ref={githubFilesRef}
              onSelectedFilesChange={setSelectedGithubFiles}
              onRepoFilesChange={setRepoFiles}
              onRepoBranchChange={(repo, branch) => {
                setActiveRepo(repo);
                setActiveBranch(branch);
              }}
            />

            <AILoadingOverlay
              active={isManualBusy}
              label="Sending to AI…"
              subLabel="Generating the code change based on selected files"
            />

            <AILoadingOverlay
              active={isAutoBusy}
              label={autoStageLabel}
              subLabel="This can take a few moments"
            />
          </div>
        </section>
      </div>

      <AIResultDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        result={aiResult}
        rawFallback={aiRawFallback}
        userId={githubId}
        owner={activeOwner}
        repo={activeRepoName}
        branch={activeBranch}
      />

      <AIResultDrawer
        open={autoDrawerOpen}
        onClose={() => setAutoDrawerOpen(false)}
        result={autoAiResult}
        rawFallback={autoAiRawFallback}
        userId={githubId}
        owner={activeOwner}
        repo={activeRepoName}
        branch={activeBranch}
      />

      <ChangeStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        issueKey={selected?.key}
        transitions={statusTransitions}
        transitionsLoading={statusTransitionsLoading}
        transitionsError={statusTransitionsError}
        submitting={statusSubmitting}
        onSubmit={handleSubmitStatusChange}
      />
    </div>
  );
}