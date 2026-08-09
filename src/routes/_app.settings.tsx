import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";
import { jiraService } from "@/services/jiraService";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const {
    integrations,
    connectGithub,
    disconnectJira,
    disconnectGithub,
    signOut,
    theme,
    toggleTheme,
    idToken,
  } = useAppStore();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Settings"
        description="Workspace configuration. Jira uses your connected OAuth account."
      />

      <Section title="General">
        <p>Workspace · DevFlow AI</p>
        <p>Default project · Developer Productivity Platform</p>
      </Section>

      <Section title="Jira Integration">
        <div className="flex items-center justify-between">
          <div>
            <ConnectionBadge
              label={integrations.jiraConnected ? "Connected" : "Not connected"}
              connected={integrations.jiraConnected}
            />
            <p className="mt-2">Workspace · devflow.atlassian.net</p>
            <p>Project · {integrations.jiraProject ?? "—"}</p>
            <p>Last sync · {integrations.jiraLastSync ?? "Never"}</p>
          </div>
          {integrations.jiraConnected ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void jiraService.beginOAuth(idToken).then((url) => window.location.assign(url)).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to start Jira connection."));
                }}
              >
                Reconnect
              </Button>
              <Button size="sm" variant="ghost" onClick={disconnectJira}>
                Disconnect
              </Button>
            </div>
          ) : integrations.jiraConnectionChecked ? (
            <Button
              size="sm"
              onClick={() => {
                void jiraService.beginOAuth(idToken).then((url) => window.location.assign(url)).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to start Jira connection."));
              }}
            >
              Connect Jira
            </Button>
          ) : null}
        </div>
      </Section>

      <Section title="GitHub Integration">
        <div className="flex items-center justify-between">
          <div>
            <ConnectionBadge
              label={integrations.githubConnected ? "Connected" : "Not connected"}
              connected={integrations.githubConnected}
            />
            <p className="mt-2">Account · devflow</p>
            <p>Permissions · repo:read</p>
            <p>Last sync · {integrations.githubLastSync ?? "Never"}</p>
          </div>
          {integrations.githubConnected ? (
            <Button size="sm" variant="ghost" onClick={disconnectGithub}>
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                connectGithub("devflow-ai");
                toast.success("GitHub connected successfully.");
              }}
            >
              Connect GitHub
            </Button>
          )}
        </div>
      </Section>

      <Section title="AI Settings">
        <p>Provider · Demo AI</p>
        <p>Model · DevFlow AI Demo</p>
        <p>Temperature · 0.2</p>
        <p>Code generation · Enabled</p>
        <p>Code review · Enabled</p>
        <p>Test generation · Enabled</p>
      </Section>

      <Section title="Notifications">
        <p>Task assigned · Email + in-app</p>
        <p>AI finished generating · In-app</p>
        <p>Tests failed · In-app</p>
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p>Theme · {theme === "dark" ? "Dark" : "Light"}</p>
            <p>Editor font · JetBrains Mono</p>
          </div>
          <Button size="sm" variant="secondary" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Use {theme === "dark" ? "light" : "dark"} theme
          </Button>
        </div>
      </Section>

      <Section title="Security">
        <p>Google authentication · Connected</p>
        <p>Active sessions · Current browser</p>
        <Button size="sm" variant="secondary" className="mt-2" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Section>
    </div>
  );
}
