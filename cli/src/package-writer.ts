import * as fs from "node:fs";
import type { UpdateResult } from "../../index.js";
import type { PackageJson } from "./types.js";
import { DEP_TYPE_MAP, type DepType } from "./types.js";

export function writeUpdates(filePath: string, updates: UpdateResult[]): void {
  const raw = fs.readFileSync(filePath, "utf-8");

  // Detect indentation
  const indentMatch = raw.match(/^(\s+)"/m);
  const indent = indentMatch ? indentMatch[1] : "  ";

  // Parse and update
  const pkg: PackageJson = JSON.parse(raw);

  for (const update of updates) {
    const depType = update.depType as DepType;
    const key = DEP_TYPE_MAP[depType];
    const deps = pkg[key] as Record<string, string> | undefined;
    if (deps && deps[update.name] !== undefined) {
      deps[update.name] = update.newRange;
    }
  }

  // Detect trailing newline
  const trailingNewline = raw.endsWith("\n");
  let output = JSON.stringify(pkg, null, indent);
  if (trailingNewline) {
    output += "\n";
  }

  fs.writeFileSync(filePath, output, "utf-8");
}
