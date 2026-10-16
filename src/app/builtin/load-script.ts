const loading = new Map<string, Promise<void>>();

/** Adds a <script src> to the page once, and resolves when it has loaded (rejects when it cannot). */
export function loadScript(src: string): Promise<void> {
  let promise = loading.get(src);
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { loading.delete(src); reject(new Error(`Could not load ${src}`)); };
      document.head.append(script);
    });
    loading.set(src, promise);
  }
  return promise;
}
