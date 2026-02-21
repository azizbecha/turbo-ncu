import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readerModule = await import("../../dist/src/package-reader.js");

describe("package-reader", () => {
  const fixtureDir = path.resolve(__dirname, "../fixtures/basic");
  const fixturePath = path.resolve(fixtureDir, "package.json");

  it("should read package.json", () => {
    const pkg = readerModule.readPackageJson(fixturePath);
    expect(pkg.name).toBe("test-basic");
    expect(pkg.dependencies).toBeDefined();
    expect(pkg.devDependencies).toBeDefined();
  });

  it("should extract all dep types by default", () => {
    const pkg = readerModule.readPackageJson(fixturePath);
    const packages = readerModule.extractPackages(pkg, ["prod", "dev", "peer", "optional"]);
    expect(packages.length).toBe(3); // lodash, chalk, typescript
  });

  it("should extract only prod deps", () => {
    const pkg = readerModule.readPackageJson(fixturePath);
    const packages = readerModule.extractPackages(pkg, ["prod"]);
    expect(packages.length).toBe(2); // lodash, chalk
    expect(packages.every((p) => p.depType === "prod")).toBe(true);
  });

  it("should extract only dev deps", () => {
    const pkg = readerModule.readPackageJson(fixturePath);
    const packages = readerModule.extractPackages(pkg, ["dev"]);
    expect(packages.length).toBe(1); // typescript
    expect(packages[0].name).toBe("typescript");
  });

  it("should parse dep types correctly", () => {
    expect(readerModule.parseDepTypes([])).toEqual(["prod", "dev", "peer", "optional"]);
    expect(readerModule.parseDepTypes(["prod"])).toEqual(["prod"]);
    expect(readerModule.parseDepTypes(["prod,dev"])).toEqual(["prod", "dev"]);
  });
});
