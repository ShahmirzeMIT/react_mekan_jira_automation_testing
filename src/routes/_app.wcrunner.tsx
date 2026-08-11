//
// This page loads in a real top-level tab now (opened via window.open
// from useWebContainerRunner), not a hidden iframe. The Vite plugin in
// vite.config.ts applies COOP: same-origin + COEP: require-corp to
// every request under /wc-preview — those headers only take effect on
// a top-level document, which is exactly why this had to stop being an
// iframe. That's what makes self.crossOriginIsolated true here,
// required for WebContainer.boot() to transfer SharedArrayBuffers to
// its worker.
//
// Because COOP: same-origin can sever the window.opener link back to
// the parent tab, we never rely on window.opener/window.parent for
// messaging. Instead both sides open a BroadcastChannel keyed by a
// random id passed in the URL (?channel=...) — that only needs same
// origin, not a live window reference.
//
import { useEffect, useRef } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import {
  buildFileSystemTree,
  looksLikePythonWebServer,
  pickPythonEntry,
  pickRunCommand,
  type PreviewRunMode,
  type WebContainerFile,
} from "@/lib/buildFileSystemTree";
import { parseDotEnv, type PreviewEnvConfig } from "@/lib/previewEnv";
import type { RunStatus } from "@/hooks/useWebContainerRunner";

interface PyodideRuntime {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
}

// Same "one boot() per page" singleton as before, just living in the
// isolated tab's page context instead of a hidden iframe's.
let webcontainerSingleton: Promise<WebContainer> | null = null;
let pyodideSingleton: Promise<PyodideRuntime> | null = null;

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

async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Pyodide yüklənə bilmədi."));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideRuntime> {
  if (!pyodideSingleton) {
    pyodideSingleton = (async () => {
      await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      const loader = (
        window as typeof window & {
          loadPyodide?: (options: unknown) => Promise<PyodideRuntime>;
        }
      ).loadPyodide;
      if (!loader) throw new Error("Pyodide loader tapılmadı.");
      return loader({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    })().catch((err: unknown) => {
      pyodideSingleton = null;
      throw err;
    });
  }
  return pyodideSingleton;
}

export default function WcRunnerPage() {
  const devProcessRef = useRef<WebContainerProcess | null>(null);
  const listenersAttachedRef = useRef(false);
  const serverReadyFiredRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get("channel");
    if (!channelId) {
      // No channel id in the URL — this tab has nothing to talk to.
      return;
    }

    const channel = new BroadcastChannel(`wc-runner-${channelId}`);
    channelRef.current = channel;

    function post(message: Record<string, unknown>) {
      channel.postMessage(message);
    }
    function postStatus(status: RunStatus) {
      post({ type: "wc:status", status });
    }
    function postLog(chunk: string) {
      post({ type: "wc:log", chunk });
    }

    async function runPython(files: WebContainerFile[], envs: PreviewEnvConfig) {
      const entry = pickPythonEntry(files);
      if (!entry) throw new Error("Python entry faylı tapılmadı. main.py və ya app.py əlavə edin.");

      if (looksLikePythonWebServer(entry.content)) {
        throw new Error(
          "Python Flask/FastAPI/Django serverləri bu browser runner-də native server kimi işləmir. Python mode hazırda script/console execution üçündür.",
        );
      }

      postStatus("install");
      postLog("$ pyodide yüklənir...\n");
      const pyodide = await getPyodide();
      const envText = envs.backendEnv.trim();
      const envVars = parseDotEnv(envText);

      postStatus("build");
      postLog(`$ python ${entry.path}\n`);

      const output: string[] = [];
      pyodide.setStdout({ batched: (text: string) => output.push(text) });
      pyodide.setStderr({ batched: (text: string) => output.push(text) });
      const envPrelude = Object.entries(envVars)
        .map(([key, value]) => `os.environ[${JSON.stringify(key)}] = ${JSON.stringify(value)}`)
        .join("\n");
      const pythonSource = ["import os", envPrelude, entry.content].filter(Boolean).join("\n\n");
      await pyodide.runPythonAsync(pythonSource);

      if (output.length) postLog(`${output.join("\n")}\n`);
      postLog("$ python script tamamlandı\n");
      postStatus("live");
    }

    async function runWebContainer(
      files: WebContainerFile[],
      mode: PreviewRunMode,
      envs: PreviewEnvConfig,
    ) {
      if (!window.crossOriginIsolated) {
        postLog(
          "\n! Bu səhifə cross-origin isolated deyil (COOP/COEP başlıqları tətbiq olunmayıb). WebContainer başladıla bilməz.\n",
        );
        postStatus("error");
        return;
      }

      serverReadyFiredRef.current = false;
      postStatus("boot");

      try {
        const wc = await getWebContainer();
        postLog("$ konteyner hazırdır\n");

        // A previous run's dev server can still hold the port and file
        // locks (node_modules/.vite cache, etc). Mounting + installing
        // on top of it is what makes npm install hang — kill it first.
        if (devProcessRef.current) {
          postLog("$ əvvəlki proses dayandırılır…\n");
          devProcessRef.current.kill();
          await devProcessRef.current.exit.catch(() => {});
          devProcessRef.current = null;
        }

        // wc is a module-level singleton reused across every run, so
        // listeners must be attached exactly once — not on every call —
        // or they stack up and fire multiple times per event.
        if (!listenersAttachedRef.current) {
          wc.on("server-ready", (_port: number, url: string) => {
            serverReadyFiredRef.current = true;
            postLog(`$ server hazır: ${url}\n`);
            post({ type: "wc:server-ready", url });
          });
          wc.on("error", (err: Error) => {
            postLog("\n! WebContainer daxili xətası: " + err.message + "\n");
            postStatus("error");
          });
          listenersAttachedRef.current = true;
        }

        const activeEnvText =
          mode === "frontend"
            ? envs.frontendEnv.trim()
            : mode === "node" || mode === "python"
              ? envs.backendEnv.trim()
              : "";
        const envVars = parseDotEnv(activeEnvText);
        const mountedFiles =
          activeEnvText.length > 0 ? [...files, { path: ".env", content: activeEnvText }] : files;

        await wc.mount(buildFileSystemTree(mountedFiles));
        postLog(`$ fayllar mount olundu (${mountedFiles.length} fayl)\n`);

        const picked = pickRunCommand(files, mode);
        postLog(`$ runtime: ${picked.mode}\n`);

        if (picked.install) {
          postStatus("install");
          const install = await wc.spawn("npm", ["install"], { env: envVars });
          install.output.pipeTo(new WritableStream({ write: (d: string) => postLog(d) }));
          const installExit = await install.exit;
          if (installExit !== 0) {
            throw new Error(`npm install uğursuz oldu (exit code ${installExit})`);
          }
        }

        postStatus("build");
        postLog(`$ ${picked.label}\n`);
        const devProcess = await wc.spawn(picked.command, picked.args, { env: envVars });
        devProcessRef.current = devProcess;
        devProcess.output.pipeTo(new WritableStream({ write: (d: string) => postLog(d) }));

        devProcess.exit.then((code: number) => {
          if (devProcessRef.current !== devProcess) return; // superseded by a rerun
          if (!serverReadyFiredRef.current) {
            postLog(`\n! dev prosesi çıxdı (exit code ${code}) — server-ready heç vaxt gəlmədi\n`);
            postStatus("error");
          }
        });
      } catch (err) {
        post({
          type: "wc:error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    async function handleRun(
      files: WebContainerFile[],
      mode: PreviewRunMode,
      envs: PreviewEnvConfig,
    ) {
      try {
        if (
          mode === "python" ||
          (mode === "auto" &&
            pickPythonEntry(files) &&
            !files.some((file) => file.path === "package.json"))
        ) {
          await runPython(files, envs);
          return;
        }

        await runWebContainer(files, mode, envs);
      } catch (err) {
        post({
          type: "wc:error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "wc:run" && Array.isArray(msg.files)) {
        const mode =
          msg.mode === "frontend" || msg.mode === "node" || msg.mode === "python"
            ? msg.mode
            : "auto";
        const envs = {
          backendEnv: typeof msg.envs?.backendEnv === "string" ? msg.envs.backendEnv : "",
          frontendEnv: typeof msg.envs?.frontendEnv === "string" ? msg.envs.frontendEnv : "",
        };
        void handleRun(msg.files as WebContainerFile[], mode, envs);
      } else if (msg.type === "wc:reset") {
        serverReadyFiredRef.current = false;
      }
    };

    // Tell the parent tab we're loaded and listening — it may have
    // queued a run request while this tab was still loading.
    post({ type: "wc:ready" });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: 16,
        color: "#ddd",
        background: "#111",
        minHeight: "100vh",
      }}
    >
      <p>WebContainer runner işləyir — nəticələri əsas pəncərədə görəcəksiniz.</p>
      <p style={{ opacity: 0.6, fontSize: 12 }}>
        Bu tabı bağlamayın, əks halda önizləmə dayanacaq.
      </p>
    </div>
  );
}
