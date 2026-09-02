/**
 * Global polyfills for React Native / Hermes environment.
 * Ensures DOMException and related web error interfaces exist globally.
 */
class DOMExceptionPolyfill extends Error {
  readonly code: number;
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || 'DOMException';
    this.code = 0;
    Object.setPrototypeOf(this, DOMExceptionPolyfill.prototype);
  }
}

const g: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
    ? window
    : {};

if (typeof g.DOMException === 'undefined') {
  g.DOMException = DOMExceptionPolyfill;
}

if (typeof global !== 'undefined' && typeof (global as any).DOMException === 'undefined') {
  (global as any).DOMException = DOMExceptionPolyfill;
}

export {};

