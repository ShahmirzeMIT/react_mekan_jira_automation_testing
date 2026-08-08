import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppStoreProvider } from "@/store/appStore";
import AppLayout from "@/routes/_app";
import ActivityPage from "@/routes/_app.projects.$projectId.activity";
import AIWorkspacePage from "@/routes/_app.projects.$projectId.ai-workspace";
import GithubPage from "@/routes/_app.projects.$projectId.github";
import OverviewPage from "@/routes/_app.projects.$projectId.overview";
import RelateTaskPage from "@/routes/_app.projects.$projectId.relate-task";
import TaskDetailsPage from "@/routes/_app.projects.$projectId.tasks.$taskId";
import TasksPage from "@/routes/_app.projects.$projectId.tasks.index";
import ProjectsPage from "@/routes/_app.projects.index";
import ProfilePage from "@/routes/_app.profile";
import SettingsPage from "@/routes/_app.settings";
import Index from "@/routes/index";
import LoginPage from "@/routes/login";

function NotFound() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Page not found.</div>;
}

export function App() {
  return (
    <AppStoreProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/overview" element={<OverviewPage />} />
          <Route path="/projects/:projectId/tasks" element={<TasksPage />} />
          <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetailsPage />} />
          <Route path="/projects/:projectId/relate-task" element={<RelateTaskPage />} />
          <Route path="/projects/:projectId/ai-workspace" element={<AIWorkspacePage />} />
          <Route path="/projects/:projectId/github" element={<GithubPage />} />
          <Route path="/projects/:projectId/activity" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        <Route path="/app" element={<Navigate to="/projects" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </AppStoreProvider>
  );
}
