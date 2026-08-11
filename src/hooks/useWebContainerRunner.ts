import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainerFile } from "@/lib/buildFileSystemTree";

export type RunStatus = "idle" | "boot" | "install" | "build" | "live" | "error";

// Must stay under /wc-preview — that's the only path vite.config.ts
// applies COOP/COEP to. Applying those headers anywhere else (or
// globally) breaks Firebase's signInWithPopup(), so this route is the
// ONLY place in the app that is cross-origin isolated. An iframe cannot
// be isolated unless its parent is too, so this has to be a real
// top-level popup/tab (window.open), not an <iframe>.
const RUNNER_PATH = "/wc-preview/runner";

export function useWebContainerRunner() {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [log, setLog] = useState("");
  const [previewOrigin, setPreviewOrigin] = useState("");
  const [path, setPath] = useState("/");
  const [reloadKey, setReloadKey] = useState(0);
  // True once we've tried to open the runner and the browser refused
  // (popup blocked). The UI can show a manual "Open Runner" button —
  // a plain, isolated click on that button is the most reliable way to
  // get a popup blocker to allow it.
  const [popupBlocked, setPopupBlocked] = useState(false);

  const channelIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `wc-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  const channelRef = useRef<BroadcastChannel | null>(null);
  const runnerWindowRef = useRef<Window | null>(null);
  const runnerReadyRef = useRef(false);
  const pendingFilesRef = useRef<WebContainerFile[] | null>(null);
  const mountedRef = useRef(true);
  // Hidden real <a> element — clicking it programmatically is treated
  // by browsers as closer to a genuine navigation than window.open(),
  // and is what we retry with if window.open() returns null.
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  const appendLog = useCallback((chunk: string) => {
    if (!mountedRef.current) return;
    setLog((prev) => (prev + chunk).slice(-8000));
  }, []);

  const ensureChannel = useCallback(() => {
    if (channelRef.current) return channelRef.current;

    const ch = new BroadcastChannel(`wc-runner-${channelIdRef.current}`);
    ch.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "wc:ready": {
          runnerReadyRef.current = true;
          setPopupBlocked(false);
          if (pendingFilesRef.current) {
            ch.postMessage({ type: "wc:run", files: pendingFilesRef.current });
            pendingFilesRef.current = null;
          }
          break;
        }
        case "wc:log":
          appendLog(String(msg.chunk ?? ""));
          break;
        case "wc:status":
          setStatus(msg.status as RunStatus);
          break;
        case "wc:server-ready": {
          const url = String(msg.url ?? "");
          setPreviewOrigin(url.replace(/\/$/, ""));
          setPath("/");
          setReloadKey((k) => k + 1);
          setStatus("live");
          break;
        }
        case "wc:error":
          appendLog("\n! " + String(msg.message ?? "naməlum xəta") + "\n");
          setStatus("error");
          break;
        default:
          break;
      }
    };

    channelRef.current = ch;
    return ch;
  }, [appendLog]);

  useEffect(() => {
    mountedRef.current = true;

    // A real, invisible anchor in the DOM. Programmatic .click() on an
    // <a target="_blank"> is honored by popup blockers far more
    // consistently than window.open() from inside nested async logic.
    const a = document.createElement("a");
    a.target = `wc-runner-${channelIdRef.current}`;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    anchorRef.current = a;

    ensureChannel();

    return () => {
      mountedRef.current = false;
      channelRef.current?.close();
      channelRef.current = null;
      anchorRef.current?.remove();
      anchorRef.current = null;
      if (runnerWindowRef.current && !runnerWindowRef.current.closed) {
        runnerWindowRef.current.close();
      }
      runnerWindowRef.current = null;
    };
  }, [ensureChannel]);

  // MUST be called synchronously, directly inside the click handler
  // that triggered it — before any `await`. Anything async before this
  // call makes the browser stop treating it as a user gesture and the
  // popup gets silently blocked.
  const openRunner = useCallback(() => {
    ensureChannel();
    runnerReadyRef.current = false;
    pendingFilesRef.current = null;
    setPopupBlocked(false);
    setStatus("boot");
    setLog("");
    setPreviewOrigin("");
    setPath("/");

    if (runnerWindowRef.current && !runnerWindowRef.current.closed) {
      runnerWindowRef.current.focus();
      return;
    }

    const url = `${RUNNER_PATH}?channel=${encodeURIComponent(channelIdRef.current)}`;

    // Prefer window.open — gives us a reference so we can .focus() it
    // on subsequent runs instead of spawning duplicate tabs.
    const win = window.open(url, `wc-runner-${channelIdRef.current}`);
    if (win) {
      runnerWindowRef.current = win;
      return;
    }

    // window.open() was blocked. Fall back to a real anchor click,
    // which some browsers/extensions allow even when window.open()
    // doesn't. We lose the window reference either way (rel=noopener),
    // but BroadcastChannel doesn't need one.
    if (anchorRef.current) {
      anchorRef.current.href = url;
      anchorRef.current.click();
      // We can't detect from here whether the anchor click actually
      // opened anything (no return value, no reference). Give the
      // runner page a moment to announce itself over the channel; if
      // it hasn't by then, tell the UI to show a manual fallback.
      window.setTimeout(() => {
        if (!runnerReadyRef.current && mountedRef.current) {
          setPopupBlocked(true);
        }
      }, 1500);
      return;
    }

    setStatus("error");
    setPopupBlocked(true);
    appendLog(
      "\n! Runner pəncərəsi açıla bilmədi. Brauzerin ünvan zolağında pop-up blok işarəsinə bax və bu sayt üçün pop-up-lara icazə ver.\n"
    );
  }, [appendLog, ensureChannel]);

  // Manual, always-visible fallback: a plain button the user clicks
  // themselves, with nothing else happening in the handler. This is
  // the most popup-blocker-proof gesture there is.
  const openRunnerManually = useCallback(() => {
    openRunner();
  }, [openRunner]);

  const run = useCallback(
    (files: WebContainerFile[]) => {
      const ch = ensureChannel();
      if (runnerReadyRef.current) {
        ch.postMessage({ type: "wc:run", files });
      } else {
        pendingFilesRef.current = files;
      }
    },
    [ensureChannel]
  );

  const navigate = useCallback((nextPath: string) => {
    let p = nextPath.trim();
    if (!p.startsWith("/")) p = "/" + p;
    setPath(p);
    setReloadKey((k) => k + 1);
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const iframeSrc = previewOrigin ? `${previewOrigin}${path}` : "";

  return {
    status,
    log,
    previewOrigin,
    path,
    setPath,
    iframeSrc,
    reloadKey,
    popupBlocked,
    openRunner,
    openRunnerManually,
    run,
    navigate,
    reload,
  };
}