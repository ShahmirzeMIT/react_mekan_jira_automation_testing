import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Pencil, Play, Plus, Power, Square } from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ListSkeleton } from "@/components/common/States";
import { ConnectionBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";
import { taskService, type TaskFilters } from "@/services/taskService";
import { jiraService } from "@/services/jiraService";
import { relativeTime, statusLabel } from "@/utils";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function TasksPage() {
  const { integrations, idToken, logActivity } = useAppStore();
  const [filters, setFilters] = useState<TaskFilters>({ search: "" });
  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
  });
  const [taskOpen, setTaskOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jiraAccessToken, setJiraAccessToken] = useState<string | null>(null);
  const [jiraCloudId, setJiraCloudId] = useState<string | null>(null);
  const [jiraAccountId, setJiraAccountId] = useState<string | null>(null);
  const [jiraUserEmail, setJiraUserEmail] = useState<string | null>(null);
  const [jiraUserDataLoading, setJiraUserDataLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasJiraConnection = integrations.jiraConnected || Boolean(jiraAccessToken);
  const visible = useMemo(() => taskService.filterTasks(tasks, filters), [tasks, filters]);
  const [editingTask, setEditingTask] = useState<(typeof tasks)[number] | null>(null);

  // Get current user from Firebase Auth
  const { user, loading: authLoading } = useAuth();

  const refetch = useCallback(async () => {
    if (!jiraAccessToken || !jiraCloudId || !jiraAccountId) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    try {
      setTasks(
        await jiraService.getCanvasTasks({
          accessToken: jiraAccessToken,
          cloudId: jiraCloudId,
          accountId: jiraAccountId,
        }),
      );
    } catch (error) {
      console.error("Unable to load Jira issues:", error);
      setTasks([]);
      toast.error(error instanceof Error ? error.message : "Unable to load Jira issues.");
    } finally {
      setIsLoading(false);
    }
  }, [jiraAccessToken, jiraCloudId, jiraAccountId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Fetch Jira user data from Firestore
  useEffect(() => {
    const fetchJiraUserData = async () => {
      setJiraUserDataLoading(true);
      if (!user?.email) {
        setJiraUserDataLoading(false);
        return;
      }

      if (!db) {
        setJiraUserDataLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, "jira_users"));
        const normalizedUserEmail = user.email.trim().toLowerCase();
        console.log(normalizedUserEmail, "normalizedUserEmail");
        const jiraUsers: Array<Record<string, unknown> & { id: string }> = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          }),
        );

        const emailFor = (data: Record<string, unknown>) => {
          const integration = data["jiraIntegration"];
          const integrationEmail =
            typeof integration === "object" && integration !== null
              ? (integration as Record<string, unknown>)["jiraUserEmail"]
              : undefined;
          const email =
            data["jiraUserEmail"] ??
            integrationEmail ??
            data["jiraEmail"] ??
            data["email"] ??
            data["userEmail"];
          return typeof email === "string" ? email.trim().toLowerCase() : null;
        };

        const jiraUser = jiraUsers.find((data) => {
          const integration = data["jiraIntegration"];
          const connected =
            data["isActive"] === true ||
            (typeof integration === "object" &&
              integration !== null &&
              (integration as Record<string, unknown>)["connected"] === true);
          return (
            emailFor(data) === normalizedUserEmail &&
            connected &&
            typeof data["accessToken"] === "string"
          );
        });


        if (jiraUser) {
          const integration = jiraUser["jiraIntegration"] as Record<string, unknown> | undefined;
          const accessToken =
            typeof jiraUser["accessToken"] === "string" ? jiraUser["accessToken"] : null;
          const cloudId = jiraUser["defaultCloudId"] ?? integration?.["defaultCloudId"];
          const accountId = jiraUser["jiraAccountId"] ?? integration?.["jiraAccountId"];
          setJiraAccessToken(accessToken);
          setJiraCloudId(typeof cloudId === "string" ? cloudId : null);
          setJiraAccountId(typeof accountId === "string" ? accountId : null);
          setJiraUserEmail(emailFor(jiraUser) ?? user.email);
          console.log("Jira Access Token:", accessToken);
          console.log("Jira User Email:", user.email);
        } else {
          setJiraAccessToken(null);
          setJiraCloudId(null);
          setJiraAccountId(null);
          setJiraUserEmail(null);
        }
      } catch (error) {
        console.error("Error fetching Jira user data:", error);
        toast.error("Failed to fetch Jira user data");
      } finally {
        setJiraUserDataLoading(false);
      }
    };

    fetchJiraUserData();
  }, [user?.email, user?.uid]);

  // Log Jira data whenever it changes

  async function handleConnect() {
    setConnecting(true);
    try {
      const authorizationUrl = await jiraService.beginOAuth(idToken);
      window.location.assign(authorizationUrl);
    } catch (error) {
      setConnecting(false);
      toast.error(error instanceof Error ? error.message : "Unable to start Jira connection.");
    }
  }

  const connectModal = (
    <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Connect Jira</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Jira</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You will be redirected to Atlassian to authorize this workspace. After approval, DevFlow
          returns you to your task list.
        </p>
        <DialogFooter>
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Jira"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (
    !authLoading &&
    integrations.jiraConnectionChecked &&
    !jiraUserDataLoading &&
    !hasJiraConnection
  ) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Tasks" actions={connectModal} />
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title="Connect Jira to view your tasks"
          description="Connect your Jira workspace to import and manage development tasks."
          action={connectModal}
        />
      </div>
    );
  }

  async function createTask() {
    if (!newTask.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    await taskService.createTask({ ...newTask, assignee: "Shahmir", labels: [] });
    await refetch();
    logActivity("task", `Task created: ${newTask.title}`);
    toast.success("Task created.");
    setTaskOpen(false);
    setNewTask({ title: "", description: "", priority: "MEDIUM" });
  }

  async function updateTask() {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    setSaving(true);
    try {
      await taskService.updateTask(editingTask.key, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
      });
      await refetch();
      logActivity("task", `Task updated: ${editingTask.title}`, { taskKey: editingTask.key });
      toast.success("Task updated.");
      setEditingTask(null);
    } finally {
      setSaving(false);
    }
  }

  async function setTaskActive(task: (typeof tasks)[number], active: boolean) {
    setSaving(true);
    try {
      await taskService.updateTask(task.key, { active });
      await refetch();
      logActivity("task", `Task ${active ? "activated" : "deactivated"}: ${task.title}`, {
        taskKey: task.key,
      });
      toast.success(`Task ${active ? "activated" : "deactivated"}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tasks"
        badge={
          <div className="flex items-center gap-2">
            <ConnectionBadge label={integrations.jiraWorkspace ?? "Jira"} connected />
            {jiraAccessToken && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Jira Connected
              </span>
            )}
          </div>
        }
        description={`Tasks: ${tasks.length} · Last synchronized: ${integrations.jiraLastSync}${jiraUserEmail ? ` · Jira User: ${jiraUserEmail}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {/* {jiraAccessToken && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("Jira Access Token:", jiraAccessToken);
                  console.log("Jira User Email:", jiraUserEmail);
                  toast.info("Jira data logged to console");
                }}
              >
                Log Jira Data
              </Button>
            )} */}
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createTask}>Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="surface mb-3 flex flex-wrap items-center gap-2 p-3">
        <Input
          placeholder="Search title or key…"
          className="h-9 max-w-xs"
          value={filters.search ?? ""}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.status?.[0] ?? "ALL"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              ...(v === "ALL" ? { status: [] } : { status: [v as TaskStatus] }),
            })
          }
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"] as TaskStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.priority?.[0] ?? "ALL"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              ...(v === "ALL" ? { priority: [] } : { priority: [v as TaskPriority] }),
            })
          }
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {(["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"] as TaskPriority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
     
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {visible.length} / {tasks.length}
        </span>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No tasks match your filters"
          description="Adjust the search or filters to see more tasks."
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                {[
                  "Key",
                  "Title",
                  "Status",
                  "Priority",
                  "Updated",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.key} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 font-mono text-xs">{t.key}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/tasks/${t.key}`} className="hover:text-primary">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <TaskPriorityBadge priority={t.priority} />
                  </td>
                 
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {relativeTime(t.updatedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTask({ ...t })}
                        aria-label={`Update ${t.key}`}
                        title="Update task"
                      >
                        <Pencil className="size-4" />
                      </Button>
                   
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/tasks/${t.key}`}>Open</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select
                  value={editingTask.priority}
                  onValueChange={(priority) =>
                    setEditingTask({ ...editingTask, priority: priority as TaskPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"].map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={editingTask.status}
                  onValueChange={(status) =>
                    setEditingTask({ ...editingTask, status: status as TaskStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"] as TaskStatus[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel[status]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={() => void updateTask()} disabled={saving}>
              <Power className="size-4" /> Save update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
