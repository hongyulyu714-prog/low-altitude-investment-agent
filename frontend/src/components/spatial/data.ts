/** Deliberately isolated synthetic network. These IDs NEVER join to the business report. */
export type Direction = "positive" | "negative" | "neutral" | "uncertain";
export type NodeKey = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";
export interface TestNode {
  id: string;
  key: NodeKey;
  x: number;
  y: number;
  label: string;
  category: "server" | "desktop" | "file";
}
export const testNodes: TestNode[] = [
  ["A", 80, 201, "输入 A", "server"],
  ["B", 284.18, 201, "中间 B", "server"],
  ["C", 539.82, 104, "类别 C", "desktop"],
  ["D", 539.82, 299, "类别 D", "desktop"],
  ["E", 735.7, 50, "终端 E", "file"],
  ["F", 735.7, 154, "终端 F", "file"],
  ["G", 735.7, 242, "终端 G", "file"],
  ["H", 735.7, 331, "终端 H", "file"],
  ["I", 953.16, 137, "输出 I", "desktop"],
  ["J", 953.16, 279, "输出 J", "desktop"],
].map(([key, x, y, label, category]) => ({
  id: `TEST_NODE_${key}`,
  key: key as NodeKey,
  x: Number(x),
  y: Number(y),
  label: String(label),
  category: category as TestNode["category"],
}));
export const testEdges: {
  id: string;
  source: NodeKey;
  target: NodeKey;
  direction: Direction;
}[] = [
  ["A", "B", "neutral"],
  ["B", "C", "negative"],
  ["B", "D", "positive"],
  ["C", "E", "negative"],
  ["C", "F", "neutral"],
  ["D", "G", "positive"],
  ["D", "H", "uncertain"],
  ["E", "I", "negative"],
  ["G", "J", "uncertain"],
].map(([source, target, direction], i) => ({
  id: `TEST_REL_${i + 1}`,
  source: source as NodeKey,
  target: target as NodeKey,
  direction: direction as Direction,
}));
export const testPaths: {
  id: string;
  name: string;
  direction: Direction;
  nodes: NodeKey[];
  edges: number[];
}[] = [
  {
    id: "negative",
    name: "负向传导",
    direction: "negative",
    nodes: ["A", "B", "C", "E", "I"],
    edges: [0, 1, 3, 7],
  },
  {
    id: "positive",
    name: "正向传导",
    direction: "positive",
    nodes: ["A", "B", "D", "G"],
    edges: [0, 2, 5],
  },
  {
    id: "neutral",
    name: "中性分支",
    direction: "neutral",
    nodes: ["C", "F"],
    edges: [4],
  },
  {
    id: "uncertain",
    name: "不确定分支",
    direction: "uncertain",
    nodes: ["D", "H"],
    edges: [6],
  },
  {
    id: "uncertain2",
    name: "输出不确定",
    direction: "uncertain",
    nodes: ["G", "J"],
    edges: [8],
  },
];
export const testCompanies = [
  {
    id: "TEST_COMP_ALPHA",
    name: "TEST 公司 Alpha",
    node_ids: ["B", "C"] as NodeKey[],
    evidence_ids: ["TEST_EVD_ALPHA"],
  },
  {
    id: "TEST_COMP_BETA",
    name: "TEST 公司 Beta",
    node_ids: ["B", "D"] as NodeKey[],
    evidence_ids: ["TEST_EVD_BETA"],
  },
  {
    id: "TEST_COMP_GAMMA",
    name: "TEST 公司 Gamma",
    node_ids: ["E", "I"] as NodeKey[],
    evidence_ids: [] as string[],
  },
];
export const testEvidence = [
  {
    evidence_id: "TEST_EVD_ALPHA",
    source_title: "TEST · Alpha 映射测试记录",
    quote:
      "仅为验证节点 B / C → Alpha 的高亮、主动筛选与返回。没有真实来源，不代表产业传导。",
    source_url: null,
    published_date: null,
    credibility_level: "mock",
    verification_status: "mock",
  },
  {
    evidence_id: "TEST_EVD_BETA",
    source_title: "TEST · Beta 映射测试记录",
    quote: "仅为验证节点 B / D → Beta 的共享抽屉与上下文恢复。未接入业务 API。",
    source_url: null,
    published_date: null,
    credibility_level: "mock",
    verification_status: "mock",
  },
];
export const directionNames: Record<Direction, string> = {
  positive: "正向",
  negative: "负向",
  neutral: "中性",
  uncertain: "不确定",
};
export const directionColors: Record<Direction, string> = {
  positive: "#287B53",
  negative: "#BB354A",
  neutral: "#58687E",
  uncertain: "#9B690C",
};
export const graphAssets = {
  server: "/assets/figma/40008321-29686.svg",
  desktop: "/assets/figma/40008321-29694.svg",
  desktopTeal: "/assets/figma/40008321-29697.svg",
  file: "/assets/figma/40008321-29701.svg",
};
