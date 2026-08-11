import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppStoreProvider } from "@/store/appStore";
import AppLayout from "@/routes/_app";
import ActivityPage from "@/routes/_app.activity";
import AIWorkspacePage from "@/routes/_app.ai-workspace";
import GithubPage from "@/routes/_app.github";
import RelateTaskPage from "@/routes/_app.relate-task";
import TaskDetailsPage from "@/routes/_app.tasks.$taskId";
import TasksPage from "@/routes/_app.tasks.index";
import ProfilePage from "@/routes/_app.profile";
import SettingsPage from "@/routes/_app.settings";
import Index from "@/routes/index";
import LoginPage from "@/routes/login";
import JiraCallbackPage from "@/routes/jira-callback";
import AcceptGithubPage from "@/routes/_app.accept.github";
import WcRunnerPage from "./routes/_app.wcrunner";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Page not found.
    </div>
  );
}

export function App() {
  return (
    <AppStoreProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/jira/callback" element={<JiraCallbackPage />} />
        <Route path="/accept-github" element={<AcceptGithubPage />} />
        <Route element={<AppLayout />}>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
          <Route path="/ai-workspace" element={<AIWorkspacePage />} />
          <Route path="/github" element={<GithubPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/relate-task" element={<RelateTaskPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wc-preview/runner" element={<WcRunnerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        <Route path="/app" element={<Navigate to="/tasks" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </AppStoreProvider>
  );
}
