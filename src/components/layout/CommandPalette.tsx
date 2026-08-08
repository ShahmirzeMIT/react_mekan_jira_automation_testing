import { useNavigate, useParams } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useAppStore } from "@/store/appStore";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, signOut, connectJira, connectGithub } = useAppStore();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "p-1";
  const navigate = useNavigate();

  const go = (to: string, withParams = true) => () => {
    setCommandOpen(false);
    navigate(withParams ? to.replace("$projectId", projectId) : to);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search tasks, files, repositories, commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={go("/projects/$projectId/overview")}>Go to Overview</CommandItem>
          <CommandItem onSelect={go("/projects/$projectId/tasks")}>Go to Tasks</CommandItem>
          <CommandItem onSelect={go("/projects/$projectId/ai-workspace")}>Go to AI Workspace</CommandItem>
          <CommandItem onSelect={go("/projects/$projectId/github")}>Go to GitHub</CommandItem>
          <CommandItem onSelect={go("/projects/$projectId/activity")}>Go to Activity</CommandItem>
          <CommandItem onSelect={go("/projects", false)}>Go to Projects</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { connectJira("DEV"); setCommandOpen(false); }}>Connect Jira</CommandItem>
          <CommandItem onSelect={() => { connectGithub("devflow-ai"); setCommandOpen(false); }}>Connect GitHub</CommandItem>
          <CommandItem onSelect={go("/profile", false)}>Open Profile</CommandItem>
          <CommandItem onSelect={go("/settings", false)}>Open Settings</CommandItem>
          <CommandItem onSelect={() => { setCommandOpen(false); void signOut(); }}>Sign Out</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
