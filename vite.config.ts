import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// WebContainer needs the page that calls WebContainer.boot() to be
// cross-origin isolated (COOP: same-origin + COEP: require-corp). But
// COOP: same-origin also severs window.opener, which breaks Firebase's
// signInWithPopup() anywhere those headers apply.
//
// Applying the headers globally (as a flat `server.headers` object does)
// isolates the *entire* app — including the login page — since a
// client-routed SPA is still one document/response for every route. The
// fix is to only send these headers for the one route that actually hosts
// the WebContainer runner, so the rest of the app stays un-isolated and
// popup sign-in keeps working.
function crossOriginIsolation(previewPathPrefix: string): Plugin {
  const applyHeaders = (req: any, res: any, next: () => void) => {
    if (req.url?.startsWith(previewPathPrefix)) {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    }
    next();
  };

  return {
    name: "cross-origin-isolation-for-preview-route",
    configureServer(server) {
      server.middlewares.use(applyHeaders);
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyHeaders);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    // Only requests under /wc-preview get isolated. Everything else
    // (including /login) is served without COOP/COEP.
    crossOriginIsolation("/wc-preview"),
  ],
});