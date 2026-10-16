// Collects things that must be cleaned up later (editors, models) and disposes them in reverse order.
export class Disposables {
  private items: { dispose(): void }[] = [];
  private closed = false;

  /** Keeps `item`. If everything was disposed already, `item` is disposed at once. */
  add<T extends { dispose(): void }>(item: T): T {
    if (this.closed) item.dispose();
    else this.items.push(item);
    return item;
  }

  get isDisposed() {
    return this.closed;
  }

  disposeAll() {
    this.closed = true;
    while (this.items.length) this.items.pop()!.dispose();
  }
}
