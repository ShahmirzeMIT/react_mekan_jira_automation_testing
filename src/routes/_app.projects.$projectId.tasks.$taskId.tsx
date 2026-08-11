import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ConnectionBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/common/Badges";
import { EmptyState, ListSkeleton, ProjectRequiredState } from "@/components/common/States";
import { useTask } from "@/hooks/useAppData";
import { taskService } from "@/services/taskService";
import { useAppStore } from "@/store/appStore";
const workflow = [
  "Task Selected",
  "Files Related",
  "AI Analysis",
  "Code Generated",
  "Changes Applied",
  "Tests Passed",
  "Preview",
  "Ready for Review",
  "Completed",
];

export default function TaskDetailsPage() {
  const { projectId, taskId } = useParams<{ projectId?: string; taskId?: string }>();
  const { data: task, isLoading, refetch } = useTask(projectId, taskId);
  const { logActivity, setTask } = useAppStore();
  const [comment, setComment] = useState("");

  if (!projectId) return <ProjectRequiredState pageName="Task details" />;
  if (!taskId)
    return (
      <EmptyState title="Task not found" description="Select a task from the current project." />
    );
  if (isLoading) return <ListSkeleton rows={6} />;
  if (!task)
    return (
      <EmptyState
        title="Task not found"
        description="This task is not part of the current project."
      />
    );

  async function complete() {
    await taskService.completeTask(taskId);
    await refetch();
    logActivity("task", `Task ${taskId} completed`, { taskKey: taskId });
    toast.success("Task completed successfully.");
    setTimeout(() => toast.success("Jira synchronized"), 700);
  }

  const step = task.status === "DONE" ? 9 : task.relatedFiles.length ? 4 : 1;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`${task.key} · ${task.title}`}
        badge={<TaskStatusBadge status={task.status} />}
        description={`${task.issueType} · ${task.jiraProject} · updated ${task.updatedAt.slice(0, 10)}`}
        actions={
          <>
            <Button size="sm" variant="secondary" asChild>
              <Link to={`/projects/${projectId}/relate-task`}>Relate Files</Link>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setTask(task.key)} asChild>
              <Link to={`/projects/${projectId}/ai-workspace`}>Ask AI</Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={task.status === "DONE"}>
                  Complete Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Completing this task will synchronize its status with Jira.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={complete}>Complete Task</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <ol className="surface mb-4 flex flex-wrap gap-x-4 gap-y-2 p-3 text-xs">
        {workflow.map((w, i) => (
          <li key={w} className={i < step ? "text-success" : "text-muted-foreground"}>
            <span className="font-mono">{i + 1}.</span> {w} {i < step ? "✓" : ""}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
            <h3 className="mt-5 text-sm font-semibold">Acceptance criteria</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {task.acceptanceCriteria.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </section>

          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Comments</h2>
            <ul className="mt-3 space-y-3">
              {task.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium">
                    {c.author}{" "}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {c.createdAt}
                    </span>
                  </p>
                  <p className="text-muted-foreground">{c.body}</p>
                </li>
              ))}
              {!task.comments.length && (
                <li className="text-sm text-muted-foreground">No comments yet.</li>
              )}
            </ul>
            <Textarea
              className="mt-4"
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              size="sm"
              className="mt-2"
              onClick={() => {
                if (comment.trim()) {
                  toast.success("Comment added.");
                  setComment("");
                }
              }}
            >
              Comment
            </Button>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface p-5 text-sm">
            <h2 className="text-sm font-semibold">Integrations</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <ConnectionBadge
                label={task.jiraSynced ? "Jira Synced" : "Jira Not synced"}
                connected={task.jiraSynced}
              />
              <ConnectionBadge
                label={task.githubConnected ? "GitHub Linked" : "GitHub Not linked"}
                connected={task.githubConnected}
              />
            </div>
            <dl className="mt-4 space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <dt>Priority</dt>
                <dd>
                  <TaskPriorityBadge priority={task.priority} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Assignee</dt>
                <dd>{task.assignee.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Branch</dt>
                <dd className="font-mono text-xs">{task.branch ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Related files</h2>
            {task.relatedFiles.length ? (
              <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted-foreground">
                {task.relatedFiles.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No files are related to this task yet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
