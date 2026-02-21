import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";
import type { PackageJson } from "./types.js";

export interface WorkspaceInfo {
  name: string;
  dir: string;
  packageJsonPath: string;
}

export async function discoverWorkspaces(
  rootDir: string,
  specificWorkspace?: string,
): Promise<WorkspaceInfo[]> {
  const rootPkgPath = path.resolve(rootDir, "package.json");
  if (!fs.existsSync(rootPkgPath)) {
    return [];
  }

  const rootPkg: PackageJson = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));

  // Get workspace patterns
  let patterns: string[] = [];

  // npm/yarn workspaces field
  if (rootPkg.workspaces) {
    if (Array.isArray(rootPkg.workspaces)) {
      patterns = rootPkg.workspaces;
    } else if (
      rootPkg.workspaces &&
      typeof rootPkg.workspaces === "object" &&
      "packages" in rootPkg.workspaces
    ) {
      patterns = (rootPkg.workspaces as { packages: string[] }).packages;
    }
  }

  // pnpm-workspace.yaml
  if (patterns.length === 0) {
    const pnpmPath = path.resolve(rootDir, "pnpm-workspace.yaml");
    if (fs.existsSync(pnpmPath)) {
      try {
        const yaml = await import("js-yaml");
        const content = fs.readFileSync(pnpmPath, "utf-8");
        const parsed = yaml.load(content) as { packages?: string[] };
        if (parsed?.packages) {
          patterns = parsed.packages;
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  if (patterns.length === 0) {
    return [];
  }

  // Resolve globs to workspace directories
  const workspaces: WorkspaceInfo[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      absolute: false,
    });

    for (const match of matches) {
      const wsDir = path.resolve(rootDir, match);
      const wsPkgPath = path.resolve(wsDir, "package.json");

      if (!fs.existsSync(wsPkgPath)) continue;

      const wsPkg: PackageJson = JSON.parse(fs.readFileSync(wsPkgPath, "utf-8"));
      const name = wsPkg.name || match;

      // If specific workspace requested, filter
      if (specificWorkspace && name !== specificWorkspace) {
        continue;
      }

      workspaces.push({
        name,
        dir: wsDir,
        packageJsonPath: wsPkgPath,
      });
    }
  }

  return workspaces;
}
