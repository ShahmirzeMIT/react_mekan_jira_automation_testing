import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FullScreenLoader } from "@/components/common/States";
import { useAppStore } from "@/store/appStore";

export default function Index() {
  const { isAuthenticated, isLoading } = useAppStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    navigate(isAuthenticated ? "/tasks" : "/login", { replace: true });
  }, [isLoading, isAuthenticated, navigate]);
  return <FullScreenLoader label="Starting DevFlow AI" />;
}
