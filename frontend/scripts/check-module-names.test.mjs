import { it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findModuleConflicts } from "./check-module-names.mjs";
it("rejects case-insensitive module stems across extensions, without rejecting CSS", () => {
  const root = mkdtempSync(join(tmpdir(), "skynexus-names-"));
  try {
    writeFileSync(join(root, "BusinessGraph.tsx"), "");
    writeFileSync(join(root, "businessGraph.ts"), "");
    expect(findModuleConflicts(root)).toHaveLength(1);
    rmSync(join(root, "businessGraph.ts"));
    writeFileSync(join(root, "businessGraphEdges.ts"), "");
    writeFileSync(join(root, "businessGraph.css"), "");
    expect(findModuleConflicts(root)).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
it("detects directory casing conflicts using different extensions on every filesystem", () => {
  const root = mkdtempSync(join(tmpdir(), "skynexus-names-"));
  try {
    mkdirSync(join(root, "Nodes"));
    mkdirSync(join(root, "nodes"), { recursive: true });
    writeFileSync(join(root, "Nodes", "focus.ts"), "");
    writeFileSync(join(root, "nodes", "Focus.tsx"), "");
    expect(findModuleConflicts(root)).toHaveLength(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
