import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import { mockActivities } from "@/mock/activities";
import type {
  ActivityEvent,
  ActivityKind,
  AIMessage,
  AIStatus,
  AuthUser,
  CodeDiff,
  TestResult,
} from "@/types";

interface IntegrationState {
  jiraConnected: boolean;
  githubConnected: boolean;
  jiraProject: string | null;
  githubRepository: string | null;
  jiraLastSync: string | null;
  githubLastSync: string | null;
}

interface AIWorkspaceState {
  selectedTaskKey: string | null;
  selectedFiles: string[];
  messages: AIMessage[];
  aiStatus: AIStatus;
  activeFile: string | null;
  generatedChanges: CodeDiff[];
  appliedFiles: Record<string, string>;
  testResults: TestResult[] | null;
  previewOpen: boolean;
}

interface AppStore {
  // auth
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  // ui
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  // integrations
  integrations: IntegrationState;
  connectJira: (project: string) => void;
  disconnectJira: () => void;
  connectGithub: (repository: string) => void;
  disconnectGithub: () => void;
  // activity
  activities: ActivityEvent[];
  logActivity: (kind: ActivityKind, title: string, meta?: { taskKey?: string; repository?: string }) => void;
  // ai workspace
  ai: AIWorkspaceState;
  setTask: (key: string | null) => void;
  selectFile: (path: string) => void;
  removeFile: (path: string) => void;
  setSelectedFiles: (paths: string[]) => void;
  pushMessage: (message: AIMessage) => void;
  setMessages: (messages: AIMessage[]) => void;
  setAIStatus: (status: AIStatus) => void;
  setActiveFile: (path: string | null) => void;
  setGeneratedChanges: (diffs: CodeDiff[]) => void;
  applyChanges: () => void;
  setTestResults: (results: TestResult[] | null) => void;
  setPreviewOpen: (open: boolean) => void;
}

const Ctx = createContext<AppStore | null>(null);

const initialAI: AIWorkspaceState = {
  selectedTaskKey: "DEV-142",
  selectedFiles: ["src/services/github.ts", "src/services/auth.ts"],
  messages: [],
  aiStatus: "ready",
  activeFile: "src/services/github.ts",
  generatedChanges: [],
  appliedFiles: {},
  testResults: null,
  previewOpen: false,
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>(mockActivities);
  const [integrations, setIntegrations] = useState<IntegrationState>({
    jiraConnected: false,
    githubConnected: false,
    jiraProject: null,
    githubRepository: null,
    jiraLastSync: null,
    githubLastSync: null,
  });
  const [ai, setAI] = useState<AIWorkspaceState>(initialAI);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logActivity = useCallback<AppStore["logActivity"]>((kind, title, meta) => {
    setActivities((prev) => [
      { id: `a-${Date.now()}`, kind, title, user: "You", time: "Just now", ...meta },
      ...prev,
    ]);
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn: async () => {
        const next = await authService.signInWithGoogle();
        setUser(next);
        setLoading(false);
      },
      signOut: async () => {
        await authService.signOut();
        setUser(null);
        setIntegrations({
          jiraConnected: false,
          githubConnected: false,
          jiraProject: null,
          githubRepository: null,
          jiraLastSync: null,
          githubLastSync: null,
        });
        setAI(initialAI);
      },
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
      commandOpen,
      setCommandOpen,
      integrations,
      connectJira: (project) =>
        setIntegrations((s) => ({ ...s, jiraConnected: true, jiraProject: project, jiraLastSync: "Just now" })),
      disconnectJira: () =>
        setIntegrations((s) => ({ ...s, jiraConnected: false, jiraProject: null, jiraLastSync: null })),
      connectGithub: (repository) =>
        setIntegrations((s) => ({ ...s, githubConnected: true, githubRepository: repository, githubLastSync: "Just now" })),
      disconnectGithub: () =>
        setIntegrations((s) => ({ ...s, githubConnected: false, githubRepository: null, githubLastSync: null })),
      activities,
      logActivity,
      ai,
      setTask: (key) => setAI((s) => ({ ...s, selectedTaskKey: key })),
      selectFile: (path) =>
        setAI((s) => (s.selectedFiles.includes(path) ? s : { ...s, selectedFiles: [...s.selectedFiles, path] })),
      removeFile: (path) => setAI((s) => ({ ...s, selectedFiles: s.selectedFiles.filter((p) => p !== path) })),
      setSelectedFiles: (paths) => setAI((s) => ({ ...s, selectedFiles: paths })),
      pushMessage: (message) => setAI((s) => ({ ...s, messages: [...s.messages, message] })),
      setMessages: (messages) => setAI((s) => ({ ...s, messages })),
      setAIStatus: (aiStatus) => setAI((s) => ({ ...s, aiStatus })),
      setActiveFile: (activeFile) => setAI((s) => ({ ...s, activeFile })),
      setGeneratedChanges: (generatedChanges) => setAI((s) => ({ ...s, generatedChanges })),
      applyChanges: () =>
        setAI((s) => ({
          ...s,
          appliedFiles: {
            ...s.appliedFiles,
            ...Object.fromEntries(s.generatedChanges.map((d) => [d.path, d.newContent])),
          },
          aiStatus: "applied",
        })),
      setTestResults: (testResults) => setAI((s) => ({ ...s, testResults })),
      setPreviewOpen: (previewOpen) => setAI((s) => ({ ...s, previewOpen })),
    }),
    [user, isLoading, sidebarCollapsed, commandOpen, integrations, activities, ai, logActivity],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}