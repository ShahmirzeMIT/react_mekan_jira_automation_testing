import { Link, useLocation, useParams } from "react-router-dom";
import { Bell, Info, Search } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIStatusBadge, ConnectionBadge } from "@/components/common/Badges";

const titles: Record<string, string> = {
  overview: "Overview",
  tasks: "Tasks",
  "relate-task": "Relate Task",
  "ai-workspace": "AI Workspace",
  github: "GitHub",
  activity: "Activity",
  profile: "Profile",
  settings: "Settings",
  projects: "Projects",
};

export function Header() {
  const { integrations, setCommandOpen, ai, user } = useAppStore();
  const { pathname } = useLocation();
  const params = useParams<{ projectId?: string; taskId?: string }>();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "projects";
  const title = params.taskId ? params.taskId : (titles[last] ?? "Workspace");
  const isTaskArea = ["tasks", "ai-workspace", "relate-task"].some((s) => pathname.includes(s));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {params.projectId ? `devflow / ${params.projectId}` : "devflow"} / {last}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isTaskArea && (
          <div className="hidden items-center gap-1.5 lg:flex">
            <ConnectionBadge label="Jira" connected={integrations.jiraConnected} />
            <ConnectionBadge label="GitHub" connected={integrations.githubConnected} />
            <AIStatusBadge status={ai.aiStatus} />
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">
              <Info className="size-3" aria-hidden /> Demo Mode
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 text-sm">
            <p className="font-semibold">Demo Mode</p>
            <p className="mt-1.5 text-muted-foreground">
              Jira, GitHub and AI integrations are currently simulated. The application is ready for
              future backend integrations.
            </p>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={() => setCommandOpen(true)} aria-label="Search">
          <Search className="size-4" />
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">⌘K</span>
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
        </Button>

        <Link to="/profile" aria-label="Profile" className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold">
          {user?.avatar ? <img src={user.avatar} alt="" className="size-8 object-cover" /> : (user?.name ?? "D").charAt(0)}
        </Link>
      </div>
    </header>
  );
}
