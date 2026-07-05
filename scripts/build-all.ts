import { build } from "vite";
import { resolve } from "node:path";
import { listProfiles, setProfileOverride } from "../src/shared/profiles";

const root = resolve(import.meta.dirname!, "..");
const profiles = listProfiles();

if (profiles.length === 0) {
  console.log("No profiles found. Nothing to build.");
  process.exit(0);
}

for (const profile of profiles) {
  setProfileOverride(profile);
  console.log(`Building profile: ${profile}`);
  await build({ root });
  console.log(`  -> dist/${profile}/`);
}

console.log("Build complete.");
