export interface CliOptions {
  upgrade: boolean;
  target: "latest" | "minor" | "patch" | "semver";
  filter?: string;
  reject?: string;
  dep: string[];
  cacheFile?: string;
  cacheTtl: number;
  concurrency: number;
  registry?: string;
  pre: boolean;
  workspaces: boolean;
  workspace?: string;
  root: boolean;
  global: boolean;
  json: boolean;
  jsonAll: boolean;
  configFile?: string;
  timeout: number;
  errorLevel: number;
  packageFile?: string;
}

export interface PackageJsonDeps {
  [name: string]: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: PackageJsonDeps;
  devDependencies?: PackageJsonDeps;
  peerDependencies?: PackageJsonDeps;
  optionalDependencies?: PackageJsonDeps;
  workspaces?: string[] | { packages: string[] };
  [key: string]: unknown;
}

export type DepType = "prod" | "dev" | "peer" | "optional";

export const DEP_TYPE_MAP: Record<DepType, keyof PackageJson> = {
  prod: "dependencies",
  dev: "devDependencies",
  peer: "peerDependencies",
  optional: "optionalDependencies",
};
