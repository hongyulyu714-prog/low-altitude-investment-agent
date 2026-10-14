import { it, expect } from "vitest";
import { businessEdges } from "./businessGraph";
import type { PathView } from "../adapters/types";
const path: PathView = {
  path_id: "P",
  event_id: "E",
  node_ids: ["NODE_A", "NODE_B", "NODE_C"],
  relation_ids: ["REL_AB", "REL_BC"],
  rule_id: null,
  impact_direction: "uncertain",
  evidence_ids: null,
};
it("uses documented adjacency and original relation IDs without guessing attributes", () => {
  expect(businessEdges(path)).toEqual([
    { id: "REL_AB", source: "NODE_A", target: "NODE_B" },
    { id: "REL_BC", source: "NODE_B", target: "NODE_C" },
  ]);
});
it("does not draw missing or malformed relationships", () => {
  expect(businessEdges({ ...path, relation_ids: null })).toBeNull();
  expect(businessEdges({ ...path, node_ids: null })).toBeNull();
  expect(businessEdges({ ...path, relation_ids: ["REL_AB"] })).toBeNull();
});
