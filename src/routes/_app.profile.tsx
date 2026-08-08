import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ConnectionBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DevFlow AI" },
      { name: "description", content: "Your DevFlow AI identity, connected accounts, developer preferences and productivity statistics." },
      { property: "og:title", content: "Profile — DevFlow AI" },
      { property: "og:description", content: "Your DevFlow AI identity and productivity statistics." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAppStore();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Profile" description="Identity comes from your authenticated session. Statistics are demo data." />
      <div className="surface flex items-center gap-4 p-5">
        <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold">
          {user?.avatar ? <img src={user.avatar} alt="" className="size-14 object-cover" /> : (user?.name ?? "D").charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name ?? "Developer"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">uid: {user?.id}</p>
        </div>
        <div className="ml-auto"><ConnectionBadge label={user?.provider === "demo" ? "Demo identity" : "Google"} connected /></div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Statistics</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Tasks Completed" value={18} tone="success" />
        <StatCard label="AI Assisted" value={15} tone="accent" />
        <StatCard label="Repositories" value={3} />
        <StatCard label="Projects" value={2} />
        <StatCard label="AI Reviews" value={12} tone="accent" />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Connected Accounts</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { name: "Google", state: "Connected" },
          { name: "Jira", state: "Demo" },
          { name: "GitHub", state: "Demo" },
        ].map((a) => (
          <div key={a.name} className="surface flex items-center justify-between p-4 text-sm">
            <span>{a.name}</span>
            <ConnectionBadge label={a.state} connected={a.state === "Connected"} />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Developer Preferences</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Default branch · <span className="font-mono">main</span></li>
            <li>Editor theme · Dark</li>
            <li>Diff view · Inline</li>
          </ul>
        </div>
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">AI Preferences</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Provider · Demo AI</li>
            <li>Model · DevFlow AI Demo</li>
            <li>Temperature · 0.2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
