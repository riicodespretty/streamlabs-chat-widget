import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Dirent } from "node:fs";

let _projectRoot = "";

/** Must be called once during Vite config resolution. */
export function setProjectRoot(root: string): void {
  _projectRoot = root;
}

export function getProjectRoot(): string {
  return _projectRoot;
}

export function getProfileName(): string {
  if (process.env.PROFILE) return process.env.PROFILE;
  const activePath = resolve(_projectRoot, "profiles", ".active");
  if (!existsSync(activePath)) return "baseline";
  return readFileSync(activePath, "utf-8").trim();
}

export function getProfileDir(): string {
  return resolve(_projectRoot, "profiles", getProfileName());
}

/** List all profiles (directory names under profiles/). */
export function listProfiles(): string[] {
  const profilesDir = resolve(_projectRoot, "profiles");
  if (!existsSync(profilesDir)) return [];
  return readdirSync(profilesDir, { withFileTypes: true })
    .filter((d: Dirent) => d.isDirectory())
    .map((d: Dirent) => d.name);
}

/** Shared mutable profile override (used by build-all.ts for per-profile builds). */
let _profileOverride: string | null = null;

export function setProfileOverride(name: string | null): void {
  _profileOverride = name;
}

export function getProfileOverride(): string | null {
  return _profileOverride;
}
