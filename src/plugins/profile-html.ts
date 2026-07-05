import type { Plugin } from "vite";
import { resolve } from "node:path";
import { getProfileName } from "../shared/profiles";

const projectRoot = (import.meta as unknown as { dirname: string }).dirname;

/**
 * Dev-only plugin: middleware for HTML routing, watcher for HMR reload,
 * and profile-switcher UI injection.
 */
export function profileHtmlPlugin(): Plugin {
  let isDev = false;

  return {
    name: "profile-html",
    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === "serve";
    },
    configureServer(server) {
      server.watcher.add(resolve(projectRoot, "profiles", ".active"));
      server.watcher.on("change", (path) => {
        if (path.endsWith("profiles/.active")) {
          // Invalidate main.ts and all CSS modules so they re-resolve
          const mainMod = server.moduleGraph.getModuleById(resolve(projectRoot, "src", "main.ts"));
          if (mainMod) server.moduleGraph.invalidateModule(mainMod);
          for (const [, m] of server.moduleGraph.idToModuleMap) {
            if (m.id?.endsWith(".css")) server.moduleGraph.invalidateModule(m);
          }
          server.hot.send({ type: "full-reload" });
        }
      });

      server.middlewares.use((req, _res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          req.url = `/profiles/${getProfileName()}/index.html`;
        }
        next();
      });
    },
    transformIndexHtml() {
      if (!isDev) return [];
      return [
        {
          tag: "script",
          attrs: { src: "/src/profile-switcher.ts", type: "module" },
          injectTo: "body",
        },
      ];
    },
  };
}
