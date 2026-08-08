import { cn } from "@/lib/utils";
import type { AIStatus, TaskPriority, TaskStatus } from "@/types";
import { priorityLabel, statusLabel } from "@/utils";

const base =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap";

const statusStyles: Record<TaskStatus, string> = {
  TODO: "border-border bg-muted text-muted-foreground",
  IN_PROGRESS: "border-primary/40 bg-primary/12 text-primary",
  IN_REVIEW: "border-accent/40 bg-accent/12 text-accent",
  DONE: "border-success/40 bg-success/12 text-success",
  BLOCKED: "border-destructive/40 bg-destructive/12 text-destructive",
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn(base, statusStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

const priorityStyles: Record<TaskPriority, string> = {
  LOWEST: "border-border bg-muted text-muted-foreground",
  LOW: "border-border bg-muted text-muted-foreground",
  MEDIUM: "border-info/40 bg-info/12 text-info",
  HIGH: "border-warning/40 bg-warning/12 text-warning",
  HIGHEST: "border-destructive/40 bg-destructive/12 text-destructive",
};

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return <span className={cn(base, priorityStyles[priority], className)}>{priorityLabel[priority]}</span>;
}

const aiStyles: Record<AIStatus, { label: string; className: string }> = {
  ready: { label: "AI Ready", className: "border-info/40 bg-info/12 text-info" },
  analyzing: { label: "Analyzing", className: "border-accent/40 bg-accent/12 text-accent" },
  generating: { label: "Generating", className: "border-accent/40 bg-accent/12 text-accent" },
  reviewing: { label: "Reviewing", className: "border-accent/40 bg-accent/12 text-accent" },
  changes_ready: { label: "Changes Ready", className: "border-warning/40 bg-warning/12 text-warning" },
  applied: { label: "Applied", className: "border-success/40 bg-success/12 text-success" },
  error: { label: "Error", className: "border-destructive/40 bg-destructive/12 text-destructive" },
};

export function AIStatusBadge({ status, className }: { status: AIStatus; className?: string }) {
  const s = aiStyles[status];
  return (
    <span className={cn(base, s.className, className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function ConnectionBadge({
  label,
  connected,
  className,
}: {
  label: string;
  connected: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        base,
        connected
          ? "border-success/40 bg-success/12 text-success"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
      {connected ? " ✓" : ""}
    </span>
  );
}