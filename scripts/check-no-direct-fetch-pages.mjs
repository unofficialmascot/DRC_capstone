import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["client/src/pages", "client/src/hooks"];
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(ts|tsx)$/.test(fullPath)) continue;

    const source = readFileSync(fullPath, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, idx) => {
      if (line.includes("fetch(")) {
        violations.push(`${fullPath}:${idx + 1}`);
      }
    });
  }
}

roots.forEach(walk);

if (violations.length) {
  console.error("Direct fetch usage is not allowed in hooks/pages. Use client/src/lib/api.ts.");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("No direct fetch usage found in hooks/pages.");
