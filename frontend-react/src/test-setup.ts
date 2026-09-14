import '@testing-library/jest-dom/vitest';

// jsdom lacks IntersectionObserver, which framer-motion's `whileInView`
// (used by the shared SectionPanel shell) touches on mount. A no-op stub keeps
// motion-wrapped components renderable in tests.
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error minimal test stub
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
