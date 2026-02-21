import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import type { CliOptions } from './types.js';

const CONFIG_FILES = [
  '.ncurc.json',
  '.ncurc.yml',
  '.ncurc.yaml',
  '.ncurc.js',
  '.ncurc.cjs',
];

export function loadConfig(
  configFile?: string,
  searchDir?: string
): Partial<CliOptions> {
  if (configFile) {
    return loadConfigFile(configFile);
  }

  const dir = searchDir || process.cwd();
  for (const name of CONFIG_FILES) {
    const filePath = path.resolve(dir, name);
    if (fs.existsSync(filePath)) {
      return loadConfigFile(filePath);
    }
  }

  return {};
}

function loadConfigFile(filePath: string): Partial<CliOptions> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  if (ext === '.yml' || ext === '.yaml') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return (yaml.load(content) as Partial<CliOptions>) || {};
  }

  if (ext === '.js' || ext === '.cjs') {
    const require = createRequire(import.meta.url);
    return require(path.resolve(filePath));
  }

  return {};
}
