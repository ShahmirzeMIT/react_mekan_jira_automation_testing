import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useAppData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectSelector({ projectId }: { projectId: string }) {
  const { data: projects = [] } = useProjects();
  const navigate = useNavigate();

  return (
    <Select
      value={projects.some((p) => p.id === projectId) ? projectId : ""}
      onValueChange={(id) => navigate(`/projects/${id}/overview`)}
    >
      <SelectTrigger className="h-9 w-full text-sm" aria-label="Select project">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
