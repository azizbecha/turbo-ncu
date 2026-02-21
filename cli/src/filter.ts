import { minimatch } from 'minimatch';
import type { PackageInfo } from '../../index.js';

function parsePattern(pattern: string): (name: string) => boolean {
  // Regex pattern: /pattern/
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    const regex = new RegExp(pattern.slice(1, -1));
    return (name: string) => regex.test(name);
  }

  // Glob pattern (contains * or ?)
  if (pattern.includes('*') || pattern.includes('?')) {
    return (name: string) => minimatch(name, pattern);
  }

  // Comma-separated exact matches
  const names = pattern.split(',').map(s => s.trim());
  return (name: string) => names.includes(name);
}

export function applyFilters(
  packages: PackageInfo[],
  filter?: string,
  reject?: string
): PackageInfo[] {
  let result = packages;

  if (filter) {
    const matcher = parsePattern(filter);
    result = result.filter(p => matcher(p.name));
  }

  if (reject) {
    const matcher = parsePattern(reject);
    result = result.filter(p => !matcher(p.name));
  }

  return result;
}
