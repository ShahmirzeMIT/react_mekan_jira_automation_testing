# DevFlow AI (09)

DEVFLOW AI — COMPLETE FRONTEND DEVELOPMENT PROMPT

Build a complete, production-quality frontend SaaS application called DevFlow AI.

DevFlow AI is an AI-powered developer task management platform that combines:

* Jira task management

* GitHub repositories and source code

* AI-powered code analysis

* AI code generation

* AI-assisted development

* Task-to-file relationships

* Code editing

* Test execution simulation

* Preview simulation

* Project analytics

* Developer productivity tracking

The main product idea is:

JIRA TASK

↓

GITHUB REPOSITORY

↓

RELATED FILES

↓

AI CONTEXT

↓

AI ANALYSIS

↓

AI IMPLEMENTATION

↓

CODE CHANGES

↓

TESTS

↓

PREVIEW

↓

REVIEW

↓

TASK COMPLETION

↓

JIRA STATUS SYNCHRONIZATION

The application should feel like a combination of:

* Linear

* Jira

* GitHub

* Cursor

* ChatGPT

but must have its own original branding and UI.

This is a frontend-only MVP for now.

Firebase Authentication must be REAL.

Jira, GitHub, AI, project data, task data and code execution must use DEMO/MOCK DATA.

Do NOT implement real Jira API, GitHub API or AI API yet.

The architecture must be ready for future backend/API integration.

---

1. TECH STACK

Use:

* React

* TypeScript

* Vite

* React Router

* Tailwind CSS

* Ant Design

* Lucide React

* Framer Motion

* TanStack Query

* Zustand

* Monaco Editor

* Recharts

* React Hook Form

* Firebase Client SDK

Use TypeScript everywhere.

Do NOT use JavaScript files.

Use:

.ts

and:

.tsx

Do not use `.js` or `.jsx`.

---

2. FIREBASE

Use Firebase Client SDK.

Use Firebase Authentication.

Implement Google Login.

Firebase is ONLY responsible for authentication in this MVP.

Do NOT use Firebase Admin SDK.

Do NOT use Firestore yet.

Do NOT use Firebase Storage yet.

Do NOT store application data in Firestore.

---

3. FIREBASE CONFIGURATION

Create:

src/config/firebase.ts

Use environment variables.

Required variables:

VITE_FIREBASE_API_KEY

VITE_FIREBASE_AUTH_DOMAIN

VITE_FIREBASE_PROJECT_ID

VITE_FIREBASE_STORAGE_BUCKET

VITE_FIREBASE_MESSAGING_SENDER_ID

VITE_FIREBASE_APP_ID

Create:

.env.example

Example:

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=

Never hardcode Firebase configuration into components.

---

4. FIREBASE AUTH SERVICE

Create:

src/services/authService.ts

Implement:

signInWithGoogle()

signOut()

getCurrentUser()

Use:

GoogleAuthProvider

and:

signInWithPopup()

Also use:

onAuthStateChanged()

to monitor authentication state.

Do not place Firebase logic directly inside pages.

---

5. AUTH STORE

Create:

src/store/authStore.ts

Use Zustand.

State:

user

isAuthenticated

isLoading

Actions:

setUser()

setLoading()

logout()

Firebase authentication state should update Zustand automatically.

User model:

interface AuthUser {

id: string;

name: string | null;

email: string | null;

avatar: string | null;

}

Map Firebase user data into this model.

---

6. LOGIN PAGE

Create:

/login

Design a premium developer SaaS login page.

Desktop layout:

LEFT SIDE:

DevFlow AI branding.

Headline:

"Turn development tasks into working code."

Description:

"Connect Jira tasks, GitHub repositories and AI-assisted development in one workspace."

Show workflow:

Jira Task

↓

GitHub Code

↓

AI

↓

Code Changes

↓

Tests

↓

Completed Task

RIGHT SIDE:

Login card.

Title:

"Welcome to DevFlow AI"

Subtitle:

"Sign in to continue to your workspace."

Main button:

"Continue with Google"

Use Google icon.

Bottom text:

"By continuing, you agree to our Terms and Privacy Policy."

Only Google authentication is required.

Do NOT implement email/password login.

---

7. AUTHENTICATION FLOW

When user opens application:

If not authenticated:

redirect to:

/login

If authenticated:

redirect to:

/projects

If authentication state is loading:

show a full-screen loading screen.

Do not redirect before Firebase finishes checking auth state.

---

8. PROTECTED ROUTES

These routes require authentication:

/projects

/projects/:projectId/overview

/projects/:projectId/tasks

/projects/:projectId/tasks/:taskId

/projects/:projectId/relate-task

/projects/:projectId/ai-workspace

/projects/:projectId/github

/projects/:projectId/activity

/profile

/settings

If unauthenticated:

redirect to:

/login

---

9. PROJECT-FIRST EXPERIENCE

VERY IMPORTANT.

After Google login, the user should enter the project area.

The application must support creating a project before using the development workflow.

If there is no project:

show:

"Create your first project"

Create a polished project creation screen.

Fields:

Project Name

Project Description

GitHub Repository

Jira Project

Default Branch

Project Icon

Project Color

Example:

Project Name:

Developer Productivity Platform

Description:

AI-powered Jira and GitHub development workflow

GitHub:

devflow-ai

Jira:

DEV

Branch:

main

After creating:

redirect to:

/projects/:projectId/overview

---

10. DEMO PROJECT

For the MVP, automatically provide demo data.

Demo project:

Name:

Developer Productivity Platform

Description:

AI-powered Jira + GitHub development workflow

Jira:

DEV

GitHub:

devflow-ai

Branch:

main

Status:

Active

This is mock data.

---

11. DEMO MODE

Because Jira, GitHub and AI are not connected to real APIs yet, show a subtle:

"Demo Mode"

indicator in the application header.

Clicking it opens a small information popover:

"Demo Mode"

"Jira, GitHub and AI integrations are currently simulated. The application is ready for future backend integrations."

Do not make this intrusive.

---

12. APPLICATION LAYOUT

Create:

AppLayout

with:

Sidebar

Header

Main content

Use React Router.

The application should have a desktop-first developer SaaS interface.

---

13. SIDEBAR

Create a collapsible sidebar.

Top:

DevFlow AI logo

Project selector

Navigation:

OVERVIEW

Overview

DEVELOPMENT

Tasks

Relate Task

AI Workspace

GitHub

INSIGHTS

Activity

Projects

ACCOUNT

Profile

Settings

Bottom:

User avatar

User name

Developer

Online indicator

Clicking the user opens:

Profile

Settings

Sign out

Sidebar must support:

Expanded mode

Collapsed mode

---

14. HEADER

Header should show:

Current project

Current page title

Breadcrumb where useful

Demo Mode indicator

Search button

Notifications

User avatar

For task-related pages also show:

Jira status

GitHub status

AI status

---

15. PROFILE PAGE

Create:

/profile

Use the REAL Firebase authenticated user's information.

Display:

Avatar

Name

Email

Authentication provider

Google

Use:

user.displayName

user.email

user.photoURL

user.uid

Profile sections:

Personal Information

Connected Accounts

Developer Preferences

AI Preferences

Statistics

Demo statistics:

Tasks Completed:

18

AI Assisted:

15

Repositories:

3

Projects:

2

The statistics are mock/demo data.

Connected accounts:

Google

Connected

Jira

Demo

GitHub

Demo

---

16. OVERVIEW PAGE

Route:

/projects/:projectId/overview

Create a professional project dashboard.

Header:

Developer Productivity Platform

Active

Buttons:

* New Task

Connect Jira

Connect GitHub

---

DASHBOARD STATISTICS

Cards:

Assigned Tasks

24

Completed

18

In Progress

4

AI Assisted

15

Blocked

2

---

17. TASK PROGRESS

Create a Recharts visualization.

Show:

Completed

18

In Progress

4

In Review

2

Blocked

1

Todo

5

Use a clean developer SaaS chart.

---

18. PROJECT ACTIVITY

Show recent events:

Task DEV-142 completed

5 minutes ago

AI generated implementation for DEV-138

20 minutes ago

GitHub repository connected

1 hour ago

Task DEV-135 moved to In Progress

2 hours ago

AI reviewed src/services/github.ts

3 hours ago

---

19. MY TASKS

Show latest assigned tasks.

Columns:

Key

Title

Status

Priority

AI

GitHub

Updated

---

20. AI PRODUCTIVITY

Show:

AI Assisted Tasks

15

AI Suggestions Accepted

38

AI Generated Code Changes

24

AI Reviews

12

---

21. PROJECT ASSIGNMENT

Show:

Assigned:

24

Completed:

18

Remaining:

6

Progress:

75%

---

22. TASKS PAGE

Route:

/projects/:projectId/tasks

This is one of the most important pages.

At the top:

Tasks

Button:

Connect to Jira

IMPORTANT:

If Jira is NOT connected:

DO NOT SHOW TASKS.

Instead display:

"Connect Jira to view your tasks"

Description:

"Connect your Jira workspace to import and manage development tasks."

Button:

Connect Jira

---

23. JIRA CONNECTION

Create a modal.

Title:

Connect Jira

Fields:

Jira URL

Workspace

Project

Button:

Connect Jira

For MVP:

simulate connection.

After connection:

show:

Connected ✓

Jira Project:

DEV

Tasks:

42

Last synchronized:

Just now

Store connection state in Zustand.

---

24. TASK FILTERS

After Jira is connected, show task filters.

Filters:

Search

Status

Priority

Assignee

Project

Label

GitHub

AI Assisted

Date

Status options:

All

To Do

In Progress

In Review

Done

Blocked

Priority:

Lowest

Low

Medium

High

Highest

Assignee:

Me

Everyone

Allow multiple filters.

Show active filters as removable chips.

Search should work against task title and key.

---

25. TASK TABLE

Create a professional task table.

Columns:

Key

Title

Status

Priority

Assignee

Project

GitHub

AI

Updated

Actions

Example:

DEV-142

Implement GitHub OAuth flow

In Progress

High

Shahmir

DEV

Connected

Assisted

Today

---

DEV-138

Create repository browser

In Review

Medium

Shahmir

DEV

Connected

Generated

Yesterday

---

DEV-135

Implement task synchronization

To Do

High

Shahmir

DEV

Not connected

Not assisted

---

Use realistic mock data.

Create at least 10 tasks.

---

26. TASK DETAILS

Route:

/projects/:projectId/tasks/:taskId

Create a detailed task page.

Show:

Task key

Title

Description

Acceptance Criteria

Status

Priority

Assignee

Labels

Created date

Updated date

Jira synchronization status

GitHub repository

Related files

AI status

---

27. TASK DETAIL LAYOUT

Use two-column layout.

LEFT:

Task description

Acceptance Criteria

Comments

Activity

RIGHT:

Jira

GitHub

Related Files

AI Assistant

Actions

---

28. TASK ACTIONS

Buttons:

Start Task

Relate Files

Ask AI

Generate Solution

Run Code

Preview

Ready for Review

Complete Task

---

29. COMPLETE TASK

When user clicks:

Complete Task

show confirmation modal.

Title:

"Complete task?"

Description:

"Completing this task will synchronize its status with Jira."

Buttons:

Cancel

Complete Task

After completion:

update demo task status to:

Done

Show toast:

"Task completed successfully."

Then show:

"Jira synchronized"

This is simulated.

---

30. RELATE TASK PAGE

Route:

/projects/:projectId/relate-task

This is one of the core features.

Purpose:

Connect a Jira task with GitHub files.

Top:

Select Jira Task

Select Repository

Select Branch

---

31. GITHUB FILE TREE

Display GitHub-like file tree.

Example:

src/

components/

pages/

services/

hooks/

store/

utils/

tests/

Files:

src/services/github.ts

src/services/jira.ts

src/pages/TaskDetails.tsx

src/components/TaskCard.tsx

src/hooks/useTasks.ts

Allow folder expansion.

Allow file selection.

Use checkboxes.

---

32. SELECTED FILES

Right panel:

Selected Files

2 files selected

Show:

src/services/github.ts

src/pages/TaskDetails.tsx

Each file has:

Remove

Open

Preview

---

33. SEND FILES TO AI

Button:

"Send to AI"

When clicked:

create an AI context preview.

Show:

Jira Task

*

Task Description

*

Acceptance Criteria

*

Repository

*

Branch

*

Selected Files

---

34. AI CONTEXT PREVIEW

Create a context panel:

AI Context

Jira Task

✓ Included

Description

✓ Included

Acceptance Criteria

✓ Included

Repository

✓ Included

Branch

✓ Included

Selected Files

2

Git History

✓ Included

Then:

Analyze with AI

---

35. AI WORKSPACE

Route:

/projects/:projectId/ai-workspace

This is the MOST IMPORTANT screen.

Create an IDE-like AI development workspace.

Use three panels.

LEFT:

Task Context

CENTER:

AI Chat

RIGHT:

Code / File Context

---

36. AI WORKSPACE HEADER

Header:

AI Workspace

Task:

DEV-142

Repository:

devflow-ai

Branch:

feature/github-auth

AI Status:

Ready

Buttons:

Analyze

Generate Code

Review Code

Run Tests

Preview

---

37. LEFT TASK CONTEXT

Show:

Task

DEV-142

Implement GitHub OAuth flow

Description

Acceptance Criteria

Priority

High

Status

In Progress

Related Files:

2

Repository:

devflow-ai

Branch:

feature/github-auth

---

38. AI CHAT

Create a ChatGPT-like developer chat.

Example user:

"Analyze this task and explain what needs to be changed."

Example AI response:

"Based on DEV-142 and the selected files, the authentication flow should be updated in three areas..."

Do not use huge blocks of text.

Make responses readable.

Support:

Markdown

Code blocks

File references

Line references

Expandable sections

Copy

Apply

Regenerate

Explain

---

39. AI ACTIONS

Create quick actions:

Analyze Task

Generate Implementation Plan

Generate Code

Review Code

Find Bugs

Explain Code

Generate Tests

Optimize Code

---

40. AI CODE GENERATION

When user clicks:

Generate Code

show:

Generating implementation...

Then display mock AI result.

Example:

Modified files:

src/services/github.ts

src/pages/Login.tsx

Show diff-style interface.

Buttons:

Apply Changes

Copy

Reject

Open File

---

41. CODE EDITOR

Use Monaco Editor.

Create IDE-like editor.

Show:

filename

branch

modified indicator

language

Buttons:

Save

Run

Preview

---

42. CODE DIFF

Support a mock code diff view.

Example:

* old code

- new code

Use appropriate syntax highlighting.

Show file path.

Buttons:

Apply

Reject

---

43. APPLY CODE CHANGES

When clicking:

Apply Changes

update mock file content.

Show toast:

"AI changes applied successfully."

Update AI status:

Changes Ready

then:

Applied

---

44. RUN TESTS

Button:

Run Tests

Show terminal panel.

Example:

$ npm test

✓ authentication test

✓ github repository test

✓ task service test

✓ task synchronization test

4 tests passed.

Show:

All tests passed.

Use green success state.

---

45. TEST FAILURE STATE

Also support demo failure state.

Example:

3 passed

1 failed

Show:

TaskSync.test.ts

Expected:

Done

Received:

In Progress

Button:

Ask AI to Fix

When clicked:

open AI chat with a prefilled prompt.

---

46. PREVIEW

Button:

Preview

Open preview panel.

Show a simulated application preview.

Header:

Preview

Branch:

feature/github-auth

Status:

Running

Show:

Application preview

Console

Network

Errors

Do not actually execute arbitrary code.

This is a UI simulation for MVP.

---

47. AI STATUS

Use:

AI Ready

blue

Analyzing

purple

Generating

purple

Changes Ready

orange

Applied

green

Error

red

---

48. GITHUB PAGE

Route:

/projects/:projectId/github

Create a GitHub integration page.

Show:

GitHub account

Connected

Repositories

Branches

Recent commits

Pull requests

Files

---

49. GITHUB CONNECTION

Create modal:

Connect GitHub

GitHub Account

Repository permissions

Button:

Connect GitHub

For MVP:

simulate connection.

After connecting:

show:

Connected ✓

Repositories:

3

Last synchronized:

Just now

---

50. REPOSITORY CARDS

Example:

devflow-ai

142 commits

18 branches

7 pull requests

React

TypeScript

---

51. GITHUB REPOSITORY VIEW

Create GitHub-like file browser.

Header:

Repository

Branch selector

Search files

Then:

README.md

package.json

src/

tests/

Clicking a file opens code viewer.

---

52. FILE VIEWER

Show:

File path

Language

Last modified

Commit

AI actions

Buttons:

Ask AI

Explain

Review

Find Bugs

Generate Tests

Relate to Task

Open in AI Workspace

---

53. ACTIVITY PAGE

Route:

/projects/:projectId/activity

Create timeline.

Events:

AI generated code

Task moved to In Progress

GitHub repository connected

Task completed

AI reviewed file

Files related to task

Jira synchronized

Show:

Icon

Event

User

Time

Task

Repository if relevant

---

54. PROJECTS PAGE

Route:

/projects

Show project cards.

Each card:

Project name

Description

Jira

GitHub

Tasks

Completed

AI Assisted

Progress

Example:

Developer Productivity Platform

42 Tasks

28 Completed

31 AI Assisted

67% Progress

Button:

Open Project

Button:

Create Project

---

55. SETTINGS

Route:

/settings

Create sections:

General

Jira Integration

GitHub Integration

AI Settings

Notifications

Appearance

Security

---

56. JIRA SETTINGS

Show:

Connection status

Workspace

Project

Last synchronization

Button:

Connect Jira

or:

Reconnect

---

57. GITHUB SETTINGS

Show:

Connection status

Account

Repository permissions

Button:

Connect GitHub

---

58. AI SETTINGS

Show demo settings:

AI Provider:

Demo AI

Model:

DevFlow AI Demo

Temperature:

0.2

Code Generation:

Enabled

Code Review:

Enabled

Test Generation:

Enabled

---

59. DEMO DATA ARCHITECTURE

VERY IMPORTANT.

Never put large mock arrays directly inside React components.

Create:

src/mock/

tasks.ts

projects.ts

repositories.ts

files.ts

users.ts

activities.ts

aiResponses.ts

commits.ts

pullRequests.ts

---

60. TYPES

Create:

src/types/

auth.ts

task.ts

project.ts

github.ts

jira.ts

ai.ts

activity.ts

user.ts

---

61. TASK TYPE

Example:

interface Task {

id: string;

key: string;

title: string;

description: string;

status: TaskStatus;

priority: TaskPriority;

assignee: User;

projectId: string;

repositoryId?: string;

relatedFiles?: string[];

aiAssisted: boolean;

jiraSynced: boolean;

createdAt: string;

updatedAt: string;

}

---

62. SERVICE ARCHITECTURE

Create:

src/services/

authService.ts

jiraService.ts

githubService.ts

aiService.ts

projectService.ts

taskService.ts

---

63. JIRA SERVICE

Implement mock asynchronous functions:

connect()

disconnect()

getProjects()

getTasks()

getTask()

updateTaskStatus()

syncTask()

Example:

async function getTasks(): Promise<Task[]> {

return mockTasks;

}

Use Promise-based architecture.

---

64. GITHUB SERVICE

Implement:

connect()

disconnect()

getRepositories()

getRepository()

getBranches()

getFiles()

getFileContent()

getCommits()

getPullRequests()

---

65. AI SERVICE

Implement:

analyzeTask()

generateImplementationPlan()

generateCode()

reviewCode()

findBugs()

generateTests()

fixTestFailure()

explainCode()

Return realistic mock responses.

Add artificial delays to simulate API requests.

Example:

await delay(1200)

---

66. PROJECT SERVICE

Implement:

createProject()

getProjects()

getProject()

updateProject()

deleteProject()

For MVP these use local mock state.

---

67. TASK SERVICE

Implement:

getTasks()

getTask()

updateTask()

completeTask()

relateFiles()

unlinkFile()

filterTasks()

searchTasks()

---

68. TANSTACK QUERY

Use TanStack Query for server-style data fetching.

Even though data is mocked, structure the application as if APIs exist.

Example:

useTasks()

useTask()

useRepositories()

useProjects()

useAIAnalysis()

This makes future API integration easier.

---

69. ZUSTAND

Use Zustand for global application state.

Stores:

authStore

projectStore

integrationStore

aiWorkspaceStore

uiStore

---

70. INTEGRATION STORE

State:

jiraConnected

githubConnected

jiraProject

githubRepository

jiraLastSync

githubLastSync

Actions:

connectJira()

disconnectJira()

connectGithub()

disconnectGithub()

---

71. AI WORKSPACE STORE

State:

selectedTask

selectedFiles

messages

aiStatus

activeFile

generatedChanges

testResults

previewOpen

Actions:

setTask()

selectFile()

removeFile()

sendMessage()

setAIStatus()

applyChanges()

runTests()

openPreview()

---

72. ROUTING

Create routes:

/login

/projects

/projects/:projectId/overview

/projects/:projectId/tasks

/projects/:projectId/tasks/:taskId

/projects/:projectId/relate-task

/projects/:projectId/ai-workspace

/projects/:projectId/github

/projects/:projectId/activity

/profile

/settings

---

73. RESPONSIVE DESIGN

Desktop-first.

Support:

Desktop

Laptop

Tablet

On smaller screens:

Collapse sidebar

Stack panels

Convert task tables into cards

Stack AI workspace panels

Keep code editor usable.

---

74. DESIGN SYSTEM

Dark-first.

Use:

Very dark navy/black background

Dark surface cards

Subtle borders

Blue/purple accent

Green success

Orange warning

Red error

Cyan informational states

Do not overuse gradients.

Avoid excessive glassmorphism.

Avoid huge rounded cards.

Use professional SaaS spacing.

---

75. TYPOGRAPHY

Use a modern UI font.

Clear hierarchy.

Small labels.

Strong page titles.

Readable body text.

Monospace fonts for:

Code

Repository names

Branches

Task keys

Commit hashes

Terminal output

---

76. STATUS COLORS

TODO:

gray

IN_PROGRESS:

blue

IN_REVIEW:

purple

DONE:

green

BLOCKED:

red

---

77. PRIORITY COLORS

LOW:

gray

MEDIUM:

blue

HIGH:

orange

HIGHEST:

red

---

78. COMPONENT ARCHITECTURE

Create reusable components:

components/

layout/

Sidebar.tsx

Header.tsx

PageHeader.tsx

AppLayout.tsx

navigation/

NavItem.tsx

projects/

ProjectCard.tsx

ProjectSelector.tsx

tasks/

TaskCard.tsx

TaskTable.tsx

TaskFilters.tsx

TaskStatusBadge.tsx

TaskPriorityBadge.tsx

TaskDetails.tsx

github/

RepositoryCard.tsx

FileTree.tsx

FileViewer.tsx

BranchSelector.tsx

ai/

AIChat.tsx

AIMessage.tsx

AIContextPanel.tsx

AICodeBlock.tsx

AICodeDiff.tsx

AIStatusBadge.tsx

editor/

CodeEditor.tsx

Terminal.tsx

TestResults.tsx

PreviewPanel.tsx

analytics/

StatCard.tsx

ActivityTimeline.tsx

charts/

forms/

common/

Button

Modal

Drawer

EmptyState

LoadingState

ErrorState

ConfirmDialog

---

79. FOLDER STRUCTURE

Use:

src/

components/

features/

auth/

tasks/

jira/

github/

ai/

projects/

analytics/

pages/

layouts/

hooks/

services/

store/

types/

mock/

utils/

constants/

config/

routes/

---

80. EMPTY STATES

Create polished empty states.

No Jira:

"Connect Jira to view your tasks."

No GitHub:

"Connect GitHub to browse repositories."

No related files:

"No files are related to this task yet."

No AI conversation:

"Ask AI to analyze this task and its related code."

No projects:

"Create your first project."

---

81. LOADING STATES

Create skeleton components:

TaskSkeleton

ProjectSkeleton

RepositorySkeleton

AIResponseSkeleton

DashboardSkeleton

Use them during mock asynchronous operations.

---

82. ERROR STATES

Create reusable error UI.

Example:

"Unable to connect to Jira."

Buttons:

Retry

Settings

For AI:

"AI analysis failed."

Buttons:

Retry

Try Again

---

83. TOAST NOTIFICATIONS

Use Ant Design message/notification or a reusable notification system.

Examples:

"Jira connected successfully."

"GitHub connected successfully."

"Files added to task."

"AI analysis completed."

"Code changes applied."

"Tests passed."

"Task completed."

"Jira synchronized."

---

84. MICRO INTERACTIONS

Use Framer Motion carefully.

Animate:

Page transitions

Sidebar collapse

Task drawer

AI response appearance

Connection modals

File selection

Code application

Task completion

Do NOT over-animate.

---

85. SEARCH

Create global search UI.

Search:

Tasks

Projects

Repositories

Files

Task keys

Example:

Search "DEV-142"

Results:

DEV-142

Implement GitHub OAuth flow

Search "github.ts"

Results:

src/services/github.ts

---

86. KEYBOARD SHORTCUTS

Implement basic shortcuts:

/

Open search

Esc

Close modal/drawer

Cmd/Ctrl + K

Open command palette

Cmd/Ctrl + Enter

Run AI action where appropriate

---

87. COMMAND PALETTE

Create command palette.

Commands:

Go to Overview

Go to Tasks

Go to AI Workspace

Go to GitHub

Create Task

Connect Jira

Connect GitHub

Search

Open Profile

Open Settings

Sign Out

---

88. DEMO AI CONVERSATION

Create initial mock AI conversation for DEV-142.

User:

"Analyze this task."

AI:

"DEV-142 requires updating the GitHub authentication flow. The main changes are related to OAuth handling, repository access and authentication state."

Then show:

Implementation Plan

1. Update authentication service

2. Add OAuth callback handling

3. Update authenticated state

4. Add error handling

5. Add tests

Buttons:

Generate Code

Generate Tests

Review Existing Code

---

89. DEMO CODE

Create realistic mock TypeScript files.

Example files:

src/services/github.ts

src/services/jira.ts

src/services/auth.ts

src/pages/Login.tsx

src/pages/TaskDetails.tsx

src/components/TaskCard.tsx

src/hooks/useTasks.ts

Use believable code.

Do not use completely fake placeholder code like:

console.log("hello")

The code viewer should look realistic.

---

90. CODE CONTEXT

When files are selected:

show their names and contents to the AI workspace.

Example:

AI Context:

DEV-142

Repository:

devflow-ai

Branch:

feature/github-auth

Files:

src/services/github.ts

src/services/auth.ts

Context size:

8.4 KB

---

91. TASK → FILE RELATIONSHIP

Each task can have:

repositoryId

branch

relatedFiles[]

Example:

DEV-142

Repository:

devflow-ai

Branch:

feature/github-auth

Files:

src/services/github.ts

src/services/auth.ts

This relationship must be visible everywhere:

Task Details

Relate Task

AI Workspace

GitHub File Viewer

---

92. TASK WORKFLOW INDICATOR

On Task Details and AI Workspace show:

Task Workflow

1. Task Selected ✓

2. Files Related ✓

3. AI Analysis ✓

4. Code Generated ✓

5. Changes Applied ✓

6. Tests Passed ✓

7. Preview ✓

8. Ready for Review

9. Completed

Use a horizontal stepper on desktop.

Vertical stepper on smaller screens.

---

93. JIRA SYNC STATE

Show states:

Not Connected

Connected

Syncing

Synced

Sync Error

Use badges.

Example:

Jira

✓ Synced

---

94. GITHUB STATE

Show:

Not Connected

Connected

Repository Linked

Branch Linked

Use badges.

---

95. AI STATE

Show:

Ready

Analyzing

Generating

Reviewing

Changes Ready

Applied

Error

---

96. ANALYTICS

Use Recharts.

Charts:

Tasks completed over time

AI-assisted tasks

Task status distribution

Project progress

Developer productivity

Show demo data.

Example:

Monday:

3 tasks

Tuesday:

5 tasks

Wednesday:

4 tasks

Thursday:

7 tasks

Friday:

6 tasks

---

97. PROJECT ANALYTICS

Show:

Total Tasks

Completed Tasks

AI Assisted

Average Completion Time

Code Changes

Tests Passed

Test Failures

GitHub Files Related

Jira Sync Success Rate

All values are demo data.

---

98. PROFILE STATISTICS

Use real Firebase identity.

Use demo statistics:

Completed Tasks:

18

AI Assisted:

15

Projects:

2

Repositories:

3

AI Reviews:

12

---

99. CREATE TASK

Add:

* New Task

button.

Create modal.

Fields:

Title

Description

Priority

Assignee

Labels

Project

For MVP:

Create locally.

After creation:

show new task in task list.

---

100. TASK COMMENTS

Task detail page should have comment section.

Mock comments:

Shahmir:

"I've linked the authentication files."

AI:

"Two potential issues were identified."

Developer:

"Tests are passing now."

Add comment input.

Comments are local/demo.

---

101. ACTIVITY LOG

When user performs actions, update local activity state.

Examples:

Task created

Task started

File related

AI analysis requested

Code generated

Code applied

Tests executed

Task completed

Jira synchronized

---

102. SECURITY UI

Settings → Security.

Show:

Google Authentication

Connected

Active Sessions

Current Browser

Sign Out

Do not implement actual session management beyond Firebase.

---

103. SIGN OUT

Click:

Sign Out

Call:

authService.signOut()

Clear relevant local application state.

Redirect:

/login

---

104. FUTURE API ARCHITECTURE

IMPORTANT.

The UI must never directly depend on Firebase, Jira, GitHub or AI implementations.

Use abstraction layers.

Example:

UI:

TasksPage

↓

useTasks()

↓

taskService

↓

mock implementation

Later:

taskService

↓

backend API

↓

Jira API

This architecture must make future integration easy.

---

105. REAL FIREBASE VS DEMO DATA

REAL:

Google Login

Firebase Authentication

Current User

Sign Out

DEMO:

Jira

GitHub

AI

Tasks

Projects

Repositories

Branches

Files

Commits

Pull Requests

Activities

Analytics

Code Execution

Tests

Preview

Jira synchronization

---

106. DO NOT IMPLEMENT

Do NOT implement:

Firebase Admin SDK

Firestore

Real Jira OAuth

Real Jira API

Real GitHub OAuth

Real GitHub API

Real OpenAI API

Real code execution server

Real Docker execution

Real terminal execution

Real browser sandbox

Real deployment

These will be added later.

Create clean service interfaces so they can be implemented later.

---

107. IMPORTANT SECURITY RULE

Never put:

GitHub Client Secret

Jira Client Secret

OpenAI API Key

Firebase private key

Service account credentials

inside frontend source code.

Only Firebase Client SDK public configuration may exist in Vite environment variables.

All future private integrations must go through a backend.

---

108. PERFORMANCE

Use:

Lazy-loaded routes

Memoization where useful

TanStack Query caching

Virtualization if task lists become large

Avoid unnecessary re-renders.

Do not over-engineer.

---

109. ACCESSIBILITY

Use:

Semantic HTML

Keyboard navigation

ARIA labels

Accessible buttons

Visible focus states

Readable contrast

Keyboard-accessible modals

Keyboard-accessible file tree

---

110. FINAL USER JOURNEY

The complete application should work like this:

USER OPENS DEVFLOW AI

↓

LOGIN

↓

Continue with Google

↓

Firebase Authentication

↓

Authenticated user

↓

Projects

↓

Create or open project

↓

Project Overview

↓

Connect Jira

↓

Jira becomes connected

↓

Tasks appear

↓

Select DEV-142

↓

Open Task Details

↓

Relate Files

↓

Select GitHub repository

↓

Select:

src/services/github.ts

src/services/auth.ts

↓

Send to AI

↓

AI Context Preview

↓

Open AI Workspace

↓

AI analyzes task

↓

Implementation plan appears

↓

Generate Code

↓

Code diff appears

↓

Apply Changes

↓

Monaco editor updates

↓

Run Tests

↓

Tests pass

↓

Preview

↓

Ready for Review

↓

Complete Task

↓

Task becomes Done

↓

Show:

Jira synchronized ✓

This should feel like one continuous workflow.

---

111. PRODUCT POSITIONING

The interface should communicate the following product concept:

"DevFlow AI connects your Jira tasks directly to the code that needs to change and gives AI the exact context required to help you implement, review and test the task."

The product is NOT just:

A Jira clone.

It is NOT just:

An AI chatbot.

It is NOT just:

A GitHub browser.

It is a developer workflow platform connecting:

TASK MANAGEMENT

+

SOURCE CODE

+

AI

+

TESTING

+

PROJECT ANALYTICS

---

112. FINAL VISUAL QUALITY

The final UI should look like a serious startup SaaS product.

Target quality:

Production-quality

Premium

Developer-focused

Minimal

Fast

Clean

Consistent

Professional

Do not create a generic admin dashboard.

Avoid:

Huge gradients

Excessive rounded cards

Random colors

Clutter

Huge icons

Unnecessary animations

Generic placeholder layouts

Every screen should have a clear purpose.

---

113. IMPLEMENTATION ORDER

Implement in this exact order:

1. Vite + React + TypeScript setup

2. Tailwind

3. Ant Design

4. Firebase Client SDK

5. Firebase Google Authentication

6. Auth Store

7. Login Page

8. Protected Routes

9. Application Layout

10. Sidebar

11. Header

12. Demo Project Creation

13. Projects Page

14. Overview

15. Jira Demo Connection

16. Tasks Page

17. Task Filters

18. Task Details

19. Create Task

20. Relate Task

21. GitHub Demo Connection

22. Repository Browser

23. File Tree

24. File Viewer

25. AI Context

26. AI Workspace

27. AI Chat

28. Code Generation

29. Monaco Editor

30. Code Diff

31. Apply Changes

32. Test Runner Simulation

33. Preview Simulation

34. Task Workflow

35. Complete Task

36. Jira Sync Simulation

37. Activity

38. Analytics

39. Profile

40. Settings

41. Command Palette

42. Global Search

43. Notifications

44. Loading States

45. Empty States

46. Error States

47. Responsive Design

48. Accessibility

49. Animations

50. Final UI polish

---

114. FINAL REQUIREMENT

Generate the ACTUAL working React + TypeScript application.

Do NOT only provide design descriptions.

Do NOT only create static HTML.

Do NOT create screenshots.

Create functional React components.

Navigation must work.

Routing must work.

Google authentication must work through Firebase.

Project creation must work.

Demo data must work.

Jira connection simulation must work.

Task filtering must work.

Task searching must work.

Task details must work.

GitHub connection simulation must work.

Repository browsing must work.

File selection must work.

Task-to-file relationship must work.

AI Workspace must work.

AI mock responses must work.

Code editor must work.

Code diff must work.

Apply Changes must work.

Test simulation must work.

Preview simulation must work.

Task completion must work.

Jira synchronization simulation must work.

Profile must display real Firebase Google user information.

Sign out must work.

All UI must be connected to reusable services and stores.

Do not put mock data directly inside page components.

Do not hardcode user information.

Use the Firebase authenticated user for identity.

Use demo/mock data for everything else.

Make the application architecture ready for future backend integration.

The final result should feel like a real SaaS product that could be presented to a software company, startup, CTO, engineering manager or development team.

Start implementing the application now.

JIRA TASK MOCK DATA STRUCTURE

The Jira task mock data must follow the same structure as the real Jira API response.

The mock Jira response should have this structure:

{

    "success": true,

    "status": 200,

    "message": "Issues assigned to user retrieved successfully",

    "data": {

        "success": true,

        "issues": [

            {

                "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",

                "id": "10007",

                "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/issue/10007",

                "key": "SCRUM-8",

                "fields": {

                    "summary": "Task title",

                    "issuetype": {

                        "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/issuetype/10004",

                        "id": "10004",

                        "description": "Stories track functionality or features expressed as user goals.",

                        "iconUrl": "https://api.atlassian.com/...",

                        "name": "Story",

                        "subtask": false,

                        "avatarId": 10315,

                        "entityId": "1febaaf2-c8af-4e53-988a-dd2d845129e1",

                        "hierarchyLevel": 0

                    },

                    "created": "2026-08-08T14:58:50.863+0400",

                    "project": {

                        "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/project/10000",

                        "id": "10000",

                        "key": "SCRUM",

                        "name": "My Software Team",

                        "projectTypeKey": "software",

                        "simplified": true,

                        "avatarUrls": {

                            "48x48": "...",

                            "24x24": "...",

                            "16x16": "...",

                            "32x32": "..."

                        }

                    },

                    "priority": {

                        "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/priority/3",

                        "iconUrl": "...",

                        "name": "Medium",

                        "id": "3"

                    },

                    "updated": "2026-08-08T18:25:24.837+0400",

                    "status": {

                        "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/status/10003",

                        "description": "",

                        "iconUrl": "...",

                        "name": "Done",

                        "id": "10003",

                        "statusCategory": {

                            "self": "https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/statuscategory/3",

                            "id": 3,

                            "key": "done",

                            "colorName": "green",

                            "name": "Done"

                        }

                    }

                }

            }

        ],

        "isLast": true

    }

}

Task Table

Tasklar Jira response-dakı data.issues array-dən götürülərək table şəklində göstərilməlidir.

USE ONLY REACT ROUTER DOM NEVER USE ZUSTAND

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63ff0cc2-5468-4478-ad29-2ea790d0ce60).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
