import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardsSkeleton, EmptyState } from "@/components/common/States";
import { useProjects } from "@/hooks/useAppData";
import { projectService } from "@/services/projectService";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — DevFlow AI" },
      { name: "description", content: "All your DevFlow AI projects with Jira, GitHub and AI-assisted progress at a glance." },
      { property: "og:title", content: "Projects — DevFlow AI" },
      { property: "og:description", content: "All your DevFlow AI projects with Jira, GitHub and AI progress." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", githubRepository: "devflow-ai", jiraProject: "DEV", defaultBranch: "main", color: "#5B8DEF" });

  async function create() {
    if (!form.name.trim()) { toast.error("Project name is required."); return; }
    await projectService.createProject({ ...form, icon: "Rocket" });
    await qc.invalidateQueries({ queryKey: ["projects"] });
    toast.success("Project created.");
    setOpen(false);
  }

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="size-4" /> Create Project</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Project Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Developer Productivity Platform" /></div>
          <div className="grid gap-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="AI-powered Jira and GitHub development workflow" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>GitHub Repository</Label><Input value={form.githubRepository} onChange={(e) => setForm({ ...form, githubRepository: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Jira Project</Label><Input value={form.jiraProject} onChange={(e) => setForm({ ...form, jiraProject: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Default Branch</Label><Input value={form.defaultBranch} onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Project Color</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create Project</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Projects" description="Every workspace connecting Jira, GitHub and AI." actions={dialog} />
      {isLoading ? <CardsSkeleton /> : !projects?.length ? (
        <EmptyState title="Create your first project" description="A project links a Jira board with a GitHub repository so AI can work with real context." action={dialog} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const progress = p.tasks ? Math.round((p.completed / p.tasks) * 100) : 0;
            return (
              <div key={p.id} className="surface flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <h2 className="truncate text-sm font-semibold">{p.name}</h2>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="rounded border border-border px-1.5 py-0.5">{p.jiraProject}</span>
                  <span className="rounded border border-border px-1.5 py-0.5">{p.githubRepository}</span>
                  <span className="rounded border border-border px-1.5 py-0.5">{p.defaultBranch}</span>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><dt className="text-[10px] tracking-wide text-muted-foreground uppercase">Tasks</dt><dd className="font-mono text-sm">{p.tasks}</dd></div>
                  <div><dt className="text-[10px] tracking-wide text-muted-foreground uppercase">Done</dt><dd className="font-mono text-sm text-success">{p.completed}</dd></div>
                  <div><dt className="text-[10px] tracking-wide text-muted-foreground uppercase">AI</dt><dd className="font-mono text-sm text-accent">{p.aiAssisted}</dd></div>
                </dl>
                <Progress value={progress} className="mt-4 h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">{progress}% progress</p>
                <Button asChild size="sm" variant="secondary" className="mt-4">
                  <Link to="/projects/$projectId/overview" params={{ projectId: p.id }}>Open Project</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
