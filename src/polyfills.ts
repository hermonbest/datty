/**
 * Global polyfills for React Native / Hermes environment.
 * Ensures DOMException and related web error interfaces exist globally.
 */
if (typeof (globalThis as any).DOMException === 'undefined') {
  (globalThis as any).DOMException = class DOMException extends Error {
    readonly code = 0;
  };
}

export {};


