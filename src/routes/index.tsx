import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FullScreenLoader } from "@/components/common/States";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "DevFlow AI — Jira tasks, GitHub code and AI in one workspace" },
      { name: "description", content: "DevFlow AI connects Jira tasks to the code that needs to change and gives AI the exact context to implement, review and test the work." },
      { property: "og:title", content: "DevFlow AI — developer workflow platform" },
      { property: "og:description", content: "Turn development tasks into working code with Jira, GitHub and AI in one workspace." },
    ],
  }),
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAppStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    navigate({ to: isAuthenticated ? "/projects" : "/login", replace: true });
  }, [isLoading, isAuthenticated, navigate]);
  return <FullScreenLoader label="Starting DevFlow AI" />;
}
