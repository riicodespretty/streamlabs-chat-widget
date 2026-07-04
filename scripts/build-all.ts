import { build } from "vite";
import { resolve } from "node:path";
import { readdirSync, copyFileSync, existsSync } from "node:fs";

const root = resolve(import.meta.dirname!, "..");
const profilesDir = resolve(root, "profiles");

const profiles = readdirSync(profilesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (profiles.length === 0) {
  console.log("No profiles found. Nothing to build.");
  process.exit(0);
}

for (const profile of profiles) {
  process.env.PROFILE = profile;
  console.log(`Building profile: ${profile}`);
  await build({ root });
  console.log(`  -> dist/${profile}/`);
}

// Deduplicate JS: copy from first profile to all others
if (profiles.length > 1) {
  const jsSource = resolve(root, "dist", profiles[0], "widget.js");
  for (let i = 1; i < profiles.length; i++) {
    const jsDest = resolve(root, "dist", profiles[i], "widget.js");
    if (existsSync(jsSource)) {
      copyFileSync(jsSource, jsDest);
      console.log(`  (deduplicated widget.js -> ${profiles[i]})`);
    }
  }
}

console.log("Build complete.");
