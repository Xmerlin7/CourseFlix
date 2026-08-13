import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

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
