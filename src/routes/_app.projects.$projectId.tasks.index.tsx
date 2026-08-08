import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ListSkeleton } from "@/components/common/States";
import { ConnectionBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/common/Badges";
import { useTasks } from "@/hooks/useAppData";
import { useAppStore } from "@/store/appStore";
import { taskService, type TaskFilters } from "@/services/taskService";
import { jiraService } from "@/services/jiraService";
import { relativeTime, statusLabel } from "@/utils";
import type { TaskPriority, TaskStatus } from "@/types";
export default function TasksPage() {
  const { projectId = "p-1" } = useParams();
  const { integrations, connectJira, logActivity } = useAppStore();
  const { data: tasks = [], isLoading, refetch } = useTasks(projectId, integrations.jiraConnected);
  const [filters, setFilters] = useState<TaskFilters>({ search: "" });
  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [form, setForm] = useState({ url: "https://devflow.atlassian.net", workspace: "devflow", project: "DEV" });
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority });
  const [taskOpen, setTaskOpen] = useState(false);

  const visible = useMemo(() => taskService.filterTasks(tasks, filters), [tasks, filters]);

  async function handleConnect() {
    setConnecting(true);
    await jiraService.connect(form);
    connectJira(form.project);
    logActivity("jira", `Jira workspace ${form.workspace} connected`);
    setConnecting(false);
    setConnectOpen(false);
    toast.success("Jira connected successfully.");
  }

  const connectModal = (
    <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
      <DialogTrigger asChild><Button size="sm">Connect Jira</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Connect Jira</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Jira URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Workspace</Label><Input value={form.workspace} onChange={(e) => setForm({ ...form, workspace: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Project</Label><Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={handleConnect} disabled={connecting}>{connecting ? "Connecting…" : "Connect Jira"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!integrations.jiraConnected) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Tasks" actions={connectModal} />
        <EmptyState icon={<ListChecks className="size-5" />} title="Connect Jira to view your tasks"
          description="Connect your Jira workspace to import and manage development tasks." action={connectModal} />
      </div>
    );
  }

  async function createTask() {
    if (!newTask.title.trim()) { toast.error("Title is required."); return; }
    await taskService.createTask({ ...newTask, assignee: "Shahmir", labels: [], projectId });
    await refetch();
    logActivity("task", `Task created: ${newTask.title}`);
    toast.success("Task created.");
    setTaskOpen(false);
    setNewTask({ title: "", description: "", priority: "MEDIUM" });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Tasks"
        badge={<ConnectionBadge label={`Jira ${integrations.jiraProject}`} connected />}
        description={`Tasks: ${tasks.length} · Last synchronized: ${integrations.jiraLastSync}`}
        actions={
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4" /> New Task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Title</Label><Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Description</Label><Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["LOWEST","LOW","MEDIUM","HIGH","HIGHEST"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={createTask}>Create Task</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface mb-3 flex flex-wrap items-center gap-2 p-3">
        <Input placeholder="Search title or key…" className="h-9 max-w-xs"
          value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <Select value={filters.status?.[0] ?? "ALL"} onValueChange={(v) => setFilters({ ...filters, ...(v === "ALL" ? { status: [] } : { status: [v as TaskStatus] }) })}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All statuses</SelectItem>
            {(["TODO","IN_PROGRESS","IN_REVIEW","DONE","BLOCKED"] as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.priority?.[0] ?? "ALL"} onValueChange={(v) => setFilters({ ...filters, ...(v === "ALL" ? { priority: [] } : { priority: [v as TaskPriority] }) })}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All priorities</SelectItem>
            {(["LOWEST","LOW","MEDIUM","HIGH","HIGHEST"] as TaskPriority[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.ai ?? "ALL"} onValueChange={(v) => setFilters({ ...filters, ...(v === "ALL" ? { ai: undefined as never } : { ai: v as "assisted" }) })}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="AI" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">Any AI state</SelectItem><SelectItem value="assisted">AI assisted</SelectItem><SelectItem value="not_assisted">Not assisted</SelectItem></SelectContent>
        </Select>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{visible.length} / {tasks.length}</span>
      </div>

      {isLoading ? <ListSkeleton /> : visible.length === 0 ? (
        <EmptyState title="No tasks match your filters" description="Adjust the search or filters to see more tasks." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>{["Key","Title","Status","Priority","Assignee","GitHub","AI","Updated",""].map((h) => <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.key} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 font-mono text-xs">{t.key}</td>
                  <td className="px-4 py-2.5"><Link to={`/projects/${projectId}/tasks/${t.key}`} className="hover:text-primary">{t.title}</Link></td>
                  <td className="px-4 py-2.5"><TaskStatusBadge status={t.status} /></td>
                  <td className="px-4 py-2.5"><TaskPriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.assignee.name}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.githubConnected ? "Connected" : "Not connected"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.aiAssisted ? "Assisted" : "Not assisted"}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{relativeTime(t.updatedAt)}</td>
                  <td className="px-4 py-2.5"><Button size="sm" variant="ghost" asChild><Link to={`/projects/${projectId}/tasks/${t.key}`}>Open</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
