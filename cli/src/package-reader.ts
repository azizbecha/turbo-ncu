import * as fs from "node:fs";
import * as path from "node:path";
import type { PackageInfo } from "../../index.js";
import type { PackageJson, DepType, PackageJsonDeps } from "./types.js";
import { DEP_TYPE_MAP } from "./types.js";

export function readPackageJson(filePath: string): PackageJson {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as PackageJson;
}

export function findPackageJson(dir?: string): string {
  const searchDir = dir || process.cwd();
  const filePath = path.resolve(searchDir, "package.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`No package.json found in ${searchDir}`);
  }
  return filePath;
}

export function extractPackages(pkg: PackageJson, depTypes: DepType[]): PackageInfo[] {
  const packages: PackageInfo[] = [];

  for (const depType of depTypes) {
    const key = DEP_TYPE_MAP[depType];
    const deps = pkg[key] as PackageJsonDeps | undefined;
    if (!deps) continue;

    for (const [name, versionRange] of Object.entries(deps)) {
      // Skip non-registry ranges (URLs, file:, git:, etc.)
      if (
        versionRange.startsWith("file:") ||
        versionRange.startsWith("git:") ||
        versionRange.startsWith("git+") ||
        versionRange.startsWith("github:") ||
        versionRange.startsWith("http:") ||
        versionRange.startsWith("https:") ||
        versionRange.includes("/")
      ) {
        continue;
      }

      packages.push({
        name,
        versionRange,
        depType,
      });
    }
  }

  return packages;
}

export function parseDepTypes(depOption: string[]): DepType[] {
  if (!depOption || depOption.length === 0) {
    return ["prod", "dev", "peer", "optional"];
  }

  const valid: DepType[] = ["prod", "dev", "peer", "optional"];
  const result: DepType[] = [];

  for (const d of depOption) {
    // Support comma-separated values
    const parts = d.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (valid.includes(part as DepType)) {
        result.push(part as DepType);
      }
    }
  }

  return result.length > 0 ? result : valid;
}
