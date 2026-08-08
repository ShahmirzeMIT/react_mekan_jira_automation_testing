import { createFileRoute } from "@tanstack/react-router";
import { Activity, Bot, GitBranch, ListChecks, RefreshCcw, TestTube2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/appStore";
import type { ActivityKind } from "@/types";

export const Route = createFileRoute("/_app/projects/$projectId/activity")({
  head: () => ({
    meta: [
      { title: "Activity — DevFlow AI" },
      { name: "description", content: "A timeline of task, AI, GitHub and Jira events across your DevFlow AI project." },
      { property: "og:title", content: "Activity — DevFlow AI" },
      { property: "og:description", content: "Timeline of task, AI, GitHub and Jira events." },
    ],
  }),
  component: ActivityPage,
});

const icons: Record<ActivityKind, typeof Activity> = {
  task: ListChecks, ai: Bot, github: GitBranch, jira: RefreshCcw, test: TestTube2, code: Activity,
};

function ActivityPage() {
  const { activities } = useAppStore();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Activity" description="Everything that happened across tasks, code and AI." />
      <ol className="relative border-l border-border pl-6">
        {activities.map((a) => {
          const Icon = icons[a.kind];
          return (
            <li key={a.id} className="mb-6 last:mb-0">
              <span className="absolute -left-3.5 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <p className="text-sm">{a.title}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {a.user} · {a.time}{a.taskKey ? ` · ${a.taskKey}` : ""}{a.repository ? ` · ${a.repository}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
