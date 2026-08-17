import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { SidebarPosition } from './useSidebarPosition'

// How far the pointer must travel before a press turns into a drag. Below
// this, the gesture is left alone so a click on the handle stays a click
// (it cycles the position — the keyboard/touch-friendly path).
const DRAG_THRESHOLD_PX = 6

// A drop only counts near an actual edge; anywhere else the drag is
// cancelled and the bar stays where it was. Expressed as a fraction of the
// viewport so it scales with the window instead of being a fixed strip
// that's huge on a laptop and unreachable on a wide monitor.
const EDGE_ZONE = 0.28

interface UseSidebarDragOptions {
  position: SidebarPosition
  onDrop: (position: SidebarPosition) => void
}

interface UseSidebarDragResult {
  /** True once the pointer has moved past the threshold. */
  isDragging: boolean
  /** Edge the bar would land on if released now — drives the preview. */
  previewPosition: SidebarPosition | null
  /** Put on the sidebar itself; ignores presses aimed at its controls. */
  onSurfacePointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

// A press on any of these is aimed at the control, not the bar, so it must
// never start a drag — otherwise nudging the pointer while clicking a nav
// link would move the whole sidebar instead of navigating.
const INTERACTIVE = 'a, button, input, select, textarea, [role="button"]'

/**
 * Resolves a pointer position to the edge it's closest to.
 *
 * Bottom wins ties inside the lower band: the bottom edge is the one a
 * pointer reaches while also being near the left or right edge (the screen
 * corners), and "I dragged it to the bottom" is the intent that reading
 * corners as left/right would swallow.
 */
function resolveEdge(clientX: number, clientY: number): SidebarPosition | null {
  const { innerWidth, innerHeight } = window
  const fromBottom = 1 - clientY / innerHeight
  const fromLeft = clientX / innerWidth
  const fromRight = 1 - fromLeft

  if (fromBottom <= EDGE_ZONE) return 'bottom'
  if (fromRight <= EDGE_ZONE) return 'right'
  if (fromLeft <= EDGE_ZONE) return 'left'
  return null
}

/**
 * Drag-to-dock for the sidebar.
 *
 * Uses pointer events (not HTML5 drag-and-drop): DnD can't render a live
 * preview of a layout change, forces a drag image we don't want, and is
 * patchy on touch. Pointer capture keeps the gesture attached to the
 * handle even when the pointer leaves it — which it immediately does,
 * since the whole point is to move it to the far side of the screen.
 */
export function useSidebarDrag({
  position,
  onDrop,
}: UseSidebarDragOptions): UseSidebarDragResult {
  const [isDragging, setIsDragging] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<SidebarPosition | null>(null)
  // Refs, not state: these are read inside pointer handlers that shouldn't
  // re-subscribe (or re-render) on every pixel of movement.
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const startedRef = useRef(false)

  const endDrag = useCallback(() => {
    originRef.current = null
    startedRef.current = false
    setIsDragging(false)
    setPreviewPosition(null)
  }, [])

  const onSurfacePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // Left button / touch / pen only — a right-click shouldn't start a drag.
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return
    originRef.current = { x: event.clientX, y: event.clientY }
    startedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  // Bound on window rather than the handle so the gesture survives the
  // pointer crossing iframes/overlays, and so a pointerup anywhere ends it.
  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const origin = originRef.current
      if (!origin) return

      if (!startedRef.current) {
        const travelled = Math.hypot(
          event.clientX - origin.x,
          event.clientY - origin.y,
        )
        if (travelled < DRAG_THRESHOLD_PX) return
        startedRef.current = true
        setIsDragging(true)
      }

      // Prevents the text-selection drag that would otherwise smear the
      // whole page while the pointer moves with the button held.
      event.preventDefault()
      setPreviewPosition(resolveEdge(event.clientX, event.clientY))
    }

    function handleUp(event: PointerEvent) {
      if (!originRef.current) return
      const wasDragging = startedRef.current
      const target = resolveEdge(event.clientX, event.clientY)
      endDrag()
      if (!wasDragging) return

      // Pointer capture makes the browser fire a click on the captured
      // element after the release, wherever the pointer ended up. Left
      // alone that click lands on whatever is under the cursor — which is
      // how dropping the bar used to also trigger the control underneath.
      // Swallowed once, in the capture phase, before anything sees it.
      window.addEventListener(
        'click',
        (click: MouseEvent) => {
          click.stopPropagation()
          click.preventDefault()
        },
        { capture: true, once: true },
      )

      // A drop outside any edge zone, or onto the edge it already lives
      // on, is a no-op rather than a surprise move.
      if (target && target !== position) onDrop(target)
    }

    function handleCancel() {
      if (originRef.current) endDrag()
    }

    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleCancel)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleCancel)
    }
  }, [position, onDrop, endDrag])

  return { isDragging, previewPosition, onSurfacePointerDown }
}
