export interface Spring {
  value: number;
  target: number;
  velocity: number;
  k: number;
  c: number;
}
export const spring = (value = 0, k = 160, c = 20): Spring => ({
  value,
  target: value,
  velocity: 0,
  k,
  c,
});
/** Fixed steps keep the approved physical spring stable across uneven animation frames. */
export function advance(s: Spring, dt: number) {
  const steps = Math.max(1, Math.ceil(dt / 0.004)),
    h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.velocity += (s.k * (s.target - s.value) - s.c * s.velocity) * h;
    s.value += s.velocity * h;
  }
  if (Math.abs(s.target - s.value) < 0.005 && Math.abs(s.velocity) < 0.01) {
    s.value = s.target;
    s.velocity = 0;
  }
  return s.value;
}
export function settle(s: Spring, value = s.target) {
  s.value = s.target = value;
  s.velocity = 0;
}
export const smooth = (u: number) => {
  u = Math.max(0, Math.min(1, u));
  return u * u * (3 - 2 * u);
};
export function curve(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const sign = b.x < a.x ? -1 : 1,
    s = { x: a.x + 27 * sign, y: a.y },
    t = { x: b.x - 27 * sign, y: b.y },
    bend = Math.abs(t.x - s.x) * 0.43;
  return `M ${s.x} ${s.y} C ${s.x + bend * sign} ${s.y}, ${t.x - bend * sign} ${t.y}, ${t.x} ${t.y}`;
}
