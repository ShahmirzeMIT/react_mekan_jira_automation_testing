import { mockProjects } from "@/mock/projects";
import type { Project } from "@/types";
import { delay } from "@/utils";

const STORE_KEY = "devflow.projects";

function read(): Project[] {
  if (typeof window === "undefined") return mockProjects;
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return mockProjects;
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return mockProjects;
  }
}

function write(projects: Project[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(projects));
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    await delay(400);
    return read();
  },
  async getProject(id: string): Promise<Project | undefined> {
    await delay(200);
    return read().find((p) => p.id === id);
  },
  async createProject(input: Omit<Project, "id" | "tasks" | "completed" | "aiAssisted" | "status">): Promise<Project> {
    await delay(800);
    const project: Project = {
      ...input,
      id: `p-${Date.now()}`,
      status: "Active",
      tasks: 0,
      completed: 0,
      aiAssisted: 0,
    };
    write([...read(), project]);
    return project;
  },
  async updateProject(id: string, patch: Partial<Project>): Promise<void> {
    await delay(400);
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  async deleteProject(id: string): Promise<void> {
    await delay(400);
    write(read().filter((p) => p.id !== id));
  },
};