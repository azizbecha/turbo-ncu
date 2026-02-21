import chalk from 'chalk';
import type { UpdateResult } from '../../index.js';

export function formatHeader(version: string): string {
  return chalk.bold(`turbo-ncu`) + chalk.dim(` v${version}`);
}

function colorByType(text: string, updateType: string): string {
  switch (updateType) {
    case 'major':
      return chalk.red(text);
    case 'minor':
      return chalk.cyan(text);
    case 'patch':
      return chalk.green(text);
    default:
      return chalk.yellow(text);
  }
}

export function formatTable(updates: UpdateResult[]): string {
  if (updates.length === 0) {
    return chalk.green('All dependencies match the latest package versions :)');
  }

  // Calculate column widths
  const nameWidth = Math.max(...updates.map(u => u.name.length));
  const currentWidth = Math.max(...updates.map(u => u.current.length));
  const arrowWidth = 2; // →
  const newWidth = Math.max(...updates.map(u => u.newRange.length));

  const lines: string[] = [];

  for (const update of updates) {
    const name = update.name.padEnd(nameWidth);
    const current = update.current.padEnd(currentWidth);
    const arrow = '→';
    const newRange = colorByType(update.newRange, update.updateType);

    lines.push(` ${name}  ${current}  ${arrow}  ${newRange}`);
  }

  return lines.join('\n');
}

export function formatJson(updates: UpdateResult[]): string {
  const result: Record<string, string> = {};
  for (const update of updates) {
    result[update.name] = update.newRange;
  }
  return JSON.stringify(result, null, 2);
}

export function formatJsonAll(updates: UpdateResult[]): string {
  return JSON.stringify(updates, null, 2);
}

export function formatSummary(
  totalChecked: number,
  updatesCount: number,
  timeMs: number,
  cacheHits?: number,
  cacheMisses?: number
): string {
  const time = chalk.bold((timeMs / 1000).toFixed(2) + 's');
  const cacheInfo =
    cacheHits != null && cacheMisses != null
      ? ` (${chalk.green(String(cacheMisses) + ' fetched')}, ${chalk.cyan(String(cacheHits) + ' from cache')})`
      : '';
  if (updatesCount === 0) {
    return chalk.dim(`Checked ${totalChecked} packages`) + cacheInfo + chalk.dim(` in `) + time;
  }
  return (
    chalk.dim(`${updatesCount} update${updatesCount === 1 ? '' : 's'} found`) +
    cacheInfo +
    chalk.dim(` in `) +
    time
  );
}
