import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ListSkeleton } from "@/components/common/States";
import { StatCard } from "@/components/common/StatCard";
import { db } from "@/config/firebase";
import { cn } from "@/lib/utils";
import type { JiraIssue } from "@/types";

interface StoredCanvasIssue {
  id: string;
  accountId?: string;
  cloudId?: string;
  issue: JiraIssue;
  issueKey?: string;
  issueSignature?: string;
}

const STATUS_TONES: Record<string, string> = {
  green: "border-success/40 bg-success/12 text-success",
  yellow: "border-warning/40 bg-warning/12 text-warning",
  "blue-gray": "border-info/40 bg-info/12 text-info",
  gray: "border-border bg-muted text-muted-foreground",
};

function isJiraIssue(value: unknown): value is JiraIssue {
  if (!value || typeof value !== "object") return false;
  const issue = value as Partial<JiraIssue>;
  return typeof issue.key === "string" && Boolean(issue.fields?.status?.name);
}

function toStoredCanvasIssue(id: string, data: Record<string, unknown>): StoredCanvasIssue | null {
  const issue = data["issue"];
  if (!isJiraIssue(issue)) return null;

  return {
    id,
    issue,
    accountId: typeof data["accountId"] === "string" ? data["accountId"] : undefined,
    cloudId: typeof data["cloudId"] === "string" ? data["cloudId"] : undefined,
    issueKey: typeof data["issueKey"] === "string" ? data["issueKey"] : issue.key,
    issueSignature:
      typeof data["issueSignature"] === "string" ? data["issueSignature"] : undefined,
  };
}

function parseJiraDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameLocalDay(date: Date | null, reference = new Date()): boolean {
  if (!date) return false;
  return date.toDateString() === reference.toDateString();
}

function formatDateTime(value?: string): string {
  const date = parseJiraDate(value);
  if (!date) return "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(colorName?: string): string {
  return STATUS_TONES[colorName ?? "gray"] ?? STATUS_TONES.gray;
}

function isClosed(issue: JiraIssue): boolean {
  const category = issue.fields.status.statusCategory.name.toLowerCase();
  const status = issue.fields.status.name.toLowerCase();
  return category === "done" || status === "done" || status === "closed";
}

export default function ActivityPage() {
  const [issues, setIssues] = useState<StoredCanvasIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError("Firebase is not configured.");
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "jira_canvas_issues"),
      (snapshot) => {
        setIssues(
          snapshot.docs
            .map((document) => toStoredCanvasIssue(document.id, document.data()))
            .filter((issue): issue is StoredCanvasIssue => Boolean(issue)),
        );
        setError(null);
        setIsLoading(false);
      },
      (reason) => {
        console.error("Unable to load Jira canvas activity:", reason);
        setError(reason.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const dashboard = useMemo(() => {
    const todayWorked = issues
      .filter(({ issue }) => isSameLocalDay(parseJiraDate(issue.fields.updated)))
      .sort(
        (a, b) =>
          (parseJiraDate(b.issue.fields.updated)?.getTime() ?? 0) -
          (parseJiraDate(a.issue.fields.updated)?.getTime() ?? 0),
      );
    const createdToday = issues.filter(({ issue }) =>
      isSameLocalDay(parseJiraDate(issue.fields.created)),
    );
    const closed = issues.filter(({ issue }) => isClosed(issue));
    const open = issues.length - closed.length;
    const statusGroups = issues.reduce<Record<string, StoredCanvasIssue[]>>((groups, item) => {
      const status = item.issue.fields.status.name;
      groups[status] = [...(groups[status] ?? []), item];
      return groups;
    }, {});

    const statusBreakdown = Object.entries(statusGroups)
      .map(([status, items]) => ({
        status,
        items,
        count: items.length,
        percent: issues.length ? Math.round((items.length / issues.length) * 100) : 0,
        colorName: items[0]?.issue.fields.status.statusCategory.colorName,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      closed,
      createdToday,
      open,
      statusBreakdown,
      todayWorked,
      total: issues.length,
    };
  }, [issues]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Activity"
        description="Live Jira canvas activity grouped by daily work and status."
      />

      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="size-5" />}
          title="Activity could not be loaded"
          description={error}
        />
      ) : !dashboard.total ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title="No Jira canvas issues yet"
          description="Open Tasks and sync Jira to populate the activity dashboard."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Tasks" value={dashboard.total} icon={ListChecks} />
            <StatCard
              label="Worked Today"
              value={dashboard.todayWorked.length}
              icon={CalendarClock}
              tone="accent"
            />
            <StatCard
              label="New Today"
              value={dashboard.createdToday.length}
              icon={CircleDot}
              tone="warning"
            />
            <StatCard
              label="Open"
              value={dashboard.open}
              icon={Clock}
              hint="Not closed yet"
            />
            <StatCard
              label="Closed"
              value={dashboard.closed.length}
              icon={CheckCircle2}
              tone="success"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Daily Worked Tasks</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Issues updated today from the Jira canvas sync.
                  </p>
                </div>
                <RefreshCw className="size-4 text-muted-foreground" aria-hidden />
              </div>

              <div className="mt-4 divide-y divide-border">
                {dashboard.todayWorked.length ? (
                  dashboard.todayWorked.map(({ id, issue }) => (
                    <article key={id} className="grid gap-3 py-3 md:grid-cols-[110px_1fr_auto]">
                      <div>
                        <p className="font-mono text-xs font-medium">{issue.key}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDateTime(issue.fields.updated)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{issue.fields.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {issue.fields.issuetype.name} ·{" "}
                          {issue.fields.assignee?.displayName ?? "Unassigned"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium",
                          statusTone(issue.fields.status.statusCategory.colorName),
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {issue.fields.status.name}
                      </span>
                    </article>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No Jira issues were updated today.
                  </p>
                )}
              </div>
            </section>

            <section className="surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Status Breakdown</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Counts grouped by current Jira status.
                  </p>
                </div>
                <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
              </div>

              <div className="mt-4 space-y-3">
                {dashboard.statusBreakdown.map((group) => (
                  <div key={group.status}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                          statusTone(group.colorName),
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {group.status}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {group.count} · {group.percent}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${group.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">All Synced Tasks</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete list saved in jira_canvas_issues.
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {dashboard.total} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    {["Key", "Task", "Status", "Created", "Updated"].map((header) => (
                      <th key={header} className="px-4 py-2.5 text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues
                    .slice()
                    .sort(
                      (a, b) =>
                        (parseJiraDate(b.issue.fields.updated)?.getTime() ?? 0) -
                        (parseJiraDate(a.issue.fields.updated)?.getTime() ?? 0),
                    )
                    .map(({ id, issue }) => (
                      <tr key={id} className="border-t border-border hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-mono text-xs">{issue.key}</td>
                        <td className="max-w-[420px] px-4 py-2.5">
                          <p className="truncate">{issue.fields.summary}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {issue.fields.assignee?.displayName ?? "Unassigned"}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                              statusTone(issue.fields.status.statusCategory.colorName),
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" aria-hidden />
                            {issue.fields.status.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                          {formatDateTime(issue.fields.created)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                          {formatDateTime(issue.fields.updated)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
