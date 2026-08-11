import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FullScreenLoader } from "@/components/common/States";
import { jiraService } from "@/services/jiraService";
import { useAppStore } from "@/store/appStore";

export default function JiraCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { idToken, connectJira, logActivity } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code) {
      setError("Jira did not return an authorization code.");
      return;
    }
    if (completed.current) return;
    completed.current = true;

    void jiraService
      .completeOAuthCallback(code, state, idToken)
      .then((response) => {
        const resource =
          response.data.resources.find((item) => item.isDefault) ?? response.data.resources[0];
        connectJira(resource?.name ?? response.data.cloudId);
        logActivity("jira", `Jira connected: ${response.data.jiraDisplayName}`);
        toast.success(response.message);
        navigate("/tasks", { replace: true });
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Jira connection failed."),
      );
  }, [connectJira, idToken, logActivity, navigate, searchParams]);

  if (!error) return <FullScreenLoader label="Connecting your Jira workspace…" />;
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Jira connection failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}
