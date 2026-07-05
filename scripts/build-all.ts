import { build } from "vite";
import { resolve } from "node:path";
import { listProfiles } from "../src/shared/profiles";

const root = resolve(import.meta.dirname!, "..");
const profiles = listProfiles();

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
delete process.env.PROFILE;

console.log("Build complete.");
