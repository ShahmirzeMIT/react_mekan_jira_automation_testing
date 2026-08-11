import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  ChevronsLeft,
  ChevronsRight,
  Github,
  ListChecks,
  LogOut,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Item {
  label: string;
  icon: LucideIcon;
  to: string;
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, signOut } = useAppStore();

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Development",
      items: [
        { label: "Tasks", icon: ListChecks, to: "/tasks" },

        { label: "AI Workspace", icon: Sparkles, to: "/ai-workspace" },
        { label: "GitHub", icon: Github, to: "/github" },
      ],
    },
    {
      title: "Insights",
      items: [{ label: "Activity", icon: Activity, to: "/activity" }],
    },
    {
      title: "Account",
      items: [
        { label: "Profile", icon: UserIcon, to: "/profile" },
        { label: "Settings", icon: Settings, to: "/settings" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" aria-hidden />
        </div>
        {!sidebarCollapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">DevFlow AI</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            {!sidebarCollapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    title={item.label}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent">
            <span className="relative">
              <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="size-7 object-cover" />
                ) : (
                  (user?.name ?? "D").charAt(0)
                )}
              </span>
              <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success" />
            </span>
            {!sidebarCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user?.name ?? "Developer"}
                </span>
                <span className="block text-xs text-muted-foreground">Developer</span>
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
