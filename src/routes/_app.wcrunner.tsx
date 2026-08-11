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
import { buildFileSystemTree, pickDevCommand, type WebContainerFile } from "@/lib/buildFileSystemTree";
import type { RunStatus } from "@/hooks/useWebContainerRunner";

// Same "one boot() per page" singleton as before, just living in the
// isolated tab's page context instead of a hidden iframe's.
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

export default function WcRunnerPage() {
  const devProcessRef = useRef<any>(null);
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

    async function handleRun(files: WebContainerFile[]) {
      if (!window.crossOriginIsolated) {
        postLog(
          "\n! Bu səhifə cross-origin isolated deyil (COOP/COEP başlıqları tətbiq olunmayıb). WebContainer başladıla bilməz.\n"
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

        await wc.mount(buildFileSystemTree(files));
        postLog(`$ fayllar mount olundu (${files.length} fayl)\n`);

        postStatus("install");
        const install = await wc.spawn("npm", ["install"]);
        install.output.pipeTo(new WritableStream({ write: (d: string) => postLog(d) }));
        const installExit = await install.exit;
        if (installExit !== 0) {
          throw new Error(`npm install uğursuz oldu (exit code ${installExit})`);
        }

        postStatus("build");
        const pkgJson = await wc.fs.readFile("package.json", "utf-8");
        const [cmd, args] = pickDevCommand(pkgJson);
        postLog(`$ ${cmd} ${args.join(" ")}\n`);
        const devProcess = await wc.spawn(cmd, args);
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

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "wc:run" && Array.isArray(msg.files)) {
        void handleRun(msg.files as WebContainerFile[]);
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
    <div style={{ fontFamily: "monospace", padding: 16, color: "#ddd", background: "#111", minHeight: "100vh" }}>
      <p>WebContainer runner işləyir — nəticələri əsas pəncərədə görəcəksiniz.</p>
      <p style={{ opacity: 0.6, fontSize: 12 }}>Bu tabı bağlamayın, əks halda önizləmə dayanacaq.</p>
    </div>
  );
}