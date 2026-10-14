import { describe, it, expect } from "vitest";
import { focusCamera, zoomCamera, fitCamera } from "./geometry";
import { advance, spring, curve } from "./motion";
import { testNodes, testEdges, testPaths, testCompanies } from "./data";
describe("Spatial interaction geometry", () => {
  it("explicit focus centers every zoom without changing research scale", () => {
    for (const z of [0.5, 1, 1.8, 2.5]) {
      const point = { x: 284.18, y: 201 },
        c = focusCamera(point, z, { w: 1064, h: 388 });
      expect(c.z).toBe(z);
      expect(point.x * c.z + c.x).toBeCloseTo(532);
      expect(point.y * c.z + c.y).toBeCloseTo(194);
    }
  });
  it("wheel zoom preserves the exact world point beneath the cursor, including limits", () => {
    const camera = { x: -120, y: 24, z: 1.1 },
      anchor = { x: 390, y: 110 };
    for (const factor of [0.01, 1.15, 20]) {
      const next = zoomCamera(camera, factor, anchor);
      expect((anchor.x - next.x) / next.z).toBeCloseTo(
        (anchor.x - camera.x) / camera.z,
      );
      expect((anchor.y - next.y) / next.z).toBeCloseTo(
        (anchor.y - camera.y) / camera.z,
      );
      expect(next.z).toBeGreaterThanOrEqual(0.5);
      expect(next.z).toBeLessThanOrEqual(2.5);
    }
  });
  it("path overview fits nodes and external label margins after manual dragging", () => {
    const points = [
        { x: -300, y: -100 },
        { x: 1200, y: 500 },
      ],
      view = { w: 1064, h: 388 },
      c = fitCamera(points, view);
    for (const p of points) {
      expect(p.x * c.z + c.x).toBeGreaterThan(27 * c.z);
      expect(p.x * c.z + c.x).toBeLessThan(view.w - 27 * c.z);
      expect(p.y * c.z + c.y).toBeGreaterThan(27 * c.z);
      expect(p.y * c.z + c.y).toBeLessThan(view.h - 50 * c.z);
    }
  });
  it("physical camera spring converges and preserves velocity on interrupted retarget", () => {
    const s = spring(0);
    s.target = 120;
    for (let i = 0; i < 20; i++) advance(s, 0.016);
    const velocity = s.velocity;
    s.target = -40;
    expect(s.velocity).toBe(velocity);
    for (let i = 0; i < 500; i++) advance(s, 0.016);
    expect(s.value).toBe(-40);
    expect(s.velocity).toBe(0);
  });
  it("curve clips relation to 54px circle boundaries", () => {
    expect(curve({ x: 0, y: 0 }, { x: 200, y: 100 })).toMatch(
      /^M 27 0 C .*, 173 100$/,
    );
  });
  it("every synthetic reference is explicit and cannot join business IDs", () => {
    expect(testNodes).toHaveLength(10);
    expect(testEdges).toHaveLength(9);
    expect(testPaths).toHaveLength(5);
    const keys = new Set(testNodes.map((n) => n.key));
    for (const e of testEdges) {
      expect(keys.has(e.source)).toBe(true);
      expect(keys.has(e.target)).toBe(true);
      expect(e.id.startsWith("TEST_")).toBe(true);
    }
    for (const c of testCompanies) {
      expect(c.id.startsWith("TEST_")).toBe(true);
      expect(c).not.toHaveProperty("impact_score");
      for (const key of c.node_ids) expect(keys.has(key)).toBe(true);
    }
    for (const p of testPaths)
      for (const edgeIndex of p.edges) {
        const edge = testEdges[edgeIndex];
        expect(p.nodes).toContain(edge.source);
        expect(p.nodes).toContain(edge.target);
      }
  });
});
