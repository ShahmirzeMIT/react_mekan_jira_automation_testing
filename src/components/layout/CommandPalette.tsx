import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const go =
    (to: string) =>
    () => {
      setCommandOpen(false);
      navigate(to);
    };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search tasks, files, repositories, commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={go("/tasks")}>Go to Tasks</CommandItem>
          <CommandItem onSelect={go("/ai-workspace")}>Go to AI Workspace</CommandItem>
          <CommandItem onSelect={go("/github")}>Go to GitHub</CommandItem>
          <CommandItem onSelect={go("/activity")}>Go to Activity</CommandItem>
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
              connectGithub("GitHub");
              setCommandOpen(false);
            }}
          >
            Connect GitHub
          </CommandItem>
          <CommandItem onSelect={go("/profile")}>Open Profile</CommandItem>
          <CommandItem onSelect={go("/settings")}>Open Settings</CommandItem>
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
