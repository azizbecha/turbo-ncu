import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const cliPath = path.resolve(projectRoot, "dist/bin/turbo-ncu.js");
const fixtureBasic = path.resolve(__dirname, "../fixtures/basic/package.json");

function runCli(args: string): string {
  try {
    return execSync(`node ${cliPath} ${args}`, {
      encoding: "utf-8",
      cwd: projectRoot,
      timeout: 60000,
    });
  } catch (e: unknown) {
    // CLI exits with code 1 when updates found, that's expected
    const error = e as { stdout?: string; stderr?: string };
    return (error.stdout || "") + (error.stderr || "");
  }
}

describe("CLI integration", () => {
  it("should show help", () => {
    const output = runCli("--help");
    expect(output).toContain("turbo-ncu");
    expect(output).toContain("--upgrade");
    expect(output).toContain("--target");
  });

  it("should show version", () => {
    const output = runCli("--version");
    expect(output.trim()).toBe("0.1.0");
  });

  it("should check a specific package.json", () => {
    const output = runCli(`-p ${fixtureBasic}`);
    // The fixture has old versions, should find updates
    expect(output).toContain("→");
  });

  it("should output JSON", () => {
    const output = runCli(`-p ${fixtureBasic} --json`);
    const parsed = JSON.parse(output);
    expect(typeof parsed).toBe("object");
    // Should have at least one key
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
  });

  it("should output jsonAll", () => {
    const output = runCli(`-p ${fixtureBasic} --jsonAll`);
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty("name");
    expect(parsed[0]).toHaveProperty("updateType");
  });

  it("should filter packages", () => {
    const output = runCli(`-p ${fixtureBasic} --json --filter lodash`);
    const parsed = JSON.parse(output);
    expect(Object.keys(parsed)).toEqual(["lodash"]);
  });

  it("should reject packages", () => {
    const output = runCli(`-p ${fixtureBasic} --json --reject lodash`);
    const parsed = JSON.parse(output);
    expect(parsed).not.toHaveProperty("lodash");
  });

  it("should respect --dep flag", () => {
    const output = runCli(`-p ${fixtureBasic} --json --dep dev`);
    const parsed = JSON.parse(output);
    // Only typescript is a dev dep
    const keys = Object.keys(parsed);
    expect(keys).toContain("typescript");
    expect(keys).not.toContain("lodash");
  });
});
