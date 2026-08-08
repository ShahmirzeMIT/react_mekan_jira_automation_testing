import type { Project } from "@/types";

export const mockProjects: Project[] = [
  {
    id: "p-1",
    name: "Developer Productivity Platform",
    description: "AI-powered Jira + GitHub development workflow",
    jiraProject: "DEV",
    githubRepository: "devflow-ai",
    defaultBranch: "main",
    icon: "Rocket",
    color: "#5B8DEF",
    status: "Active",
    tasks: 42,
    completed: 28,
    aiAssisted: 31,
  },
  {
    id: "p-2",
    name: "Billing & Usage Service",
    description: "Metering, invoicing and usage analytics service",
    jiraProject: "BILL",
    githubRepository: "devflow-billing",
    defaultBranch: "main",
    icon: "CreditCard",
    color: "#9B7BEF",
    status: "Active",
    tasks: 18,
    completed: 9,
    aiAssisted: 6,
  },
];