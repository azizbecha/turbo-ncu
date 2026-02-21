import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["cli/**/*.ts"],
  outDir: "dist",
  format: "esm",
  platform: "node",
  target: "es2022",
  sourcemap: true,
  unbundle: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
