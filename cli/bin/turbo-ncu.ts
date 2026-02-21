#!/usr/bin/env node

import { createProgram } from '../src/cli.js';
import { run } from '../src/index.js';
import type { CliOptions } from '../src/types.js';

async function main() {
  const program = createProgram();
  program.parse(process.argv);
  const opts = program.opts();

  const cliOptions: CliOptions = {
    upgrade: opts.upgrade,
    target: opts.target,
    filter: opts.filter,
    reject: opts.reject,
    dep: opts.dep,
    cacheFile: opts.cacheFile,
    cacheTtl: parseInt(opts.cacheTtl, 10),
    concurrency: parseInt(opts.concurrency, 10),
    registry: opts.registry,
    pre: opts.pre,
    workspaces: opts.workspaces,
    workspace: opts.workspace,
    root: opts.root,
    global: opts.global,
    json: opts.json,
    jsonAll: opts.jsonAll,
    configFile: opts.configFile,
    timeout: parseInt(opts.timeout, 10),
    errorLevel: parseInt(opts.errorLevel, 10),
    packageFile: opts.packageFile,
  };

  const exitCode = await run(cliOptions);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
