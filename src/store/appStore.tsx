// appStore.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getRedirectResult, onIdTokenChanged, type User as FirebaseUser } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { getFirebaseAuth } from "@/config/firebase";
import { db } from "@/config/firebase";
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
  /** True after the signed-in user's Jira connection has been checked in Firestore. */
  jiraConnectionChecked: boolean;
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

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "devflow.theme";
const SIDEBAR_STORAGE_KEY = "devflow.sidebar-collapsed";

type JiraConnection = {
  jiraProject: string | null;
  jiraLastSync: string | null;
};

async function findJiraConnection(email: string): Promise<JiraConnection | null> {
  if (!db) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(collection(db, "jira_users"));
  const document = snapshot.docs.find((item) => {
    const data = item.data();
    const jiraEmail = data["jiraUserEmail"];
    return typeof jiraEmail === "string" && jiraEmail.trim().toLowerCase() === normalizedEmail;
  });

  if (!document) return null;

  const data = document.data();
  return {
    jiraProject: typeof data["jiraDisplayName"] === "string" ? data["jiraDisplayName"] : null,
    jiraLastSync: typeof data["lastSyncAt"] === "string" ? data["lastSyncAt"] : null,
  };
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

function getStoredSidebarState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

interface AppStore {
  // auth
  user: AuthUser | null;
  /** The Firebase ID token for authenticated API requests. Kept in memory only. */
  idToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Set if the redirect-based Google sign-in round-trip came back with an error. */
  redirectError: unknown;
  // ui
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
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
  logActivity: (
    kind: ActivityKind,
    title: string,
    meta?: { taskKey?: string; repository?: string },
  ) => void;
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
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<unknown>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredSidebarState);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>(mockActivities);
  const [integrations, setIntegrations] = useState<IntegrationState>({
    jiraConnected: false,
    jiraConnectionChecked: false,
    githubConnected: false,
    jiraProject: null,
    githubRepository: null,
    jiraLastSync: null,
    githubLastSync: null,
  });
  const [ai, setAI] = useState<AIWorkspaceState>(initialAI);

  useEffect(() => {
    let refreshInterval: ReturnType<typeof setInterval> | undefined;
    let unsubscribe = () => {};
    let isMounted = true;

    const clearRefreshInterval = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = undefined;
      }
    };

    const refreshToken = async (firebaseUser: FirebaseUser): Promise<string> => {
      // `true` forces Firebase to obtain a new ID token instead of returning a cached one.
      const token = await firebaseUser.getIdToken(true);
      if (isMounted) setIdToken(token);
      return token;
    };

    const initializeAuth = () => {
      const auth = getFirebaseAuth();
      if (!auth) {
        setUser(null);
        setIdToken(null);
        setIntegrations((current) => ({ ...current, jiraConnected: false, jiraConnectionChecked: true }));
        setLoading(false);
        return;
      }

      // Catch the result of a signInWithRedirect() round-trip. This resolves
      // to null on a normal page load with no pending redirect, and to the
      // signed-in user right after Google sends the browser back here. Any
      // error here (e.g. the user cancelled the Google account chooser)
      // would otherwise be silently lost, since nothing is awaiting the
      // original signInWithRedirect() call across the navigation.
      getRedirectResult(auth).catch((error: unknown) => {
        if (isMounted) setRedirectError(error);
      });

      // Unlike onAuthStateChanged, this also runs whenever Firebase refreshes an ID token.
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        clearRefreshInterval();

        if (!firebaseUser) {
          if (isMounted) {
            setUser(null);
            setIdToken(null);
            setIntegrations((current) => ({ ...current, jiraConnected: false, jiraConnectionChecked: true }));
            setLoading(false);
          }
          return;
        }

        try {
          // No force refresh is necessary on initial load: Firebase refreshes expired tokens itself.
          const token = await firebaseUser.getIdToken();
          if (!isMounted) return;

          const appUser = authService.getCurrentUser();
          setUser(appUser);
          setIdToken(token);
          setRedirectError(null);

          const jiraConnection = appUser?.email
            ? await findJiraConnection(appUser.email).catch((error: unknown) => {
                console.error("Unable to read Jira connection:", error);
                return null;
              })
            : null;
          if (!isMounted) return;

          setIntegrations((current) => ({
            ...current,
            jiraConnected: Boolean(jiraConnection),
            jiraConnectionChecked: true,
            jiraProject: jiraConnection?.jiraProject ?? null,
            jiraLastSync: jiraConnection?.jiraLastSync ?? null,
          }));
          setLoading(false);

          // ID tokens normally last one hour; renew early while the app remains open.
          refreshInterval = setInterval(
            () => {
              void refreshToken(firebaseUser).catch((error) => {
                console.error("Firebase token refresh failed:", error);
              });
            },
            50 * 60 * 1000,
          );
        } catch (error) {
          console.error("Firebase token initialization failed:", error);
          if (isMounted) {
            setUser(null);
            setIdToken(null);
            setIntegrations((current) => ({ ...current, jiraConnected: false, jiraConnectionChecked: true }));
            setLoading(false);
          }
        }
      });
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe();
      clearRefreshInterval();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const logActivity = useCallback<AppStore["logActivity"]>(
    (kind, title, meta) => {
      setActivities((prev) => [
        {
          id: `a-${Date.now()}`,
          kind,
          title,
          user: user?.name || "User",
          time: "Just now",
          ...meta,
        },
        ...prev,
      ]);
    },
    [user],
  );

  const value = useMemo<AppStore>(
    () => ({
      user,
      idToken,
      isAuthenticated: Boolean(user),
      isLoading,
      redirectError,
      signIn: async () => {
        // authService.signInWithGoogle() should call Firebase's
        // signInWithRedirect(auth, provider) — NOT signInWithPopup. Popup
        // auth relies on a live window.opener link back to this page, which
        // a strict Cross-Origin-Opener-Policy: same-origin header (required
        // elsewhere in this app for WebContainer/SharedArrayBuffer support)
        // severs, surfacing as auth/popup-closed-by-user. Redirect performs
        // a full navigation instead, so it isn't affected by COOP at all.
        //
        // Because this is a redirect, this call resolves once the browser
        // *starts* navigating to Google — it does not resolve with the
        // signed-in user. The actual result is picked up above by
        // getRedirectResult()/onIdTokenChanged() after the browser returns.
        try {
          await authService.signInWithGoogle();
        } catch (error) {
          console.error("Sign in failed:", error);
          throw error;
        }
      },
      signOut: async () => {
        try {
          await authService.signOut();
          setUser(null);
          setIdToken(null);
        } catch (error) {
          console.error("Sign out failed:", error);
          throw error;
        } finally {
          setIntegrations({
            jiraConnected: false,
            jiraConnectionChecked: false,
            githubConnected: false,
            jiraProject: null,
            githubRepository: null,
            jiraLastSync: null,
            githubLastSync: null,
          });
          setAI(initialAI);
          setLoading(false);
        }
      },
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      commandOpen,
      setCommandOpen,
      integrations,
      connectJira: (project) =>
        setIntegrations((s) => ({
          ...s,
          jiraConnected: true,
          jiraProject: project,
          jiraLastSync: "Just now",
        })),
      disconnectJira: () =>
        setIntegrations((s) => ({
          ...s,
          jiraConnected: false,
          jiraProject: null,
          jiraLastSync: null,
        })),
      connectGithub: (repository) =>
        setIntegrations((s) => ({
          ...s,
          githubConnected: true,
          githubRepository: repository,
          githubLastSync: "Just now",
        })),
      disconnectGithub: () =>
        setIntegrations((s) => ({
          ...s,
          githubConnected: false,
          githubRepository: null,
          githubLastSync: null,
        })),
      activities,
      logActivity,
      ai,
      setTask: (key) => setAI((s) => ({ ...s, selectedTaskKey: key })),
      selectFile: (path) =>
        setAI((s) =>
          s.selectedFiles.includes(path) ? s : { ...s, selectedFiles: [...s.selectedFiles, path] },
        ),
      removeFile: (path) =>
        setAI((s) => ({ ...s, selectedFiles: s.selectedFiles.filter((p) => p !== path) })),
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
    [
      user,
      idToken,
      isLoading,
      redirectError,
      sidebarCollapsed,
      theme,
      commandOpen,
      integrations,
      activities,
      ai,
      logActivity,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}