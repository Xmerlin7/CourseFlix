import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Node's own experimental `localStorage` global shadows jsdom's in newer
// Node versions, leaving it undefined and breaking any component that reads
// the theme/notification preferences on mount. Provide a working in-memory
// implementation so those tests actually run against a real store.
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    },
  })
}

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close() {
    this.open = false
  }
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const getCanvasContext = (contextId: string) => {
    if (contextId !== '2d') return null
    return {
      arc: () => {},
      beginPath: () => {},
      clearRect: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      fill: () => {},
      lineTo: () => {},
      moveTo: () => {},
      restore: () => {},
      save: () => {},
      setTransform: () => {},
      stroke: () => {},
    } as unknown as CanvasRenderingContext2D
  }
  ;(HTMLCanvasElement.prototype as unknown as {
    getContext: (contextId: string) => CanvasRenderingContext2D | null
  }).getContext = getCanvasContext
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
