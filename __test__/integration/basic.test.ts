import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const native = require('../../index.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('checkUpdates', () => {
  it('should find updates for outdated packages', async () => {
    const packages = [
      { name: 'lodash', versionRange: '^4.0.0', depType: 'prod' },
      { name: 'chalk', versionRange: '^4.0.0', depType: 'prod' },
    ];

    const result = await native.checkUpdates(packages, {
      target: 'latest',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    });

    expect(result).toBeDefined();
    expect(result.updates).toBeInstanceOf(Array);
    expect(result.totalTimeMs).toBeGreaterThan(0);
    // lodash and chalk both have versions newer than 4.0.0
    expect(result.updates.length).toBeGreaterThan(0);

    for (const update of result.updates) {
      expect(update.name).toBeDefined();
      expect(update.current).toBeDefined();
      expect(update.newRange).toBeDefined();
      expect(update.updateType).toBeDefined();
      expect(['major', 'minor', 'patch', 'prerelease']).toContain(update.updateType);
    }
  });

  it('should return empty updates for packages at latest', async () => {
    // Use a version range that's very high - unlikely to have updates
    const packages = [
      { name: 'lodash', versionRange: '^99999.0.0', depType: 'prod' },
    ];

    const result = await native.checkUpdates(packages, {
      target: 'latest',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    });

    expect(result.updates).toEqual([]);
  });

  it('should respect target=minor', async () => {
    const packages = [
      { name: 'typescript', versionRange: '^4.0.0', depType: 'dev' },
    ];

    const result = await native.checkUpdates(packages, {
      target: 'minor',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    });

    // Should find an update within major version 4
    if (result.updates.length > 0) {
      expect(result.updates[0].newRange).toMatch(/^\^4\./);
    }
  });

  it('should respect target=patch', async () => {
    const packages = [
      { name: 'lodash', versionRange: '^4.17.0', depType: 'prod' },
    ];

    const result = await native.checkUpdates(packages, {
      target: 'patch',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    });

    // Should find patch update within 4.17.x
    if (result.updates.length > 0) {
      expect(result.updates[0].newRange).toMatch(/^\^4\.17\./);
    }
  });

  it('should handle scoped packages', async () => {
    const packages = [
      { name: '@types/node', versionRange: '^18.0.0', depType: 'dev' },
    ];

    const result = await native.checkUpdates(packages, {
      target: 'latest',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    });

    expect(result.updates.length).toBeGreaterThan(0);
    expect(result.updates[0].name).toBe('@types/node');
  });

  it('should report cache hits on second call', async () => {
    const packages = [
      { name: 'lodash', versionRange: '^4.0.0', depType: 'prod' },
    ];

    const options = {
      target: 'latest',
      concurrency: 24,
      timeoutMs: 30000,
      cacheTtlSeconds: 600,
      retries: 3,
    };

    // First call
    await native.checkUpdates(packages, options);

    // Second call should hit cache
    const result = await native.checkUpdates(packages, options);
    expect(result.cacheHits).toBeGreaterThanOrEqual(1);
  });
});

describe('clearCache', () => {
  it('should clear cache without error', () => {
    expect(() => native.clearCache()).not.toThrow();
  });
});
