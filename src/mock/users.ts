import type { User } from "@/types";

export const mockUsers: User[] = [
  { id: "u-1", name: "Shahmir", email: "shahmir@devflow.ai", role: "Developer" },
  { id: "u-2", name: "Elena Kovacs", email: "elena@devflow.ai", role: "Tech Lead" },
  { id: "u-3", name: "Marc Duval", email: "marc@devflow.ai", role: "Developer" },
];

export const currentDeveloper = mockUsers[0];