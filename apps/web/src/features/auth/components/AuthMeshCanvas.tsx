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
  prominent: boolean
  polarity: 1 | -1
  pointerForce: number
}

const FALLBACK_PRIMARY: Rgb = [101, 85, 143]
const FALLBACK_PRIMARY_CONTAINER: Rgb = [233, 221, 255]
const FALLBACK_SURFACE: Rgb = [254, 251, 255]

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
  }
}

function getNodeCount(width: number) {
  if (width < 560) return 42
  if (width < 980) return 58
  return 74
}

function getConnectionDistance(width: number) {
  if (width < 560) return 108
  if (width < 980) return 132
  return 156
}

function getPointerRadius(width: number) {
  if (width < 560) return 118
  if (width < 980) return 148
  return 176
}

function createNodes(count: number, width: number, height: number): NetworkNode[] {
  return Array.from({ length: count }, (_, index) => {
    const prominent = index % 13 === 0

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
      radius: prominent ? 2.2 + Math.random() * 0.7 : 1.2 + Math.random() * 0.8,
      opacity: prominent ? 0.54 + Math.random() * 0.16 : 0.32 + Math.random() * 0.2,
      prominent,
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
      nodes = createNodes(getNodeCount(width), width, height)
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
            node.x += (dx / distance) * force * 0.42 * direction * delta
            node.y += (dy / distance) * force * 0.34 * direction * delta
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
      const connectionDistance = getConnectionDistance(width)

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

          if (distance > connectionDistance) continue

          const proximity = 1 - distance / connectionDistance
          const pointerBoost = Math.max(a.pointerForce, b.pointerForce)
          const alpha = Math.pow(proximity, 1.7) * 0.2 + pointerBoost * 0.08

          meshContext.beginPath()
          meshContext.moveTo(a.x, a.y)
          meshContext.lineTo(b.x, b.y)
          meshContext.lineWidth = 0.55 + proximity * 0.38 + pointerBoost * 0.35
          meshContext.strokeStyle = rgba(palette.primaryContainer, alpha)
          meshContext.stroke()
        }
      }

      if (pointer.active && !reducedMotion) {
        const radius = getPointerRadius(width) * 1.18
        const gradient = meshContext.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius)
        gradient.addColorStop(0, rgba(palette.primaryContainer, 0.12))
        gradient.addColorStop(0.42, rgba(palette.primary, 0.055))
        gradient.addColorStop(1, rgba(palette.primary, 0))
        meshContext.fillStyle = gradient
        meshContext.beginPath()
        meshContext.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
        meshContext.fill()
      }

      for (const node of nodes) {
        const pulse = reducedMotion ? 1 : 0.92 + Math.sin(time * 0.0014 + node.phase) * 0.08
        const radius = node.radius * pulse + node.pointerForce * 1.2
        const nodeAlpha = node.opacity + node.pointerForce * 0.22

        if (node.prominent || node.pointerForce > 0.08) {
          meshContext.beginPath()
          meshContext.arc(node.x, node.y, radius * 4.6, 0, Math.PI * 2)
          meshContext.fillStyle = rgba(palette.primary, 0.045 + node.pointerForce * 0.08)
          meshContext.fill()
        }

        meshContext.beginPath()
        meshContext.arc(node.x, node.y, radius, 0, Math.PI * 2)
        meshContext.fillStyle = rgba(node.prominent ? palette.surface : palette.primaryContainer, nodeAlpha)
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
