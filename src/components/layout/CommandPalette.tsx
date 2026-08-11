import { useNavigate, useParams } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppStore } from "@/store/appStore";
import { jiraService } from "@/services/jiraService";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, signOut, connectGithub, idToken, integrations } =
    useAppStore();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId;
  const navigate = useNavigate();

  const go =
    (to: string, withParams = true) =>
    () => {
      setCommandOpen(false);
      navigate(withParams ? to.replace("$projectId", projectId ?? "") : to);
    };

  const projectRoute = (section: string) =>
    projectId ? `/projects/$projectId/${section}` : `/${section}`;

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search tasks, files, repositories, commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={go(projectRoute("overview"))}>Go to Overview</CommandItem>
          <CommandItem onSelect={go(projectRoute("tasks"))}>Go to Tasks</CommandItem>
          <CommandItem onSelect={go(projectRoute("ai-workspace"))}>Go to AI Workspace</CommandItem>
          <CommandItem onSelect={go(projectRoute("github"))}>Go to GitHub</CommandItem>
          <CommandItem onSelect={go(projectRoute("activity"))}>Go to Activity</CommandItem>
          <CommandItem onSelect={go("/projects", false)}>Go to Projects</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          {integrations.jiraConnectionChecked && !integrations.jiraConnected && (
            <CommandItem
              onSelect={() => {
                setCommandOpen(false);
                void jiraService.beginOAuth(idToken).then((url) => window.location.assign(url));
              }}
            >
              Connect Jira
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => {
              connectGithub("devflow-ai");
              setCommandOpen(false);
            }}
          >
            Connect GitHub
          </CommandItem>
          <CommandItem onSelect={go("/profile", false)}>Open Profile</CommandItem>
          <CommandItem onSelect={go("/settings", false)}>Open Settings</CommandItem>
          <CommandItem
            onSelect={() => {
              setCommandOpen(false);
              void signOut();
            }}
          >
            Sign Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
