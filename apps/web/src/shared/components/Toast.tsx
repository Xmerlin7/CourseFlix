import { createRoot } from 'react-dom/client'

type ToastVariant = 'success' | 'error'

interface ToastEntry {
  id: number
  message: string
  variant: ToastVariant
}

let nextId = 0
let entries: ToastEntry[] = []
let renderRoot: ReturnType<typeof createRoot> | null = null
let container: HTMLDivElement | null = null

function getContainer() {
  if (container) return container
  container = document.createElement('div')
  container.className = 'toast-container'
  container.setAttribute('aria-live', 'polite')
  container.setAttribute('aria-atomic', 'true')
  document.body.appendChild(container)
  renderRoot = createRoot(container)
  return container
}

function render() {
  if (!renderRoot) return

  renderRoot.render(
    <>
      {entries.map((entry) => (
        <div key={entry.id} className={`toast-item toast-${entry.variant}`} role="status">
          <span className="ms">
            {entry.variant === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{entry.message}</span>
        </div>
      ))}
    </>,
  )
}

function removeEntry(id: number) {
  entries = entries.filter((e) => e.id !== id)
  render()
}

/**
 * Shows an in-app toast notification.
 *
 * Uses a portal rendered outside the React tree so it can be called
 * imperatively from any async handler — no context provider needed.
 */
export function showToast(message: string, variant: ToastVariant = 'success') {
  getContainer()
  const id = nextId++
  entries = [...entries, { id, message, variant }]
  render()
  setTimeout(() => removeEntry(id), 4000)
}
