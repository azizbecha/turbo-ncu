import ora, { type Ora } from "ora";

let spinner: Ora | null = null;
let silent = false;

export function setSilent(value: boolean): void {
  silent = value;
}

export function isSilent(): boolean {
  return silent;
}

export function startResolving(): void {
  if (silent) return;
  spinner = ora("Resolving packages...").start();
}

export function startChecking(label: string, count: number): void {
  if (silent) return;
  const msg = label ? `Checking ${count} packages in ${label}...` : `Checking ${count} packages...`;
  spinner = ora(msg).start();
}

export function updatePackageProgress(current: number, total: number, name: string): void {
  if (silent || !spinner) return;
  spinner.text = `Checking [${current}/${total}] ${name}...`;
}

export function succeed(msg: string): void {
  if (silent || !spinner) return;
  spinner.succeed(msg);
  spinner = null;
}

export function fail(msg: string): void {
  if (silent || !spinner) return;
  spinner.fail(msg);
  spinner = null;
}

export function stop(): void {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}
