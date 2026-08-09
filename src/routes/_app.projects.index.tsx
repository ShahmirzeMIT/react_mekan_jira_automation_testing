// pages/ProjectsPage.tsx
import { Link } from "react-router-dom";
import { useState } from "react";
import { AlertCircle, ExternalLink, Github, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { CardsSkeleton, EmptyState } from "@/components/common/States";
import { useProjects } from "@/hooks/useAppData";
import { projectService } from "@/services/projectService";
import { firebaseEnabled } from "@/config/firebase";
import type { Project } from "@/types";

const projectColors = ["#2563EB", "#7C3AED", "#DB2777", "#0891B2", "#16A34A", "#D97706"];

type ProjectForm = Omit<
  Project,
  "id" | "icon" | "status" | "tasks" | "completed" | "aiAssisted" | "color"
>;

function getProjectColor(seed: string): string {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return projectColors[Math.abs(hash) % projectColors.length] ?? projectColors[0]!;
}

function getGithubUrl(repository: string): string | null {
  const value = repository.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^github\.com\//i.test(value)) return `https://${value}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(value)) return `https://github.com/${value}`;
  if (/^[\w.-]+$/.test(value)) return `https://github.com/${value}`;
  return null;
}

function getRepositoryLabel(repository: string): string {
  const url = getGithubUrl(repository);
  if (!url) return repository;
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\.git$/, "") || repository;
  } catch {
    return repository;
  }
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Project["status"]>("ALL");
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    description: "",
    githubRepository: "devflow-ai",
    jiraProject: "DEV",
    defaultBranch: "main",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function create() {
    if (!form.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await projectService.createProject({
        ...form,
        color: getProjectColor(form.name),
        icon: "Rocket",
      });
      await refetch();
      toast.success("Project created successfully.");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        githubRepository: "devflow-ai",
        jiraProject: "DEV",
        defaultBranch: "main",
      });
    } catch (error) {
      toast.error("Failed to create project. Please try again.");
      console.error("Create project error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveProject() {
    if (!editingProject || !form.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await projectService.updateProject(editingProject.id, {
        ...form,
        color: getProjectColor(form.name),
      });
      await refetch();
      toast.success("Project updated successfully.");
      setEditingProject(null);
    } catch (error) {
      toast.error("Failed to update project. Please try again.");
      console.error("Update project error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleProjectStatus(project: Project) {
    const status = project.status === "Active" ? "Paused" : "Active";
    try {
      await projectService.updateProject(project.id, { status });
      await refetch();
      toast.success(`${project.name} ${status === "Active" ? "activated" : "deactivated"}.`);
    } catch (error) {
      toast.error(`Failed to ${status === "Active" ? "activate" : "deactivate"} project.`);
      console.error("Toggle status error:", error);
    }
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`))
      return;

    try {
      await projectService.deleteProject(id);
      await refetch();
      toast.success("Project deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete project.");
      console.error("Delete project error:", error);
    }
  }

  function beginEdit(project: Project) {
    setForm({
      name: project.name,
      description: project.description,
      githubRepository: project.githubRepository,
      jiraProject: project.jiraProject,
      defaultBranch: project.defaultBranch,
    });
    setEditingProject(project);
  }

  const visibleProjects = projects?.filter((project) => {
    const matchesQuery =
      `${project.name} ${project.description} ${project.jiraProject} ${project.githubRepository}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "ALL" || project.status === statusFilter);
  });

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Create Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Project Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Developer Productivity Platform"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="AI-powered Jira and GitHub development workflow"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>GitHub Repository</Label>
              <Input
                value={form.githubRepository}
                onChange={(e) => setForm({ ...form, githubRepository: e.target.value })}
                placeholder="https://github.com/owner/repository"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Jira Project</Label>
              <Input
                value={form.jiraProject}
                onChange={(e) => setForm({ ...form, jiraProject: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Default Branch</Label>
              <Input
                value={form.defaultBranch}
                onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })}
              />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">
              Project color is generated automatically from its name.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Projects"
          description="Every workspace connecting Jira, GitHub and AI."
          actions={dialog}
        />
        <div className="surface p-8 text-center">
          <AlertCircle className="mx-auto size-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold">Failed to load projects</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Projects"
        description="Every workspace connecting Jira, GitHub and AI."
        actions={dialog}
        badge={
          !firebaseEnabled ? (
            <span className="rounded bg-warning/10 px-2 py-1 text-xs text-warning">
              Using local storage
            </span>
          ) : undefined
        }
      />
      <div className="surface mb-3 flex flex-wrap items-center gap-2 p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="h-9 max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "ALL" | Project["status"])}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Inactive</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {visibleProjects?.length ?? 0} / {projects?.length ?? 0}
        </span>
      </div>
      {isLoading ? (
        <CardsSkeleton />
      ) : !projects?.length ? (
        <EmptyState
          title="Create your first project"
          description="A project links a Jira board with a GitHub repository so AI can work with real context."
          action={dialog}
        />
      ) : !visibleProjects?.length ? (
        <EmptyState
          title="No projects match your filters"
          description="Adjust your search or status filter to see more projects."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((p) => {
            const progress = p.tasks ? Math.round((p.completed / p.tasks) * 100) : 0;
            const repositoryUrl = getGithubUrl(p.githubRepository);
            const repositoryLabel = getRepositoryLabel(p.githubRepository);
            const color = getProjectColor(p.name);
            return (
              <article
                key={p.id}
                className="surface flex min-w-0 flex-col rounded-xl p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h2 className="truncate text-sm font-semibold">{p.name}</h2>
                  <span
                    className={
                      p.status === "Active"
                        ? "ml-auto rounded border border-success/30 px-1.5 py-0.5 text-[10px] text-success"
                        : "ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    }
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="rounded border border-border px-1.5 py-0.5">
                    {p.jiraProject}
                  </span>
                  <span className="rounded border border-border px-1.5 py-0.5">
                    {p.defaultBranch}
                  </span>
                </div>
                {repositoryUrl ? (
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={p.githubRepository}
                    className="mt-3 flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
                  >
                    <Github className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{repositoryLabel}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">GitHub repository not linked</p>
                )}
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
                      Tasks
                    </dt>
                    <dd className="font-mono text-sm">{p.tasks}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
                      Done
                    </dt>
                    <dd className="font-mono text-sm text-success">{p.completed}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
                      AI
                    </dt>
                    <dd className="font-mono text-sm text-accent">{p.aiAssisted}</dd>
                  </div>
                </dl>
                <Progress value={progress} className="mt-4 h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">{progress}% progress</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="secondary" className="flex-1">
                    <Link to={`/projects/${p.id}/overview`}>Open Project</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEdit(p)}
                    aria-label={`Update ${p.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleProjectStatus(p)}
                    disabled={p.status === "Archived"}
                    aria-label={
                      p.status === "Active" ? `Deactivate ${p.name}` : `Activate ${p.name}`
                    }
                  >
                    <Power className="size-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog
        open={Boolean(editingProject)}
        onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Project Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>GitHub Repository</Label>
                <Input
                  value={form.githubRepository}
                  onChange={(e) => setForm({ ...form, githubRepository: e.target.value })}
                  placeholder="https://github.com/owner/repository"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Jira Project</Label>
                <Input
                  value={form.jiraProject}
                  onChange={(e) => setForm({ ...form, jiraProject: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Default Branch</Label>
                <Input
                  value={form.defaultBranch}
                  onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })}
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                Project color is generated automatically from its name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={saveProject} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
