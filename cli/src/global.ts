import { execSync } from 'node:child_process';
import type { PackageInfo } from '../../index.js';

export function getGlobalPackages(): PackageInfo[] {
  try {
    const output = execSync('npm ls -g --depth=0 --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const parsed = JSON.parse(output);
    const deps = parsed.dependencies || {};
    const packages: PackageInfo[] = [];

    for (const [name, info] of Object.entries(deps)) {
      const version = (info as { version?: string }).version;
      if (version) {
        packages.push({
          name,
          versionRange: `^${version}`,
          depType: 'prod',
        });
      }
    }

    return packages;
  } catch {
    return [];
  }
}
