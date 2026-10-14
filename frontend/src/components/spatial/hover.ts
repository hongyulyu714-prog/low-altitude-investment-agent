/** A brief dwell avoids accidental previews; exit delay bridges node → short popover. */
export class DelayedPreview<Key> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(
    private preview: (key: Key | null) => void,
    private canPreview: () => boolean,
  ) {}
  private cancel() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  enter(key: Key) {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.canPreview()) this.preview(key);
    }, 100);
  }
  leave() {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.preview(null);
    }, 250);
  }
  bridge() {
    this.cancel();
  }
  clear() {
    this.cancel();
    this.preview(null);
  }
  dispose() {
    this.cancel();
  }
}
