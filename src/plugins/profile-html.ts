import type { Plugin, ViteDevServer } from "vite";
import { resolve } from "node:path";
import { getProfileName } from "../shared/profiles";

const projectRoot = (import.meta as unknown as { dirname: string }).dirname;

/**
 * Dev-only plugin: middleware for HTML routing + watcher for HMR reload.
 */
export function profileHtmlPlugin(): Plugin {
  return {
    name: "profile-html",
    configureServer(server) {
      server.watcher.add(resolve(projectRoot, "profiles", ".active"));
      server.watcher.on("change", (path) => {
        if (path.endsWith("profiles/.active")) {
          reloadWithNewProfile(server);
        }
      });

      server.middlewares.use((req, _res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          req.url = `/profiles/${getProfileName()}/index.html`;
        }
        next();
      });
    },
  };
}

function reloadWithNewProfile(server: ViteDevServer): void {
  const mod = server.moduleGraph.getModuleById(resolve(projectRoot, "src", "main.ts"));
  if (mod) server.moduleGraph.invalidateModule(mod);
  server.hot.send({ type: "full-reload" });
}
