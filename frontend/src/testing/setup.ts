// O jsdom não traz matchMedia nem IntersectionObserver: versões mínimas para os testes.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  }) as MediaQueryList;
}

if (!('IntersectionObserver' in window)) {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds: readonly number[] = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopIntersectionObserver;
}
