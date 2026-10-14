import { afterEach, describe, expect, it, vi } from "vitest";
import { DelayedPreview } from "./hover";
afterEach(() => vi.useRealTimers());
describe("short popover dwell and pointer bridge", () => {
  it("previews after 100ms; a passing pointer never previews", () => {
    vi.useFakeTimers();
    const preview = vi.fn(),
      controller = new DelayedPreview<string>(preview, () => true);
    controller.enter("B");
    vi.advanceTimersByTime(99);
    expect(preview).not.toHaveBeenCalled();
    controller.enter("C");
    vi.advanceTimersByTime(100);
    expect(preview).toHaveBeenCalledExactlyOnceWith("C");
    controller.dispose();
  });
  it("keeps the preview during the 250ms bridge to its detail entry", () => {
    vi.useFakeTimers();
    const preview = vi.fn(),
      controller = new DelayedPreview<string>(preview, () => true);
    controller.enter("B");
    vi.advanceTimersByTime(100);
    controller.leave();
    vi.advanceTimersByTime(249);
    expect(preview).not.toHaveBeenCalledWith(null);
    controller.bridge();
    vi.advanceTimersByTime(1000);
    expect(preview).toHaveBeenCalledTimes(1);
    controller.leave();
    vi.advanceTimersByTime(250);
    expect(preview).toHaveBeenLastCalledWith(null);
  });
  it("drawer/manual/context reset prevents stale delayed previews", () => {
    vi.useFakeTimers();
    let permitted = true;
    const preview = vi.fn(),
      controller = new DelayedPreview<string>(preview, () => permitted);
    controller.enter("B");
    permitted = false;
    vi.advanceTimersByTime(100);
    expect(preview).not.toHaveBeenCalled();
    permitted = true;
    controller.enter("C");
    controller.clear();
    vi.advanceTimersByTime(1000);
    expect(preview).toHaveBeenCalledExactlyOnceWith(null);
    controller.dispose();
  });
});
