import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Application } from '@splinetool/runtime'
import { Brand } from './Brand'

const Spline = lazy(() => import('@splinetool/react-spline'))
// Published community scene used by the reference, also demonstrated by 21st/Inspira UI.
const ROBOT_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'

function ScenePoster({ message }: { message: string }) {
  return <div className="robot-poster">
    <img src={`${import.meta.env.BASE_URL}assets/nexbot-preview.webp`} alt="NEXBOT, the metallic robot from the Spline community scene" />
    <div className="robot-poster-status"><span>{message}</span><a href="https://app.spline.design/community/file/615b9422-9985-43f6-8593-d7d7bc3b0be1" target="_blank" rel="noreferrer">NEXBOT · Spline community</a></div>
  </div>
}

function LoadingScene() {
  return <div className="robot-loading" role="status"><Brand compact /><span>Loading interactive scene</span></div>
}

function UnavailableScene() {
  return <ScenePoster message="Static preview · 3D rendering is unavailable in this browser" />
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <UnavailableScene /> : this.props.children }
}

export default function SplineRobot({ reduced }: { reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [app, setApp] = useState<Application | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    setSupported(!!gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  }, [])

  useEffect(() => {
    const section = host.current?.closest('section')
    const canvas = host.current?.querySelector('canvas')
    if (!app || !section || !canvas) return
    let latest: { x: number; y: number; pointerType: string; pointerId: number } | null = null
    const send = (x: number, y: number, type = 'pointermove', pointerType = 'mouse', pointerId = 1) => {
      const event = new PointerEvent(type, { clientX: x, clientY: y, pointerType, pointerId })
      Object.defineProperties(event, { pageX: { value: x + window.scrollX }, pageY: { value: y + window.scrollY } })
      canvas.dispatchEvent(event)
    }
    const draw = () => {
      if (!latest) return
      const box = canvas.getBoundingClientRect()
      const area = section.getBoundingClientRect()
      const centreX = box.left + box.width / 2
      const centreY = box.top + box.height / 2
      const clamp = (n: number) => Math.max(-1, Math.min(1, n))
      const nx = clamp((latest.x - centreX) / Math.max(centreX - area.left, area.right - centreX, 1))
      const ny = clamp((latest.y - centreY) / Math.max(centreY - area.top, area.bottom - centreY, 1))
      send(centreX + nx * box.width / 2, centreY + ny * box.height / 2, 'pointermove', latest.pointerType, latest.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!event.isTrusted || event.pointerType === 'touch') return
      latest = { x: event.clientX, y: event.clientY, pointerType: event.pointerType, pointerId: event.pointerId }
      draw()
    }
    const enter = (event: PointerEvent) => {
      if (!event.isTrusted) return
      const box = canvas.getBoundingClientRect()
      send(box.left + box.width / 2, box.top + box.height / 2, 'pointerenter')
      move(event)
    }
    const reset = () => {
      latest = null
      const box = canvas.getBoundingClientRect()
      send(box.left + box.width / 2, box.top + box.height / 2)
    }
    // The scene's authored look-at motion receives one continuous coordinate space
    // across the copy and canvas, rather than snapping at the canvas boundary. No extra easing is layered on top.
    const suppressBoundaryReset = (event: PointerEvent) => { if (event.isTrusted) event.stopImmediatePropagation() }
    section.addEventListener('pointermove', move, { passive: true })
    section.addEventListener('pointerenter', enter)
    section.addEventListener('pointerleave', reset)
    canvas.addEventListener('pointerenter', suppressBoundaryReset, true)
    canvas.addEventListener('pointerleave', suppressBoundaryReset, true)
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) app.play()
      else app.stop()
    })
    observer.observe(section)
    const visibility = () => { if (document.hidden) app.stop(); else if (section.getBoundingClientRect().bottom > 0 && section.getBoundingClientRect().top < window.innerHeight) app.play() }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect()
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerenter', enter)
      section.removeEventListener('pointerleave', reset)
      canvas.removeEventListener('pointerenter', suppressBoundaryReset, true)
      canvas.removeEventListener('pointerleave', suppressBoundaryReset, true)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [app])

  if (reduced) return <ScenePoster message="Static preview · reduced motion" />
  if (supported === false) return <UnavailableScene />
  if (supported === null) return <LoadingScene />
  return <div ref={host} className="robot-scene" role="img" aria-label="Interactive metallic robot that follows your pointer">
    <SceneBoundary><Suspense fallback={<LoadingScene />}><Spline scene={ROBOT_SCENE} onLoad={setApp} htmlContentMode="none" renderOnDemand className="spline-robot-canvas" /></Suspense></SceneBoundary>
  </div>
}
