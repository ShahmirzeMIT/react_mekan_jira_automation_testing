import { useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRepositories, useRepositoryFiles, useTasks } from "@/hooks/useAppData";
import { useAppStore } from "@/store/appStore";
import { taskService } from "@/services/taskService";

export default function RelateTaskPage() {
  const { projectId = "p-1" } = useParams();
  const { integrations, ai, selectFile, removeFile, setTask, logActivity } = useAppStore();
  const { data: tasks = [] } = useTasks(projectId, integrations.jiraConnected);
  const { data: repos = [] } = useRepositories();
  const { data: filesData } = useRepositoryFiles();
  const [repoId, setRepoId] = useState("r-1");
  const [branch, setBranch] = useState("feature/github-auth");
  const [contextReady, setContextReady] = useState(false);

  const repo = repos.find((r) => r.id === repoId);
  const files = filesData?.files ?? [];
  const taskKey = ai.selectedTaskKey ?? "DEV-142";
  const task = tasks.find((t) => t.key === taskKey);

  async function send() {
    await taskService.relateFiles(taskKey, ai.selectedFiles, repoId, branch);
    logActivity("github", `Files related to ${taskKey}`, { taskKey, repository: repo?.name ?? "" });
    setContextReady(true);
    toast.success("Files added to task.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Relate Task" description="Connect a Jira task with the GitHub files that need to change." />
      <div className="surface mb-4 flex flex-wrap gap-2 p-3">
        <Select value={taskKey} onValueChange={setTask}>
          <SelectTrigger className="h-9 w-64"><SelectValue placeholder="Select Jira task" /></SelectTrigger>
          <SelectContent>{tasks.map((t) => <SelectItem key={t.key} value={t.key}>{t.key} · {t.title}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={repoId} onValueChange={setRepoId}>
          <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Repository" /></SelectTrigger>
          <SelectContent>{repos.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>{(repo?.branches ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Repository files</h2>
          <ul className="space-y-1">
            {files.map((f) => {
              const checked = ai.selectedFiles.includes(f.path);
              return (
                <li key={f.path} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                  <Checkbox id={f.path} checked={checked} onCheckedChange={(v) => (v ? selectFile(f.path) : removeFile(f.path))} />
                  <label htmlFor={f.path} className="flex-1 cursor-pointer font-mono text-xs">{f.path}</label>
                  <span className="font-mono text-[11px] text-muted-foreground">{f.size}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Selected files</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ai.selectedFiles.length} files selected</p>
            <ul className="mt-3 space-y-1.5">
              {ai.selectedFiles.map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="truncate">{p}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeFile(p)}>Remove</Button>
                </li>
              ))}
              {!ai.selectedFiles.length && <li className="text-sm text-muted-foreground">No files selected yet.</li>}
            </ul>
            <Button className="mt-4 w-full" size="sm" onClick={send} disabled={!ai.selectedFiles.length}>Send to AI</Button>
          </section>

          {contextReady && (
            <section className="surface p-4 text-sm">
              <h2 className="text-sm font-semibold">AI Context</h2>
              <ul className="mt-3 space-y-1.5 text-muted-foreground">
                <li>Jira Task · {taskKey} ✓</li>
                <li>Description ✓</li>
                <li>Acceptance Criteria ✓ ({task?.acceptanceCriteria.length ?? 0})</li>
                <li>Repository · {repo?.name} ✓</li>
                <li>Branch · <span className="font-mono text-xs">{branch}</span> ✓</li>
                <li>Selected Files · {ai.selectedFiles.length}</li>
                <li>Git History ✓</li>
              </ul>
              <Button className="mt-4 w-full" size="sm" asChild>
                <a href={`/projects/${projectId}/ai-workspace`}>Analyze with AI</a>
              </Button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
