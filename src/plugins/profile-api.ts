import type { Plugin } from "vite";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getProfileName, getProjectRoot, listProfiles } from "../shared/profiles";
import { replaceTokens } from "../streamlabs-tokens";

/** Parse a raw HTTP request body. */
function readBody(req: {
  on(event: "data", cb: (chunk: Buffer) => void): void;
  on(event: "end", cb: () => void): void;
}): Promise<string> {
  return new Promise((resolvePromise) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolvePromise(body));
  });
}

export function profileSwitcherPlugin(): Plugin {
  return {
    name: "profile-switcher",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // GET /__profiles
        if (req.url === "/__profiles") {
          const activeName = getProfileName();
          const profiles = listProfiles().map((name) => ({
            name,
            active: name === activeName,
          }));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(profiles));
          return;
        }

        // POST /__profile
        if (req.url === "/__profile" && req.method === "POST") {
          try {
            const body = await readBody(req);
            const { profile } = JSON.parse(body) as { profile: string };
            const profileDir = resolve(getProjectRoot(), "profiles", profile);
            if (!existsSync(profileDir)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `Profile '${profile}' not found` }));
              return;
            }
            writeFileSync(resolve(getProjectRoot(), "profiles", ".active"), `${profile}\n`);
            res.end(JSON.stringify({ switched: profile }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid request" }));
          }
          return;
        }

        // GET /__profile-css/<name> — raw CSS with token replacement
        if (req.url?.startsWith("/__profile-css/")) {
          const profile = req.url.slice("/__profile-css/".length);
          const cssPath = resolve(getProjectRoot(), "profiles", profile, "style.css");
          if (!existsSync(cssPath)) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }
          let css = readFileSync(cssPath, "utf-8");
          const configPath = resolve(getProjectRoot(), "profiles", profile, "widget.config.json");
          if (existsSync(configPath)) {
            const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
              background_color: string;
              font_size: string;
              text_color: string;
              message_hide_delay: string;
            };
            css = replaceTokens(css, config);
          }
          res.setHeader("Content-Type", "text/css");
          res.end(css);
          return;
        }

        next();
      });
    },
  };
}
