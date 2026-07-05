import type { Plugin } from "vite";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getProfileName, getProjectRoot, listProfiles } from "../shared/profiles";

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

/**
 * Dev-only plugin: profile list/switch API.
 * Replaces scripts/switch-profile.sh and scripts/list-profiles.sh.
 */
export function profileSwitcherPlugin(): Plugin {
  return {
    name: "profile-switcher",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
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

        next();
      });
    },
  };
}
