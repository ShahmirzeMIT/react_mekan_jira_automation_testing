// src/hooks/useWebContainerRunner.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { buildFileSystemTree, pickDevCommand, type WebContainerFile } from "@/lib/buildFileSystemTree";

export type RunStatus = "idle" | "boot" | "install" | "build" | "live" | "error";

// One WebContainer instance per browser tab — the API only allows a single
// boot() call per page. Cached as a promise so concurrent callers await the
// same boot, and cleared on failure so the next attempt can retry.
let webcontainerSingleton: Promise<any> | null = null;
async function getWebContainer() {
  if (!webcontainerSingleton) {
    const { WebContainer } = await import("@webcontainer/api");
    webcontainerSingleton = WebContainer.boot().catch((err: unknown) => {
      webcontainerSingleton = null;
      throw err;
    });
  }
  return webcontainerSingleton;
}

export function useWebContainerRunner() {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [log, setLog] = useState("");
  const [previewOrigin, setPreviewOrigin] = useState("");
  const [path, setPath] = useState("/");
  const [reloadKey, setReloadKey] = useState(0);

  const devProcessRef = useRef<any>(null);
  const listenersAttachedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const appendLog = useCallback((chunk: string) => {
    if (!mountedRef.current) return;
    setLog((prev) => (prev + chunk).slice(-8000));
  }, []);

  const run = useCallback(
    async (files: WebContainerFile[]) => {
      setStatus("boot");
      setLog("");
      setPreviewOrigin("");
      setPath("/");
      try {
        const wc = await getWebContainer();
        appendLog("$ konteyner hazırdır\n");

        // A previous run's dev server can still hold the port and file
        // locks (node_modules/.vite cache, etc). Mounting + installing on
        // top of it is what makes npm install hang — kill it first.
        if (devProcessRef.current) {
          appendLog("$ əvvəlki proses dayandırılır…\n");
          devProcessRef.current.kill();
          await devProcessRef.current.exit.catch(() => {});
          devProcessRef.current = null;
        }

        // wc is a module-level singleton reused across every run, so
        // listeners must be attached exactly once — not on every call —
        // or they stack up and fire multiple times per event.
        if (!listenersAttachedRef.current) {
          wc.on("server-ready", (_port: number, url: string) => {
            appendLog(`$ server hazır: ${url}\n`);
            setPreviewOrigin(url.replace(/\/$/, ""));
            setPath("/");
            setReloadKey((k) => k + 1);
            setStatus("live");
          });
          wc.on("error", (err: Error) => {
            appendLog("\n! WebContainer daxili xətası: " + err.message + "\n");
            setStatus("error");
          });
          listenersAttachedRef.current = true;
        }

        await wc.mount(buildFileSystemTree(files));
        appendLog(`$ fayllar mount olundu (${files.length} fayl)\n`);

        setStatus("install");
        const install = await wc.spawn("npm", ["install"]);
        install.output.pipeTo(new WritableStream({ write: (d: string) => appendLog(d) }));
        const installExit = await install.exit;
        if (installExit !== 0) {
          throw new Error(`npm install uğursuz oldu (exit code ${installExit})`);
        }

        setStatus("build");
        const pkgJson = await wc.fs.readFile("package.json", "utf-8");
        const [cmd, args] = pickDevCommand(pkgJson);
        appendLog(`$ ${cmd} ${args.join(" ")}\n`);
        const devProcess = await wc.spawn(cmd, args);
        devProcessRef.current = devProcess;
        devProcess.output.pipeTo(new WritableStream({ write: (d: string) => appendLog(d) }));

        devProcess.exit.then((code: number) => {
          if (devProcessRef.current !== devProcess) return; // superseded by a rerun
          setStatus((current) => {
            if (current !== "live") {
              appendLog(`\n! dev prosesi çıxdı (exit code ${code}) — server-ready heç vaxt gəlmədi\n`);
              return "error";
            }
            return current;
          });
        });
      } catch (err) {
        appendLog("\n! " + (err instanceof Error ? err.message : String(err)) + "\n");
        setStatus("error");
      }
    },
    [appendLog]
  );

  const navigate = useCallback((nextPath: string) => {
    let p = nextPath.trim();
    if (!p.startsWith("/")) p = "/" + p;
    setPath(p);
    setReloadKey((k) => k + 1);
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const iframeSrc = previewOrigin ? `${previewOrigin}${path}` : "";

  return { status, log, previewOrigin, path, setPath, iframeSrc, reloadKey, run, navigate, reload };
}
