import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const native = require("./index.cjs");
export const checkUpdates = native.checkUpdates;
export const clearCache = native.clearCache;
