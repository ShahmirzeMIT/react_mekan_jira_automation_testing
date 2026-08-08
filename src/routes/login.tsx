import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, Code2, GitBranch, ListChecks, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/common/States";
import { useAppStore } from "@/store/appStore";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — DevFlow AI" },
      { name: "description", content: "Sign in with Google to open your DevFlow AI workspace and connect Jira, GitHub and AI-assisted development." },
      { property: "og:title", content: "Sign in — DevFlow AI" },
      { property: "og:description", content: "Sign in with Google to open your DevFlow AI workspace." },
    ],
  }),
  component: LoginPage,
});

const steps = [
  { label: "Jira Task", icon: ListChecks },
  { label: "GitHub Code", icon: GitBranch },
  { label: "AI", icon: Bot },
  { label: "Code Changes", icon: Code2 },
  { label: "Tests", icon: TestTube2 },
  { label: "Completed Task", icon: CheckCircle2 },
];

function LoginPage() {
  const { signIn, isAuthenticated, isLoading } = useAppStore();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate({ to: "/projects", replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <FullScreenLoader label="Checking your session" />;

  async function handleGoogle() {
    setBusy(true);
    try {
      await signIn();
      toast.success("Signed in successfully.");
      navigate({ to: "/projects", replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between border-r border-border bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">D</span>
          <span className="text-sm font-semibold tracking-tight">DevFlow AI</span>
        </div>
        <div className="max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            Turn development tasks into working code.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Connect Jira tasks, GitHub repositories and AI-assisted development in one workspace.
          </p>
          <ul className="mt-10 space-y-2">
            {steps.map((s, i) => (
              <li key={s.label} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-xs tracking-wide text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">{s.label}</span>
                {i < steps.length - 1 && <ArrowRight className="ml-auto size-3.5 text-border" aria-hidden />}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          task → code → context → ai → tests → done
        </p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="surface w-full max-w-sm p-8">
          <h2 className="text-lg font-semibold tracking-tight">Welcome to DevFlow AI</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>

          <Button className="mt-8 w-full" size="lg" onClick={handleGoogle} disabled={busy}>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.9S6.9 21.3 12 21.3c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.1-.2-1.6H12z" />
            </svg>
            {busy ? "Signing in…" : "Continue with Google"}
          </Button>

          {!authService.isFirebaseConfigured && (
            <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              Firebase environment variables are not set yet, so sign-in uses a local demo identity.
              Add the <span className="font-mono">VITE_FIREBASE_*</span> values to enable real Google authentication.
            </p>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}
