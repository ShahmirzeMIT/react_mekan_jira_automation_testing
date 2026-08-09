import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { githubService } from "@/services/githubService";
import { useAppStore } from "@/store/appStore";

export default function AcceptGithubPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { connectGithub } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const projectId = sessionStorage.getItem("devflow.github.return-project") ?? "p-1";

  // Bu callback-in bir dəfədən çox işə düşməsinin qarşısını alır
  // (StrictMode double-invoke, ya da dependency referens dəyişikliyi səbəbindən)
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const userID = sessionStorage.getItem("devflow.github.user-id");

    if (!code || !userID) {
      setError("GitHub callback is missing the authorization code or user ID.");
      return;
    }

    void githubService.completeOAuthCallback({ code, state, userId: userID })
      .then((response: any) => {
        // Extract githubId from response
        const githubId = response.githubId || response.data?.githubId || response.user?.id?.toString();
        
        // ONLY set githubId in localStorage
        if (githubId) {
          localStorage.setItem("devflow.github.id", githubId);
          console.log("✅ GitHub ID saved to localStorage:", githubId);
        }

        // Update app state
        connectGithub(response.login || response.data?.login || "GitHub");
        sessionStorage.removeItem("devflow.github.user-id");
        setComplete(true);

        // Redirect to GitHub page after 1 second
        setTimeout(() => {
          navigate(`/projects/${projectId}/github`);
        }, 1000);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to complete GitHub connection.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="surface w-full max-w-md p-6 text-center">
        {error ? <XCircle className="mx-auto size-10 text-destructive" /> : complete ? <CheckCircle2 className="mx-auto size-10 text-success" /> : null}
        <h1 className="mt-4 text-lg font-semibold">{error ? "GitHub connection failed" : complete ? "GitHub connected" : "Connecting GitHub…"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? (complete ? "Your GitHub account is ready to use." : "Finishing authorization securely.")}</p>
        {(error || complete) && <Button className="mt-5" onClick={() => navigate(`/projects/${projectId}/github`)}>Back to GitHub</Button>}
      </section>
    </main>
  );
}