import { Link, useParams } from "react-router-dom";
import { Bot, CheckCircle2, CircleDot, ListChecks, OctagonAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConnectionBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/common/Badges";
import { useProject, useTasks } from "@/hooks/useAppData";
import { useAppStore } from "@/store/appStore";
import { relativeTime } from "@/utils";

export default function OverviewPage() {
  const { projectId = "p-1" } = useParams();
  const { data: project } = useProject(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { integrations, activities } = useAppStore();

  const chart = [
    { name: "Completed", value: 18 }, { name: "In Progress", value: 4 },
    { name: "In Review", value: 2 }, { name: "Blocked", value: 1 }, { name: "Todo", value: 5 },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={project?.name ?? "Project"}
        description={project?.description}
        badge={<ConnectionBadge label={project?.status ?? "Active"} connected />}
        actions={<>
          <Button size="sm" asChild><Link to={`/projects/${projectId}/tasks`}>+ New Task</Link></Button>
          <Button size="sm" variant="secondary" asChild><Link to={`/projects/${projectId}/tasks`}>Connect Jira</Link></Button>
          <Button size="sm" variant="secondary" asChild><Link to={`/projects/${projectId}/github`}>Connect GitHub</Link></Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Assigned Tasks" value={24} icon={ListChecks} />
        <StatCard label="Completed" value={18} icon={CheckCircle2} tone="success" />
        <StatCard label="In Progress" value={4} icon={CircleDot} />
        <StatCard label="AI Assisted" value={15} icon={Bot} tone="accent" />
        <StatCard label="Blocked" value={2} icon={OctagonAlert} tone="danger" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-5">
          <h2 className="text-sm font-semibold">Task progress</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold">Project activity</h2>
          <ul className="mt-4 space-y-3">
            {activities.slice(0, 5).map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0">
                  <span className="block truncate">{a.title}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{a.time}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface overflow-hidden">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold">My tasks</h2>
          <table className="w-full text-sm">
            <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr><th className="px-5 py-2 text-left">Key</th><th className="py-2 text-left">Title</th><th className="py-2 text-left">Status</th><th className="py-2 text-left">Priority</th><th className="px-5 py-2 text-left">Updated</th></tr>
            </thead>
            <tbody>
              {(integrations.jiraConnected ? tasks : tasks.slice(0, 5)).slice(0, 6).map((t) => (
                <tr key={t.key} className="border-t border-border">
                  <td className="px-5 py-2.5 font-mono text-xs">
                    <Link to={`/projects/${projectId}/tasks/${t.key}`} className="hover:text-primary">{t.key}</Link>
                  </td>
                  <td className="py-2.5 pr-3"><span className="line-clamp-1">{t.title}</span></td>
                  <td className="py-2.5"><TaskStatusBadge status={t.status} /></td>
                  <td className="py-2.5"><TaskPriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-2.5 font-mono text-[11px] text-muted-foreground">{relativeTime(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">AI productivity</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[["AI Assisted Tasks", 15], ["AI Suggestions Accepted", 38], ["AI Generated Code Changes", 24], ["AI Reviews", 12]].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">Project assignment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Assigned</dt><dd className="font-mono">24</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Completed</dt><dd className="font-mono text-success">18</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Remaining</dt><dd className="font-mono">6</dd></div>
            </dl>
            <Progress value={75} className="mt-4 h-1.5" />
            <p className="mt-1.5 text-xs text-muted-foreground">75% progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
