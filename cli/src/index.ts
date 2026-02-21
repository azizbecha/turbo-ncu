import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import chalk from "chalk";
import type { CheckOptions, PackageInfo, CheckResult, UpdateResult } from "../../index.js";

const require = createRequire(import.meta.url);
const native: {
  checkUpdates: (packages: PackageInfo[], options: CheckOptions) => Promise<CheckResult>;
  clearCache: (cacheFile?: string) => void;
} = require("../../index.cjs");
const checkUpdates = native.checkUpdates;

import { loadConfig } from "./config.js";
import { applyFilters } from "./filter.js";
import {
  formatTable,
  formatJson,
  formatJsonAll,
  formatSummary,
  formatHeader,
} from "./formatter.js";
import { getGlobalPackages } from "./global.js";
import * as spinner from "./spinner.js";
import {
  readPackageJson,
  findPackageJson,
  extractPackages,
  parseDepTypes,
} from "./package-reader.js";
import { writeUpdates } from "./package-writer.js";
import type { CliOptions, DepType } from "./types.js";
import { discoverWorkspaces } from "./workspace.js";

function detectPackageManager(dir: string): string {
  if (fs.existsSync(path.join(dir, "bun.lockb")) || fs.existsSync(path.join(dir, "bun.lock"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(dir, "yarn.lock"))) {
    return "yarn";
  }
  return "npm";
}

interface RunTarget {
  label: string;
  packageJsonPath: string;
  packages: PackageInfo[];
}

function resolveTargets(opts: CliOptions): RunTarget[] | Promise<RunTarget[]> {
  if (opts.global) {
    const packages = getGlobalPackages();
    return [{ label: "global", packageJsonPath: "", packages }];
  }

  const depTypes = parseDepTypes(opts.dep) as DepType[];

  if (opts.workspaces || opts.workspace) {
    return resolveWorkspaceTargets(opts, depTypes);
  }

  const pkgPath = opts.packageFile ? path.resolve(opts.packageFile) : findPackageJson();
  const pkg = readPackageJson(pkgPath);
  const packages = extractPackages(pkg, depTypes);

  return [{ label: pkgPath, packageJsonPath: pkgPath, packages }];
}

async function resolveWorkspaceTargets(
  opts: CliOptions,
  depTypes: DepType[],
): Promise<RunTarget[]> {
  const rootDir = process.cwd();
  const workspaces = await discoverWorkspaces(rootDir, opts.workspace);
  const targets: RunTarget[] = [];

  if (opts.root || !opts.workspaces) {
    try {
      const rootPkgPath = findPackageJson(rootDir);
      const rootPkg = readPackageJson(rootPkgPath);
      const packages = extractPackages(rootPkg, depTypes);
      targets.push({
        label: rootPkg.name || "root",
        packageJsonPath: rootPkgPath,
        packages,
      });
    } catch {
      // no root package.json
    }
  }

  for (const ws of workspaces) {
    const pkg = readPackageJson(ws.packageJsonPath);
    const packages = extractPackages(pkg, depTypes);
    targets.push({
      label: ws.name,
      packageJsonPath: ws.packageJsonPath,
      packages,
    });
  }

  return targets;
}

export async function run(opts: CliOptions): Promise<number> {
  // Load config file
  const config = loadConfig(opts.configFile);
  const mergedOpts: CliOptions = { ...opts, ...config, ...opts };

  const isJsonOutput = mergedOpts.json || mergedOpts.jsonAll;
  const isTTY = process.stdout.isTTY ?? false;

  // Disable spinners for JSON output or non-TTY (piped) environments
  spinner.setSilent(isJsonOutput || !isTTY);

  // Print header
  if (!isJsonOutput && isTTY) {
    console.log(formatHeader("0.1.0"));
    console.log();
  }

  // Resolve targets with spinner
  spinner.startResolving();
  const targets = await resolveTargets(mergedOpts);
  const totalPackages = targets.reduce((sum, t) => sum + t.packages.length, 0);
  spinner.succeed(
    `Found ${totalPackages} packages across ${targets.length} target${targets.length === 1 ? "" : "s"}`,
  );

  const checkOptions: CheckOptions = {
    registry: mergedOpts.registry,
    target: mergedOpts.target,
    concurrency: mergedOpts.concurrency,
    timeoutMs: mergedOpts.timeout,
    cacheFile: mergedOpts.cacheFile,
    cacheTtlSeconds: mergedOpts.cacheTtl,
    includePrerelease: mergedOpts.pre,
    retries: 3,
  };

  let allUpdates: UpdateResult[] = [];
  let totalChecked = 0;
  let totalTimeMs = 0;
  let totalCacheHits = 0;
  let totalCacheMisses = 0;
  const multiTarget = targets.length > 1;

  for (const target of targets) {
    const filtered = applyFilters(target.packages, mergedOpts.filter, mergedOpts.reject);

    if (filtered.length === 0) continue;
    totalChecked += filtered.length;

    // Start checking spinner with simulated per-package progress
    const targetLabel = multiTarget ? target.label : "";
    spinner.startChecking(targetLabel, filtered.length);

    let progressIndex = 0;
    const progressInterval = setInterval(() => {
      progressIndex = (progressIndex + 1) % filtered.length;
      spinner.updatePackageProgress(
        progressIndex + 1,
        filtered.length,
        filtered[progressIndex].name,
      );
    }, 150);

    const result = await checkUpdates(filtered, checkOptions);
    clearInterval(progressInterval);
    totalTimeMs += result.totalTimeMs;
    totalCacheHits += result.cacheHits;
    totalCacheMisses += result.cacheMisses;

    spinner.succeed(
      `Checked ${filtered.length} packages (${result.cacheMisses} fetched, ${result.cacheHits} from cache)`,
    );

    if (multiTarget && result.updates.length > 0 && !isJsonOutput) {
      console.log(`\n${target.label}`);
    }

    if (!isJsonOutput) {
      if (result.updates.length > 0) {
        console.log(formatTable(result.updates));
      }
    }

    if (mergedOpts.upgrade && target.packageJsonPath && result.updates.length > 0) {
      writeUpdates(target.packageJsonPath, result.updates);
      if (!isJsonOutput) {
        const pm = detectPackageManager(path.dirname(target.packageJsonPath));
        console.log(`\nUpdated ${target.packageJsonPath}`);
        console.log(chalk.cyan(`Run ${chalk.bold(`${pm} install`)} to install new versions`));
      }
    }

    allUpdates = allUpdates.concat(result.updates);
  }

  // Output
  if (mergedOpts.json) {
    console.log(formatJson(allUpdates));
  } else if (mergedOpts.jsonAll) {
    console.log(formatJsonAll(allUpdates));
  } else {
    if (allUpdates.length === 0 && totalChecked > 0) {
      console.log(formatTable([]));
    }
    console.log(
      formatSummary(totalChecked, allUpdates.length, totalTimeMs, totalCacheHits, totalCacheMisses),
    );
    if (allUpdates.length > 0 && !mergedOpts.upgrade) {
      console.log("\nRun turbo-ncu --upgrade to update your package.json");
    }
  }

  // Exit code
  if (mergedOpts.errorLevel === 2 && allUpdates.length > 0) {
    return 1;
  }
  return 0;
}
