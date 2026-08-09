import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/Badges";
import { ListSkeleton } from "@/components/common/States";
import { useRepositories } from "@/hooks/useAppData";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { githubService } from "@/services/githubService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function GithubPage() {
  const { integrations } = useAppStore();
  const { user } = useAuth();
  const { projectId = "p-1" } = useParams();
  const { data: repos = [], isLoading } = useRepositories(integrations.githubConnected);
  const [isGithubConnected, setIsGithubConnected] = useState(false);

  // Check if GitHub is already connected via localStorage
  useEffect(() => {
    const githubId = localStorage.getItem("devflow.github.id");
    if (githubId) {
      setIsGithubConnected(true);
      console.log("✅ GitHub already connected with ID:", githubId);
    } else {
      setIsGithubConnected(false);
    }
  }, []);

  const connectGithub = async () => {
    if (!user) {
      toast.error("Sign in before connecting GitHub.");
      return;
    }

    try {
      sessionStorage.setItem("devflow.github.user-id", user.uid);
      sessionStorage.setItem("devflow.github.return-project", projectId);
      window.location.assign(await githubService.beginOAuth(user.uid));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start GitHub connection.");
    }
  };

  // Check if connected from either store or localStorage
  const isConnected = integrations.githubConnected || isGithubConnected;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader 
        title="GitHub" 
        description="Repositories connected to this workspace."
        badge={<ConnectionBadge label={isConnected ? "Connected" : "Not connected"} connected={isConnected} />}
        actions={
          !isConnected ? (
            <Button size="sm" onClick={() => void connectGithub()}>
              Connect GitHub
            </Button>
          ) : undefined
        } 
      />
      
      {isConnected && (isLoading ? <ListSkeleton /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {repos.map((r) => (
            <article key={r.id} className="surface p-5">
              <h2 className="text-sm font-semibold">{r.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><dt className="uppercase">Language</dt><dd className="text-foreground">{r.languages.join(", ")}</dd></div>
                <div><dt className="uppercase">Default branch</dt><dd className="font-mono text-foreground">{r.branches[0] ?? "—"}</dd></div>
                <div><dt className="uppercase">Branches</dt><dd className="text-foreground">{r.branches.length}</dd></div>
                <div><dt className="uppercase">Last update</dt><dd className="text-foreground">{r.updatedAt}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}