'use client'

import { useEffect, useRef } from 'react'

import styles from './ShapeGrid.module.css'

type Direction = 'right' | 'left' | 'up' | 'down' | 'diagonal'
type Shape = 'square' | 'circle' | 'hexagon' | 'triangle'
type Point = { x: number; y: number }

type Props = {
  direction?: Direction
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  shape?: Shape
  hoverTrailAmount?: number
  className?: string
}

/**
 * An animated, hover-reactive canvas grid — square/circle/hexagon/triangle
 * cells drift in `direction` and light up under the cursor, fading out along
 * a trail of `hoverTrailAmount` previous cells.
 *
 * Ported from react-bits (github.com/DavidHDev/react-bits, MIT, zero
 * dependencies) with two additions the upstream version doesn't have: it
 * honours prefers-reduced-motion (the drift and the trail's eased fade stop
 * entirely; hovering still lights the current cell, instantly, with no
 * animation loop running while idle) and it pauses its render loop while the
 * tab is hidden.
 */
export const ShapeGrid = ({
  direction = 'right',
  speed = 1,
  borderColor = '#999',
  squareSize = 40,
  hoverFillColor = '#222',
  shape = 'square',
  hoverTrailAmount = 0,
  className = '',
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A trail is a decorative fade of past cells — pure ambience, not
    // feedback — so it's the one thing reduced motion drops outright.
    const effectiveTrail = reduceMotion ? 0 : hoverTrailAmount

    let requestId = 0
    let running = false
    const gridOffset = { x: 0, y: 0 }
    let hoveredSquare: Point | null = null
    const trailCells: Point[] = []
    const cellOpacities = new Map<string, number>()

    const isHex = shape === 'hexagon'
    const isTri = shape === 'triangle'
    const hexHoriz = squareSize * 1.5
    const hexVert = squareSize * Math.sqrt(3)

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const drawHex = (cx: number, cy: number, size: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const vx = cx + size * Math.cos(angle)
        const vy = cy + size * Math.sin(angle)
        if (i === 0) ctx.moveTo(vx, vy)
        else ctx.lineTo(vx, vy)
      }
      ctx.closePath()
    }

    const drawCircle = (cx: number, cy: number, size: number) => {
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
      ctx.closePath()
    }

    const drawTriangle = (cx: number, cy: number, size: number, flip: boolean) => {
      ctx.beginPath()
      if (flip) {
        ctx.moveTo(cx, cy + size / 2)
        ctx.lineTo(cx + size / 2, cy - size / 2)
        ctx.lineTo(cx - size / 2, cy - size / 2)
      } else {
        ctx.moveTo(cx, cy - size / 2)
        ctx.lineTo(cx + size / 2, cy + size / 2)
        ctx.lineTo(cx - size / 2, cy + size / 2)
      }
      ctx.closePath()
    }

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isHex) {
        const colShift = Math.floor(gridOffset.x / hexHoriz)
        const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz
        const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert
        const cols = Math.ceil(canvas.width / hexHoriz) + 3
        const rows = Math.ceil(canvas.height / hexVert) + 3

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * hexHoriz + offsetX
            const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY
            const alpha = cellOpacities.get(`${col},${row}`)
            if (alpha) {
              ctx.globalAlpha = alpha
              drawHex(cx, cy, squareSize)
              ctx.fillStyle = hoverFillColor
              ctx.fill()
              ctx.globalAlpha = 1
            }
            drawHex(cx, cy, squareSize)
            ctx.strokeStyle = borderColor
            ctx.stroke()
          }
        }
      } else if (isTri) {
        const halfW = squareSize / 2
        const colShift = Math.floor(gridOffset.x / halfW)
        const rowShift = Math.floor(gridOffset.y / squareSize)
        const offsetX = ((gridOffset.x % halfW) + halfW) % halfW
        const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
        const cols = Math.ceil(canvas.width / halfW) + 4
        const rows = Math.ceil(canvas.height / squareSize) + 4

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * halfW + offsetX
            const cy = row * squareSize + squareSize / 2 + offsetY
            const flip = (((col + colShift + row + rowShift) % 2) + 2) % 2 !== 0
            const alpha = cellOpacities.get(`${col},${row}`)
            if (alpha) {
              ctx.globalAlpha = alpha
              drawTriangle(cx, cy, squareSize, flip)
              ctx.fillStyle = hoverFillColor
              ctx.fill()
              ctx.globalAlpha = 1
            }
            drawTriangle(cx, cy, squareSize, flip)
            ctx.strokeStyle = borderColor
            ctx.stroke()
          }
        }
      } else if (shape === 'circle') {
        const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
        const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
        const cols = Math.ceil(canvas.width / squareSize) + 3
        const rows = Math.ceil(canvas.height / squareSize) + 3

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * squareSize + squareSize / 2 + offsetX
            const cy = row * squareSize + squareSize / 2 + offsetY
            const alpha = cellOpacities.get(`${col},${row}`)
            if (alpha) {
              ctx.globalAlpha = alpha
              drawCircle(cx, cy, squareSize)
              ctx.fillStyle = hoverFillColor
              ctx.fill()
              ctx.globalAlpha = 1
            }
            drawCircle(cx, cy, squareSize)
            ctx.strokeStyle = borderColor
            ctx.stroke()
          }
        }
      } else {
        const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
        const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
        const cols = Math.ceil(canvas.width / squareSize) + 3
        const rows = Math.ceil(canvas.height / squareSize) + 3

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const sx = col * squareSize + offsetX
            const sy = row * squareSize + offsetY
            const alpha = cellOpacities.get(`${col},${row}`)
            if (alpha) {
              ctx.globalAlpha = alpha
              ctx.fillStyle = hoverFillColor
              ctx.fillRect(sx, sy, squareSize, squareSize)
              ctx.globalAlpha = 1
            }
            ctx.strokeStyle = borderColor
            ctx.strokeRect(sx, sy, squareSize, squareSize)
          }
        }
      }
    }

    const updateCellOpacities = (instant: boolean) => {
      const targets = new Map<string, number>()
      if (hoveredSquare) targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1)

      if (effectiveTrail > 0) {
        for (let i = 0; i < trailCells.length; i++) {
          const t = trailCells[i]
          const key = `${t.x},${t.y}`
          if (!targets.has(key)) targets.set(key, (trailCells.length - i) / (trailCells.length + 1))
        }
      }

      for (const key of targets.keys()) {
        if (!cellOpacities.has(key)) cellOpacities.set(key, 0)
      }

      for (const [key, opacity] of cellOpacities) {
        const target = targets.get(key) ?? 0
        const next = instant ? target : opacity + (target - opacity) * 0.15
        if (next < 0.005) cellOpacities.delete(key)
        else cellOpacities.set(key, next)
      }
    }

    // The four shapes tile differently, so each needs its own inverse of the
    // draw math above to turn a mouse position back into a cell coordinate.
    const locateCell = (mouseX: number, mouseY: number): Point => {
      if (isHex) {
        const colShift = Math.floor(gridOffset.x / hexHoriz)
        const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz
        const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert
        const col = Math.round((mouseX - offsetX) / hexHoriz)
        const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0
        return { x: col, y: Math.round((mouseY - offsetY - rowOffset) / hexVert) }
      }
      if (isTri) {
        const halfW = squareSize / 2
        const offsetX = ((gridOffset.x % halfW) + halfW) % halfW
        const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
        return {
          x: Math.round((mouseX - offsetX) / halfW),
          y: Math.floor((mouseY - offsetY) / squareSize),
        }
      }
      if (shape === 'circle') {
        const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
        const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
        return {
          x: Math.round((mouseX - offsetX) / squareSize),
          y: Math.round((mouseY - offsetY) / squareSize),
        }
      }
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      return {
        x: Math.floor((mouseX - offsetX) / squareSize),
        y: Math.floor((mouseY - offsetY) / squareSize),
      }
    }

    const setHovered = (next: Point | null) => {
      if (hoveredSquare && (!next || next.x !== hoveredSquare.x || next.y !== hoveredSquare.y)) {
        if (effectiveTrail > 0) {
          trailCells.unshift({ ...hoveredSquare })
          if (trailCells.length > effectiveTrail) trailCells.length = effectiveTrail
        }
      }
      hoveredSquare = next
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      setHovered(locateCell(event.clientX - rect.left, event.clientY - rect.top))
      // With the animation loop off (reduced motion), nothing else will
      // redraw — do it here so hovering still gives immediate feedback.
      if (reduceMotion) {
        updateCellOpacities(true)
        drawGrid()
      }
    }

    const handleMouseLeave = () => {
      setHovered(null)
      if (reduceMotion) {
        updateCellOpacities(true)
        drawGrid()
      }
    }

    const tick = () => {
      const effectiveSpeed = Math.max(speed, 0.1)
      const wrapX = isHex ? hexHoriz * 2 : squareSize
      const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize

      switch (direction) {
        case 'right':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX
          break
        case 'left':
          gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX
          break
        case 'up':
          gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY
          break
        case 'down':
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY
          break
        case 'diagonal':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY
          break
      }

      updateCellOpacities(false)
      drawGrid()
      requestId = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || reduceMotion) return
      running = true
      requestId = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(requestId)
    }

    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    if (reduceMotion) {
      // A static grid, redrawn only when the hovered cell actually changes —
      // see handleMouseMove/handleMouseLeave above. No loop runs while idle.
      drawGrid()
    } else {
      document.addEventListener('visibilitychange', handleVisibility)
      start()
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      stop()
    }
  }, [direction, speed, borderColor, hoverFillColor, squareSize, shape, hoverTrailAmount])

  return <canvas ref={canvasRef} className={`${styles.canvas} ${className}`.trim()} />
}
