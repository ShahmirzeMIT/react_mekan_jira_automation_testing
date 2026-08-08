import type { ActivityEvent } from "@/types";

export const mockActivities: ActivityEvent[] = [
  { id: "a-1", kind: "task", title: "Task DEV-142 completed", user: "Shahmir", time: "5 minutes ago", taskKey: "DEV-142" },
  { id: "a-2", kind: "ai", title: "AI generated implementation for DEV-138", user: "DevFlow AI", time: "20 minutes ago", taskKey: "DEV-138" },
  { id: "a-3", kind: "github", title: "GitHub repository connected", user: "Shahmir", time: "1 hour ago", repository: "devflow-ai" },
  { id: "a-4", kind: "task", title: "Task DEV-135 moved to In Progress", user: "Shahmir", time: "2 hours ago", taskKey: "DEV-135" },
  { id: "a-5", kind: "ai", title: "AI reviewed src/services/github.ts", user: "DevFlow AI", time: "3 hours ago", repository: "devflow-ai" },
  { id: "a-6", kind: "code", title: "Applied 2 AI code changes on feature/github-auth", user: "Shahmir", time: "4 hours ago", taskKey: "DEV-142" },
  { id: "a-7", kind: "test", title: "Test suite executed — 4 passed", user: "Shahmir", time: "5 hours ago", taskKey: "DEV-142" },
  { id: "a-8", kind: "jira", title: "Jira synchronized — DEV project", user: "System", time: "Yesterday" },
  { id: "a-9", kind: "github", title: "Files related to DEV-142", user: "Shahmir", time: "Yesterday", repository: "devflow-ai", taskKey: "DEV-142" },
];

export const weeklyCompletion = [
  { day: "Mon", completed: 3, aiAssisted: 2 },
  { day: "Tue", completed: 5, aiAssisted: 4 },
  { day: "Wed", completed: 4, aiAssisted: 3 },
  { day: "Thu", completed: 7, aiAssisted: 5 },
  { day: "Fri", completed: 6, aiAssisted: 5 },
  { day: "Sat", completed: 2, aiAssisted: 1 },
  { day: "Sun", completed: 1, aiAssisted: 1 },
];