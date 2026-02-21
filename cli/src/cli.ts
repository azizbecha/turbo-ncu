import { Command } from 'commander';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('turbo-ncu')
    .description('Fast npm-check-updates — check for outdated dependencies')
    .version('0.1.0')
    .option('-u, --upgrade', 'overwrite package file with upgraded versions', false)
    .option(
      '-t, --target <target>',
      'target version: latest, minor, patch, semver',
      'latest'
    )
    .option('--filter <pattern>', 'include only matching package names')
    .option('--reject <pattern>', 'exclude matching package names')
    .option(
      '--dep <types...>',
      'dependency types: prod, dev, peer, optional',
      ['prod', 'dev', 'peer', 'optional']
    )
    .option('--cacheFile <path>', 'path to cache file')
    .option('--cacheTtl <seconds>', 'cache TTL in seconds', '600')
    .option('--concurrency <n>', 'number of concurrent requests', '24')
    .option('--registry <url>', 'npm registry URL')
    .option('--pre', 'include prerelease versions', false)
    .option('-w, --workspaces', 'check all workspaces', false)
    .option('--workspace <name>', 'check a specific workspace')
    .option('--root', 'include root package in workspace mode', false)
    .option('-g, --global', 'check global packages', false)
    .option('--json', 'output as JSON', false)
    .option('--jsonAll', 'output full update details as JSON', false)
    .option('--configFile <path>', 'path to config file')
    .option('--timeout <ms>', 'request timeout in ms', '30000')
    .option(
      '--errorLevel <level>',
      '0 = exit 0 always, 1 = exit 1 if no updates, 2 = exit 1 if updates found',
      '2'
    )
    .option('-p, --packageFile <path>', 'package.json file path');

  return program;
}
