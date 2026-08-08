import type { JiraIssuesResponse } from "@/types";

const CLOUD = "https://api.atlassian.com/ex/jira/9c1f2a41/rest/api/3";

const statuses = {
  todo: { id: "10000", name: "To Do", category: { id: 2, key: "new", colorName: "blue-gray", name: "To Do" } },
  inprogress: { id: "10001", name: "In Progress", category: { id: 4, key: "indeterminate", colorName: "yellow", name: "In Progress" } },
  inreview: { id: "10002", name: "In Review", category: { id: 4, key: "indeterminate", colorName: "yellow", name: "In Progress" } },
  done: { id: "10003", name: "Done", category: { id: 3, key: "done", colorName: "green", name: "Done" } },
  blocked: { id: "10004", name: "Blocked", category: { id: 4, key: "indeterminate", colorName: "red", name: "In Progress" } },
} as const;

const priorities = {
  Highest: "1",
  High: "2",
  Medium: "3",
  Low: "4",
  Lowest: "5",
} as const;

const issueTypes = {
  Story: { id: "10004", hierarchyLevel: 0, description: "Stories track functionality or features expressed as user goals." },
  Task: { id: "10002", hierarchyLevel: 0, description: "Tasks track small, distinct pieces of work." },
  Bug: { id: "10003", hierarchyLevel: 0, description: "Bugs track problems or errors." },
} as const;

type Seed = {
  id: string;
  key: string;
  summary: string;
  description: string;
  type: keyof typeof issueTypes;
  status: keyof typeof statuses;
  priority: keyof typeof priorities;
  assignee: string;
  labels: string[];
  created: string;
  updated: string;
};

const seeds: Seed[] = [
  {
    id: "10007", key: "DEV-142", summary: "Implement GitHub OAuth flow",
    description:
      "Replace the temporary personal access token flow with a full GitHub OAuth authorization code exchange so users can connect their repositories securely from the workspace.",
    type: "Story", status: "inprogress", priority: "High", assignee: "Shahmir",
    labels: ["auth", "github", "frontend"], created: "2026-08-01T10:12:00.000+0400", updated: "2026-08-08T18:25:24.837+0400",
  },
  {
    id: "10008", key: "DEV-138", summary: "Create repository browser",
    description: "Build a GitHub-like repository browser with a file tree, branch selector and syntax highlighted file viewer.",
    type: "Story", status: "inreview", priority: "Medium", assignee: "Shahmir",
    labels: ["github", "ui"], created: "2026-07-29T09:04:00.000+0400", updated: "2026-08-07T16:02:10.000+0400",
  },
  {
    id: "10009", key: "DEV-135", summary: "Implement task synchronization",
    description: "Synchronize task status transitions back to Jira when a task is completed inside DevFlow AI.",
    type: "Task", status: "todo", priority: "High", assignee: "Shahmir",
    labels: ["jira", "sync"], created: "2026-07-28T11:40:00.000+0400", updated: "2026-08-06T12:31:00.000+0400",
  },
  {
    id: "10010", key: "DEV-131", summary: "AI context builder for related files",
    description: "Assemble task metadata, acceptance criteria and selected repository files into a single AI context payload.",
    type: "Story", status: "done", priority: "Highest", assignee: "Elena Kovacs",
    labels: ["ai", "context"], created: "2026-07-20T08:22:00.000+0400", updated: "2026-08-05T18:12:00.000+0400",
  },
  {
    id: "10011", key: "DEV-129", summary: "Task table virtualization",
    description: "Large Jira projects render thousands of issues; virtualize the task table rows to keep scrolling smooth.",
    type: "Task", status: "todo", priority: "Low", assignee: "Marc Duval",
    labels: ["performance"], created: "2026-07-18T15:00:00.000+0400", updated: "2026-08-04T10:45:00.000+0400",
  },
  {
    id: "10012", key: "DEV-126", summary: "Fix branch selector losing state on navigation",
    description: "Selecting a branch then navigating to task details resets the branch back to the repository default.",
    type: "Bug", status: "blocked", priority: "Highest", assignee: "Shahmir",
    labels: ["bug", "github"], created: "2026-07-15T13:20:00.000+0400", updated: "2026-08-03T09:10:00.000+0400",
  },
  {
    id: "10013", key: "DEV-124", summary: "Generate unit tests from acceptance criteria",
    description: "Use the AI service to turn each acceptance criterion into a runnable test case skeleton.",
    type: "Story", status: "inprogress", priority: "Medium", assignee: "Elena Kovacs",
    labels: ["ai", "testing"], created: "2026-07-12T10:05:00.000+0400", updated: "2026-08-02T17:55:00.000+0400",
  },
  {
    id: "10014", key: "DEV-120", summary: "Add commit history panel to file viewer",
    description: "Show the last ten commits touching the currently open file, with author and short hash.",
    type: "Task", status: "done", priority: "Low", assignee: "Marc Duval",
    labels: ["github", "ui"], created: "2026-07-08T09:30:00.000+0400", updated: "2026-07-30T14:20:00.000+0400",
  },
  {
    id: "10015", key: "DEV-118", summary: "Workspace keyboard shortcuts",
    description: "Add a command palette and keyboard shortcuts for navigation and AI actions.",
    type: "Task", status: "done", priority: "Medium", assignee: "Shahmir",
    labels: ["ux"], created: "2026-07-04T12:00:00.000+0400", updated: "2026-07-28T11:00:00.000+0400",
  },
  {
    id: "10016", key: "DEV-115", summary: "Jira webhook ingestion contract",
    description: "Define the payload contract for incoming Jira issue webhooks so status changes stream into the workspace.",
    type: "Story", status: "inreview", priority: "High", assignee: "Elena Kovacs",
    labels: ["jira", "backend-ready"], created: "2026-07-01T08:00:00.000+0400", updated: "2026-07-26T15:35:00.000+0400",
  },
  {
    id: "10017", key: "DEV-111", summary: "Preview sandbox status indicator",
    description: "Surface running / building / failed states for the preview sandbox in the AI workspace header.",
    type: "Task", status: "todo", priority: "Lowest", assignee: "Marc Duval",
    labels: ["preview"], created: "2026-06-25T14:10:00.000+0400", updated: "2026-07-22T09:12:00.000+0400",
  },
  {
    id: "10018", key: "DEV-107", summary: "Analytics: AI acceptance rate",
    description: "Track how many AI suggestions are accepted versus rejected and chart the weekly trend.",
    type: "Story", status: "done", priority: "Medium", assignee: "Shahmir",
    labels: ["analytics", "ai"], created: "2026-06-20T10:40:00.000+0400", updated: "2026-07-19T16:48:00.000+0400",
  },
];

export const mockJiraIssuesResponse: JiraIssuesResponse = {
  success: true,
  status: 200,
  message: "Issues assigned to user retrieved successfully",
  data: {
    success: true,
    isLast: true,
    issues: seeds.map((s) => {
      const st = statuses[s.status];
      const it = issueTypes[s.type];
      return {
        expand: "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
        id: s.id,
        self: `${CLOUD}/issue/${s.id}`,
        key: s.key,
        fields: {
          summary: s.summary,
          description: s.description,
          labels: s.labels,
          issuetype: {
            self: `${CLOUD}/issuetype/${it.id}`,
            id: it.id,
            description: it.description,
            iconUrl: `${CLOUD}/universal_avatar/view/type/issuetype/avatar/10315`,
            name: s.type,
            subtask: false,
            hierarchyLevel: it.hierarchyLevel,
          },
          created: s.created,
          updated: s.updated,
          project: {
            self: `${CLOUD}/project/10000`,
            id: "10000",
            key: "DEV",
            name: "Developer Productivity Platform",
            projectTypeKey: "software",
            simplified: true,
          },
          priority: {
            self: `${CLOUD}/priority/${priorities[s.priority]}`,
            iconUrl: `${CLOUD}/images/icons/priorities/${s.priority.toLowerCase()}.svg`,
            name: s.priority,
            id: priorities[s.priority],
          },
          assignee: {
            accountId: s.assignee.toLowerCase().replace(/\s/g, "-"),
            displayName: s.assignee,
            emailAddress: `${s.assignee.split(" ")[0].toLowerCase()}@devflow.ai`,
            avatarUrls: {},
          },
          status: {
            self: `${CLOUD}/status/${st.id}`,
            description: "",
            iconUrl: `${CLOUD}/images/icons/statuses/generic.png`,
            name: st.name,
            id: st.id,
            statusCategory: {
              self: `${CLOUD}/statuscategory/${st.category.id}`,
              ...st.category,
            },
          },
        },
      };
    }),
  },
};