export interface Point {
  x: number;
  y: number;
}
export interface Camera extends Point {
  z: number;
}
export function focusCamera(
  point: Point,
  currentZoom: number,
  viewport: { w: number; h: number },
): Camera {
  return {
    x: viewport.w / 2 - point.x * currentZoom,
    y: viewport.h / 2 - point.y * currentZoom,
    z: currentZoom,
  };
}
export function zoomCamera(
  camera: Camera,
  factor: number,
  anchor: Point,
): Camera {
  const z = Math.max(0.5, Math.min(2.5, camera.z * factor));
  return {
    x: anchor.x - ((anchor.x - camera.x) * z) / camera.z,
    y: anchor.y - ((anchor.y - camera.y) * z) / camera.z,
    z,
  };
}
export function fitCamera(
  points: Point[],
  viewport: { w: number; h: number },
): Camera {
  const minX = Math.min(...points.map((p) => p.x)) - 56,
    maxX = Math.max(...points.map((p) => p.x)) + 56,
    minY = Math.min(...points.map((p) => p.y)) - 54,
    maxY = Math.max(...points.map((p) => p.y)) + 72,
    z = Math.max(
      0.2,
      Math.min(
        1.6,
        (viewport.w - 40) / (maxX - minX),
        (viewport.h - 40) / (maxY - minY),
      ),
    );
  return {
    x: viewport.w / 2 - ((minX + maxX) * z) / 2,
    y: viewport.h / 2 - ((minY + maxY) * z) / 2,
    z,
  };
}
