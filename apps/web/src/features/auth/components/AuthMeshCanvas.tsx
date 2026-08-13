import { useEffect, useRef } from 'react'

interface MeshPoint {
  baseX: number
  baseY: number
  z: number
  speed: number
  phase: number
  size: number
}

const LINE_DISTANCE = 0.28
const POINTER_RADIUS = 0.24

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function createPoints(count: number): MeshPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const lane = index / Math.max(1, count - 1)
    const tunnelBias = Math.pow(lane, 0.74)

    return {
      baseX: Math.random() * 2 - 1,
      baseY: Math.random() * 1.35 - 0.8 + tunnelBias * 0.28,
      z: Math.random(),
      speed: 0.00035 + Math.random() * 0.00065,
      phase: Math.random() * Math.PI * 2,
      size: 1.3 + Math.random() * 2.2,
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

    let frame = 0
    let width = 0
    let height = 0
    let dpr = 1
    let points = createPoints(window.innerWidth < 760 ? 62 : 104)
    const pointer = { x: 0, y: 0, active: false }
    const reducedMotion = prefersReducedMotion()

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      meshCanvas.width = Math.floor(width * dpr)
      meshCanvas.height = Math.floor(height * dpr)
      meshCanvas.style.width = `${width}px`
      meshCanvas.style.height = `${height}px`
      meshContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      points = createPoints(width < 760 ? 62 : 104)
    }

    function onPointerMove(event: PointerEvent) {
      pointer.x = (event.clientX / Math.max(1, width)) * 2 - 1
      pointer.y = (event.clientY / Math.max(1, height)) * 2 - 1
      pointer.active = true
    }

    function onPointerLeave() {
      pointer.active = false
    }

    function project(point: MeshPoint, time: number) {
      const z = reducedMotion ? point.z : (point.z + time * point.speed) % 1
      const depth = 0.35 + z * 1.65
      const driftX = Math.sin(time * 0.00045 + point.phase) * 0.08
      const driftY = Math.cos(time * 0.00038 + point.phase * 1.3) * 0.06
      const pointX = point.baseX * 0.72
      const pointY = point.baseY * 0.68
      const pointerDx = pointer.x - pointX
      const pointerDy = pointer.y - pointY
      const pointerDistance = Math.hypot(pointerDx, pointerDy)
      const force = pointer.active
        ? Math.max(0, 1 - pointerDistance / POINTER_RADIUS) ** 2
        : 0
      const pullX = force * pointerDx * (0.18 + z * 0.08)
      const pullY = force * pointerDy * (0.13 + z * 0.06)
      const ripple = force * Math.sin(time * 0.006 + point.phase) * 0.045

      return {
        x: width * (0.5 + (point.baseX + driftX + pullX + ripple) * depth * 0.36),
        y: height * (0.46 + (point.baseY + driftY + pullY - ripple * 0.6) * depth * 0.34),
        z,
        depth,
        size: point.size * (0.72 + z * 1.35),
        force,
      }
    }

    function draw(time: number) {
      meshContext.clearRect(0, 0, width, height)

      const projected = points.map((point) => project(point, time))

      meshContext.save()
      meshContext.globalCompositeOperation = 'lighter'

      for (let i = 0; i < projected.length; i += 1) {
        for (let j = i + 1; j < projected.length; j += 1) {
          const a = projected[i]
          const b = projected[j]
          const dx = (a.x - b.x) / width
          const dy = (a.y - b.y) / height
          const distance = Math.hypot(dx, dy)

          if (distance > LINE_DISTANCE) continue

          const pointerBoost = Math.max(a.force, b.force)
          const alpha = Math.pow(1 - distance / LINE_DISTANCE, 1.8) * (0.5 + pointerBoost * 0.9)
          const widthFactor = 0.35 + Math.max(a.z, b.z) * 1.35

          meshContext.beginPath()
          meshContext.moveTo(a.x, a.y)
          meshContext.lineTo(b.x, b.y)
          meshContext.lineWidth = widthFactor + pointerBoost * 1.8
          meshContext.strokeStyle = `rgba(103, 245, 255, ${alpha})`
          meshContext.shadowColor = 'rgba(35, 230, 255, 0.75)'
          meshContext.shadowBlur = 9 * alpha + pointerBoost * 18
          meshContext.stroke()
        }
      }

      for (const point of projected) {
        const pulse = reducedMotion ? 1 : 0.78 + Math.sin(time * 0.003 + point.z * 8) * 0.22
        const radius = point.size * pulse * (1 + point.force * 1.15)

        meshContext.beginPath()
        meshContext.arc(point.x, point.y, radius * (2.6 + point.force * 2.4), 0, Math.PI * 2)
        meshContext.fillStyle = `rgba(73, 232, 255, ${0.08 + point.z * 0.12 + point.force * 0.28})`
        meshContext.fill()

        meshContext.beginPath()
        meshContext.arc(point.x, point.y, radius, 0, Math.PI * 2)
        meshContext.fillStyle = `rgba(236, 254, 255, ${0.72 + point.z * 0.22})`
        meshContext.shadowColor = 'rgba(86, 242, 255, 0.95)'
        meshContext.shadowBlur = 18 + point.force * 30
        meshContext.fill()
      }

      if (pointer.active) {
        const pointerX = width * (0.5 + pointer.x * 0.5)
        const pointerY = height * (0.5 + pointer.y * 0.5)
        const gradient = meshContext.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 180)
        gradient.addColorStop(0, 'rgba(124, 255, 255, 0.22)')
        gradient.addColorStop(0.35, 'rgba(124, 255, 255, 0.08)')
        gradient.addColorStop(1, 'rgba(124, 255, 255, 0)')
        meshContext.fillStyle = gradient
        meshContext.beginPath()
        meshContext.arc(pointerX, pointerY, 180, 0, Math.PI * 2)
        meshContext.fill()
      }

      meshContext.restore()

      frame = reducedMotion ? 0 : requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerleave', onPointerLeave)
    if (reducedMotion) {
      draw(0)
    } else {
      frame = requestAnimationFrame(draw)
    }

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="auth-mesh-canvas" aria-hidden="true" />
}
