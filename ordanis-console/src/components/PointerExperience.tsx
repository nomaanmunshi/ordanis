import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** One delegated pointer listener for the public site; never intercepts clicks or scrolling. */
export function PointerExperience() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [pressed, setPressed] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 540, damping: 38, mass: 0.3 })
  const ringY = useSpring(y, { stiffness: 540, damping: 38, mass: 0.3 })

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('.marketing-root')
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!root || reduced || !fine.matches) return
    let card: HTMLElement | null = null
    let magnet: HTMLElement | null = null
    let frame = 0
    let latest: PointerEvent | null = null
    const clear = () => {
      card?.style.removeProperty('--glow-opacity')
      magnet?.style.removeProperty('translate')
      card = magnet = null
    }
    const draw = () => {
      frame = 0
      if (!latest) return
      const event = latest
      const target = event.target instanceof Element ? event.target : null
      x.set(event.clientX); y.set(event.clientY)
      setVisible(true)
      setInteractive(!!target?.closest('a,button,[role="button"],input'))
      const nextCard = target?.closest<HTMLElement>('.use-case-grid article,.story-layout article,.engine-reveal-card,.execution-window,.robot-viewport,.statement-card,.definition-grid pre,.compiled-card') ?? null
      if (nextCard !== card) { card?.style.removeProperty('--glow-opacity'); card = nextCard }
      if (card) {
        const rect = card.getBoundingClientRect()
        card.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
        card.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
        card.style.setProperty('--glow-opacity', '1')
      }
      const nextMagnet = target?.closest<HTMLElement>('a.button,.nav-launch') ?? null
      if (nextMagnet !== magnet) { magnet?.style.removeProperty('translate'); magnet = nextMagnet }
      if (magnet) {
        const rect = magnet.getBoundingClientRect()
        const dx = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .08))
        const dy = Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) * .08))
        magnet.style.translate = `${dx}px ${dy}px`
      }
    }
    const move = (event: PointerEvent) => { latest = event; if (!frame) frame = requestAnimationFrame(draw) }
    const leave = () => { setVisible(false); setPressed(false); clear() }
    const down = () => setPressed(true)
    const up = () => setPressed(false)
    root.classList.add('custom-pointer-enabled')
    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerleave', leave)
    root.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('blur', leave)
    return () => {
      cancelAnimationFrame(frame); clear()
      root.classList.remove('custom-pointer-enabled')
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
      root.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('blur', leave)
    }
  }, [reduced, x, y])

  return <div ref={ref} className="pointer-experience" aria-hidden="true">
    <motion.span className="pointer-core" style={{ x, y }} animate={{ opacity: visible ? 1 : 0, scale: pressed ? .5 : 1 }} transition={{ duration: .12 }} />
    <motion.span className={`pointer-brackets ${interactive ? 'over-control' : ''}`} style={{ x: ringX, y: ringY }} animate={{ opacity: visible ? 1 : 0, scale: pressed ? .75 : interactive ? 1.5 : 1, rotate: pressed ? 45 : 0 }} transition={{ type: 'spring', stiffness: 430, damping: 28 }} />
  </div>
}
