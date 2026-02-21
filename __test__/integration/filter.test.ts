import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

// Test the filter module directly
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamic import since these are ESM
const filterModule = await import('../../dist/src/filter.js');

describe('applyFilters', () => {
  const packages = [
    { name: 'lodash', versionRange: '^4.0.0', depType: 'prod' },
    { name: 'chalk', versionRange: '^5.0.0', depType: 'prod' },
    { name: 'express', versionRange: '^4.0.0', depType: 'prod' },
    { name: '@types/node', versionRange: '^18.0.0', depType: 'dev' },
    { name: '@types/express', versionRange: '^4.0.0', depType: 'dev' },
  ];

  it('should filter by exact name', () => {
    const result = filterModule.applyFilters(packages, 'lodash');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('lodash');
  });

  it('should filter by comma-separated names', () => {
    const result = filterModule.applyFilters(packages, 'lodash,chalk');
    expect(result).toHaveLength(2);
  });

  it('should filter by glob pattern', () => {
    const result = filterModule.applyFilters(packages, '@types/*');
    expect(result).toHaveLength(2);
  });

  it('should filter by regex', () => {
    const result = filterModule.applyFilters(packages, '/^@types/');
    expect(result).toHaveLength(2);
  });

  it('should reject packages', () => {
    const result = filterModule.applyFilters(packages, undefined, 'lodash');
    expect(result).toHaveLength(4);
    expect(result.every(p => p.name !== 'lodash')).toBe(true);
  });

  it('should combine filter and reject', () => {
    const result = filterModule.applyFilters(packages, '@types/*', '@types/express');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('@types/node');
  });
});
