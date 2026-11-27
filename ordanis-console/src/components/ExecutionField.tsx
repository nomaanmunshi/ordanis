import { useEffect, useRef } from 'react'

/** A procedural point cloud: no video, textures, or WebGL dependency. */
export function ExecutionField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let visible = true
    let width = 0
    let height = 0
    let lastTime = 0
    let phase = 0
    const draw = () => {
      context.clearRect(0, 0, width, height)
      const light = document.documentElement.dataset.theme === 'light'
      const scale = Math.min(width / 1100, 1.2)
      // Two crossing ribbons suggest work moving through a common execution path.
      for (let band = 0; band < 2; band++) {
        for (let row = 0; row < 27; row++) {
          for (let column = 0; column < 96; column++) {
            const u = column / 95
            const v = row / 26
            const angle = u * Math.PI * 2 + phase + band * Math.PI
            const radius = 270 + (v - .5) * 150
            const x = width / 2 + Math.cos(angle) * radius * 1.9 * scale
            const y = height / 2 + (Math.sin(angle * 1.3 + band * 1.4) * 160 + (v - .5) * 170) * scale
            const depth = (Math.sin(angle) + 1) / 2
            const edge = Math.sin(v * Math.PI)
            // Keep the central copy legible; density remains at the edges.
            const centre = Math.max(.08, Math.min(1, Math.abs(x - width / 2) / (width * .34)))
            context.fillStyle = light
              ? `rgba(25,80,64,${(.12 + depth * .35) * edge * centre})`
              : `rgba(158,209,186,${(.12 + depth * .57) * edge * centre})`
            context.beginPath()
            context.arc(x, y, (.55 + depth * .75) * Math.max(.65, scale), 0, Math.PI * 2)
            context.fill()
          }
        }
      }
    }
    const tick = (time: number) => {
      if (time - lastTime > 40) {
        phase += Math.min(time - lastTime, 80) * .000035
        lastTime = time
        draw()
      }
      frame = window.requestAnimationFrame(tick)
    }
    const start = () => {
      window.cancelAnimationFrame(frame)
      draw()
      if (visible && !document.hidden && !media.matches) {
        lastTime = performance.now()
        frame = window.requestAnimationFrame(tick)
      }
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      start()
    })
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    const theme = new MutationObserver(draw)
    resize.observe(canvas)
    intersection.observe(canvas)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    media.addEventListener('change', start)
    document.addEventListener('visibilitychange', start)
    return () => {
      window.cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
      theme.disconnect()
      media.removeEventListener('change', start)
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  return <canvas ref={canvasRef} className="execution-field" aria-hidden="true" />
}
