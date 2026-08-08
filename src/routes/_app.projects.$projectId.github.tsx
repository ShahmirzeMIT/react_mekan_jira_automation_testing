import { PageHeader } from "@/components/layout/PageHeader";
import { ConnectionBadge } from "@/components/common/Badges";
import { ListSkeleton } from "@/components/common/States";
import { useRepositories } from "@/hooks/useAppData";
import { useAppStore } from "@/store/appStore";

export default function GithubPage() {
  const { integrations } = useAppStore();
  const { data: repos = [], isLoading } = useRepositories();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="GitHub" description="Repositories connected to this workspace."
        badge={<ConnectionBadge label={integrations.githubConnected ? "Connected" : "Not connected"} connected={integrations.githubConnected} />} />
      {isLoading ? <ListSkeleton /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {repos.map((r) => (
            <article key={r.id} className="surface p-5">
              <h2 className="text-sm font-semibold">{r.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><dt className="uppercase">Language</dt><dd className="text-foreground">{r.language}</dd></div>
                <div><dt className="uppercase">Default branch</dt><dd className="font-mono text-foreground">{r.defaultBranch}</dd></div>
                <div><dt className="uppercase">Branches</dt><dd className="text-foreground">{r.branches.length}</dd></div>
                <div><dt className="uppercase">Last commit</dt><dd className="text-foreground">{r.lastCommit}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
