import { readdirSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const code = /\.(?:tsx?|jsx?|mts|cts|mjs|cjs)$/i;
export function findModuleConflicts(root) {
  const seen = new Map(),
    conflicts = [];
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (
        [
          "node_modules",
          "dist",
          ".git",
          "test-results",
          "playwright-report",
        ].includes(entry.name)
      )
        continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (entry.isFile() && code.test(entry.name)) {
        const name = relative(root, path);
        const key = name.replace(code, "").toLowerCase();
        if (seen.has(key)) conflicts.push([seen.get(key), name]);
        else seen.set(key, name);
      }
    }
  }
  scan(root);
  return conflicts;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const conflicts = findModuleConflicts(
    resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  if (conflicts.length) {
    process.stderr.write(
      conflicts
        .map((pair) => `Ambiguous code modules: ${pair.join(" / ")}`)
        .join("\n") + "\n",
    );
    process.exitCode = 1;
  } else
    process.stdout.write(
      "Code module names are unambiguous across case-sensitive and insensitive filesystems.\n",
    );
}
