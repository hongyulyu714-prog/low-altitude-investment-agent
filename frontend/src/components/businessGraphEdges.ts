import type { PathView } from "../adapters/types";
/** GraphPath's documented adjacency contract is the only endpoint source. */
export function businessEdges(path: PathView) {
  if (
    !path.node_ids ||
    !path.relation_ids ||
    path.node_ids.length < 2 ||
    path.relation_ids.length !== path.node_ids.length - 1
  )
    return null;
  return path.relation_ids.map((id, i) => ({
    id,
    source: path.node_ids![i],
    target: path.node_ids![i + 1],
  }));
}
