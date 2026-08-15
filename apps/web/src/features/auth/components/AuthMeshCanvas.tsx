import { useEffect, useRef } from 'react'

type Rgb = [number, number, number]

interface NetworkNode {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  radius: number
  opacity: number
  kind: 'node' | 'medium' | 'hub'
  polarity: 1 | -1
  pointerForce: number
}

const FALLBACK_PRIMARY: Rgb = [101, 85, 143]
const FALLBACK_PRIMARY_CONTAINER: Rgb = [233, 221, 255]
const FALLBACK_SURFACE: Rgb = [254, 251, 255]
const FALLBACK_ACCENT: Rgb = [34, 211, 238]
const FALLBACK_EDGE: Rgb = [79, 55, 139]

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseCssColor(value: string, fallback: Rgb): Rgb {
  const color = value.trim()
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  const rgb = color.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)

  if (hex) {
    const normalized = hex[1].length === 3
      ? hex[1].split('').map((part) => part + part).join('')
      : hex[1]

    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ]
  }

  if (rgb) {
    return [
      clamp(Number(rgb[1]), 0, 255),
      clamp(Number(rgb[2]), 0, 255),
      clamp(Number(rgb[3]), 0, 255),
    ]
  }

  return fallback
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${clamp(alpha, 0, 1).toFixed(3)})`
}

function getPalette(canvas: HTMLCanvasElement) {
  const styles = window.getComputedStyle(canvas)

  return {
    primary: parseCssColor(styles.getPropertyValue('--primary'), FALLBACK_PRIMARY),
    primaryContainer: parseCssColor(styles.getPropertyValue('--primary-container'), FALLBACK_PRIMARY_CONTAINER),
    surface: parseCssColor(styles.getPropertyValue('--surface'), FALLBACK_SURFACE),
    accent: parseCssColor(styles.getPropertyValue('--auth-mesh-accent'), FALLBACK_ACCENT),
    edge: parseCssColor(styles.getPropertyValue('--auth-mesh-edge'), FALLBACK_EDGE),
  }
}

function getNodeCount(width: number, height: number) {
  const area = width * height
  const minimum = width < 560 ? 38 : width < 980 ? 52 : 68
  const maximum = width < 560 ? 58 : width < 980 ? 86 : 124
  return Math.round(clamp(area / 17_000, minimum, maximum))
}

function getConnectionDistance(width: number, height: number, count: number) {
  const averageSpacing = Math.sqrt((width * height) / Math.max(1, count))
  const responsiveBoost = width < 560 ? 1.72 : width < 980 ? 1.9 : 2.04
  return clamp(averageSpacing * responsiveBoost, 118, 198)
}

function getPointerRadius(width: number) {
  if (width < 560) return 142
  if (width < 980) return 174
  return 208
}

function createNodes(count: number, width: number, height: number): NetworkNode[] {
  const aspect = width / Math.max(1, height)
  const columns = Math.max(4, Math.ceil(Math.sqrt(count * aspect)))
  const rows = Math.max(3, Math.ceil(count / columns))
  const cellWidth = width / columns
  const cellHeight = height / rows
  const cells = Array.from({ length: columns * rows }, (_, index) => ({
    column: index % columns,
    row: Math.floor(index / columns),
  })).sort(() => Math.random() - 0.5)

  return Array.from({ length: count }, (_, index) => {
    const { column, row } = cells[index]
    const hubInterval = Math.max(18, Math.round(count / Math.max(3, Math.min(6, Math.round(count / 23)))))
    const kind: NetworkNode['kind'] = index % hubInterval === 0
      ? 'hub'
      : index % 5 === 0
        ? 'medium'
        : 'node'
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.72
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.72

    return {
      x: clamp(column * cellWidth + cellWidth * 0.5 + jitterX, 16, width - 16),
      y: clamp(row * cellHeight + cellHeight * 0.5 + jitterY, 16, height - 16),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.1,
      phase: Math.random() * Math.PI * 2,
      radius: kind === 'hub'
        ? 3.45 + Math.random() * 0.7
        : kind === 'medium'
          ? 2.15 + Math.random() * 0.55
          : 1.35 + Math.random() * 0.55,
      opacity: kind === 'hub'
        ? 0.82 + Math.random() * 0.1
        : kind === 'medium'
          ? 0.66 + Math.random() * 0.1
          : 0.48 + Math.random() * 0.14,
      kind,
      polarity: index % 3 === 0 ? 1 : -1,
      pointerForce: 0,
    }
  })
}

export function AuthMeshCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const meshCanvas = canvas
    const meshContext = context
    const pointer = { x: 0, y: 0, active: false }
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    let width = 1
    let height = 1
    let dpr = 1
    let nodes: NetworkNode[] = []
    let palette = getPalette(meshCanvas)
    let frame = 0
    let lastTime = 0
    let isVisible = true
    let isDocumentVisible = !document.hidden
    let reducedMotion = prefersReducedMotion()

    function stop() {
      if (!frame) return
      cancelAnimationFrame(frame)
      frame = 0
    }

    function shouldAnimate() {
      return isVisible && isDocumentVisible && !reducedMotion
    }

    function schedule() {
      if (frame || !shouldAnimate()) return
      frame = requestAnimationFrame(draw)
    }

    function resize() {
      const bounds = meshCanvas.parentElement?.getBoundingClientRect() ?? meshCanvas.getBoundingClientRect()
      width = Math.max(1, Math.round(bounds.width || window.innerWidth))
      height = Math.max(1, Math.round(bounds.height || window.innerHeight))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      palette = getPalette(meshCanvas)

      meshCanvas.width = Math.floor(width * dpr)
      meshCanvas.height = Math.floor(height * dpr)
      meshCanvas.style.width = `${width}px`
      meshCanvas.style.height = `${height}px`
      meshContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      nodes = createNodes(getNodeCount(width, height), width, height)
      lastTime = 0
      drawStatic()
      schedule()
    }

    function updatePointer(event: PointerEvent) {
      const bounds = meshCanvas.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top

      pointer.x = x
      pointer.y = y
      pointer.active = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height
    }

    function clearPointer() {
      pointer.active = false
    }

    function updateNodes(delta: number, time: number) {
      const pointerRadius = getPointerRadius(width)
      const edgePadding = 18

      for (const node of nodes) {
        node.pointerForce = 0
        node.x += (node.vx + Math.sin(time * 0.00034 + node.phase) * 0.018) * delta
        node.y += (node.vy + Math.cos(time * 0.00028 + node.phase) * 0.016) * delta

        if (pointer.active) {
          const dx = pointer.x - node.x
          const dy = pointer.y - node.y
          const distance = Math.max(1, Math.hypot(dx, dy))

          if (distance < pointerRadius) {
            const force = Math.pow(1 - distance / pointerRadius, 2)
            const direction = node.polarity
            node.pointerForce = force
            node.x += (dx / distance) * force * 0.58 * direction * delta
            node.y += (dy / distance) * force * 0.46 * direction * delta
          }
        }

        if (node.x < edgePadding || node.x > width - edgePadding) {
          node.vx *= -1
          node.x = clamp(node.x, edgePadding, width - edgePadding)
        }

        if (node.y < edgePadding || node.y > height - edgePadding) {
          node.vy *= -1
          node.y = clamp(node.y, edgePadding, height - edgePadding)
        }
      }
    }

    function paint(time: number) {
      const connectionDistance = getConnectionDistance(width, height, nodes.length)
      const degrees = new Uint8Array(nodes.length)

      meshContext.clearRect(0, 0, width, height)
      meshContext.save()
      meshContext.globalCompositeOperation = 'source-over'

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.hypot(dx, dy)

          const isHubConnection = a.kind === 'hub' || b.kind === 'hub'
          const linkDistance = isHubConnection ? connectionDistance * 1.18 : connectionDistance
          const maxDegreeA = a.kind === 'hub' ? 9 : a.kind === 'medium' ? 5 : 4
          const maxDegreeB = b.kind === 'hub' ? 9 : b.kind === 'medium' ? 5 : 4

          if (distance > linkDistance || degrees[i] >= maxDegreeA || degrees[j] >= maxDegreeB) continue

          const proximity = 1 - distance / linkDistance
          const pointerBoost = Math.max(a.pointerForce, b.pointerForce)
          const alpha = Math.pow(proximity, 1.35) * (isHubConnection ? 0.34 : 0.27) + pointerBoost * 0.2

          meshContext.beginPath()
          meshContext.moveTo(a.x, a.y)
          meshContext.lineTo(b.x, b.y)
          meshContext.lineWidth = 0.68 + proximity * 0.5 + pointerBoost * 0.58
          meshContext.strokeStyle = rgba(isHubConnection ? palette.primary : palette.edge, alpha)
          meshContext.stroke()
          degrees[i] += 1
          degrees[j] += 1
        }
      }

      if (pointer.active && !reducedMotion) {
        const cursorLinkDistance = getPointerRadius(width) * 0.78

        for (const node of nodes) {
          const dx = pointer.x - node.x
          const dy = pointer.y - node.y
          const distance = Math.hypot(dx, dy)

          if (distance > cursorLinkDistance) continue

          const proximity = 1 - distance / cursorLinkDistance
          meshContext.beginPath()
          meshContext.moveTo(pointer.x, pointer.y)
          meshContext.lineTo(node.x, node.y)
          meshContext.lineWidth = 0.52 + proximity * 0.58
          meshContext.strokeStyle = rgba(palette.accent, Math.pow(proximity, 1.7) * 0.3)
          meshContext.stroke()
        }

        const radius = getPointerRadius(width) * 0.58
        const gradient = meshContext.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius)
        gradient.addColorStop(0, rgba(palette.accent, 0.09))
        gradient.addColorStop(0.44, rgba(palette.primaryContainer, 0.035))
        gradient.addColorStop(1, rgba(palette.accent, 0))
        meshContext.fillStyle = gradient
        meshContext.beginPath()
        meshContext.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
        meshContext.fill()
      }

      for (const node of nodes) {
        const pulse = reducedMotion ? 1 : 0.92 + Math.sin(time * 0.0014 + node.phase) * 0.08
        const radius = node.radius * pulse + node.pointerForce * 1.2
        const nodeAlpha = node.opacity + node.pointerForce * 0.22

        if (node.kind === 'hub' || node.pointerForce > 0.08) {
          meshContext.beginPath()
          meshContext.arc(node.x, node.y, radius * 4.8, 0, Math.PI * 2)
          meshContext.fillStyle = rgba(node.pointerForce > 0.08 ? palette.accent : palette.primary, 0.08 + node.pointerForce * 0.14)
          meshContext.fill()
        }

        meshContext.beginPath()
        meshContext.arc(node.x, node.y, radius, 0, Math.PI * 2)
        meshContext.fillStyle = rgba(
          node.pointerForce > 0.1 || node.kind === 'hub'
            ? palette.accent
            : node.kind === 'medium'
              ? palette.primary
              : palette.edge,
          nodeAlpha,
        )
        meshContext.fill()
      }

      meshContext.restore()
    }

    function draw(time: number) {
      frame = 0
      const delta = lastTime ? clamp((time - lastTime) / 16.67, 0.4, 2.4) : 1
      lastTime = time
      updateNodes(delta, time)
      paint(time)
      schedule()
    }

    function drawStatic() {
      for (const node of nodes) {
        node.pointerForce = 0
      }
      paint(0)
    }

    function handleMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches
      lastTime = 0
      if (reducedMotion) {
        stop()
        drawStatic()
      } else {
        schedule()
      }
    }

    function handleVisibilityChange() {
      isDocumentVisible = !document.hidden
      if (isDocumentVisible) {
        lastTime = 0
        schedule()
      } else {
        stop()
      }
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null
    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible) {
          lastTime = 0
          schedule()
        } else {
          stop()
        }
      })
      : null

    resize()
    resizeObserver?.observe(meshCanvas.parentElement ?? meshCanvas)
    intersectionObserver?.observe(meshCanvas)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', updatePointer)
    window.addEventListener('pointerleave', clearPointer)
    window.addEventListener('blur', clearPointer)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionQuery?.addEventListener('change', handleMotionChange)
    schedule()

    return () => {
      stop()
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerleave', clearPointer)
      window.removeEventListener('blur', clearPointer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionQuery?.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} className="auth-mesh-canvas" aria-hidden="true" />
}
