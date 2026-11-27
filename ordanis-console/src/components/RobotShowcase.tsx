import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Brand } from './Brand'

const SplineRobot = lazy(() => import('./SplineRobot'))

export function RobotShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setMounted(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <section className="marketing-section robot-section" id="operator">
    <div className="robot-copy section-heading">
      <span className="eyebrow">The human stays in control</span>
      <h2>Let the engine<br />do the watching.<br /><em>You set the direction.</em></h2>
      <p>Ordanis coordinates the work, tracks ownership, and makes failures visible. You decide what runs next.</p>
      <span className="robot-hint">{reduced ? 'A quieter experience, with reduced motion.' : 'Move your pointer. You have its attention.'}</span>
    </div>
    <div className="robot-viewport" ref={ref}>
      <div className="robot-caption"><span>Ordanis / Operator</span><span>Interactive study</span></div>
      {mounted ? <Suspense fallback={<div className="robot-loading"><Brand compact /></div>}><SplineRobot reduced={!!reduced} /></Suspense> : <div className="robot-loading"><Brand compact /></div>}
    </div>
  </section>
}
