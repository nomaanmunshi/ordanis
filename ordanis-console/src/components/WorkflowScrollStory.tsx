import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const modules = [
  {
    label: 'Compiler',
    title: 'DAG compiler',
    body: 'Validates dependencies and cycles before work is allowed to execute.',
    meta: 'graph validation · topological plan',
    visual: ['workflow.yaml', 'DAG valid', '3 levels · no cycle'],
  },
  {
    label: 'Scheduler',
    title: 'Lease scheduler',
    body: 'Assigns eligible work with durable, time-bound ownership instead of optimistic guesses.',
    meta: 'SKIP LOCKED · capacity match',
    visual: ['eligible task', 'worker-a · 30s', 'atomic ownership'],
  },
  {
    label: 'Protocol',
    title: 'Worker protocol',
    body: 'Coordinates heartbeats, progress, cancellation, lease tokens and graceful shutdown.',
    meta: 'Java SDK · gRPC',
    visual: ['heartbeat', 'progress', 'lease token'],
  },
  {
    label: 'Recovery',
    title: 'Failure recovery',
    body: 'Expired leases return work safely so another healthy worker can continue the run.',
    meta: 'retries · idempotency · recovery',
    visual: ['worker-a lost', 'lease expired', 'worker-b resumed'],
  },
]

// Broad, overlapping ranges make the motion begin while the scene is entering
// and finish as it settles around the middle of the viewport.
const revealWindows: Array<[number, number]> = [
  [0.00, 0.58],
  [0.06, 0.68],
  [0.12, 0.78],
  [0.18, 0.88],
]

function useMobileLayout() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return mobile
}

export function WorkflowScrollStory() {
  const ref = useRef<HTMLElement>(null)
  const mobile = useMobileLayout()

  // No long pinned runway. The animation starts as the section enters the lower
  // middle of the viewport and completes when the section itself reaches centre.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 82%', 'center 50%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 78, damping: 24, mass: 0.32 })

  const stageY = useTransform(progress, [0, 0.5, 1], [mobile ? 22 : 54, mobile ? 8 : 18, 0])
  const stageScale = useTransform(progress, [0, 0.58, 1], [mobile ? 0.985 : 0.945, 0.985, 1])
  const headingY = useTransform(progress, [0, 0.55, 1], [mobile ? 10 : 18, 5, 0])
  const headingOpacity = useTransform(progress, [0, 0.18, 1], [0.72, 1, 1])
  const frameOpacity = useTransform(progress, [0.48, 0.82, 1], [0, 0.78, 1])
  const frameScale = useTransform(progress, [0.48, 0.84, 1], [1.016, 1.004, 1])
  const railScale = useTransform(progress, [0.56, 0.9], [0, 1])
  const statusOpacity = useTransform(progress, [0.72, 0.92, 1], [0, 1, 1])

  return (
    <section ref={ref} className="engine-reveal-story" id="engineering" aria-label="How the Ordanis execution engine works">
      <div className="engine-reveal-sticky">
        <motion.div className="engine-reveal-shell" style={{ y: stageY, scale: stageScale }}>
          <motion.div className="engine-reveal-heading" style={{ y: headingY, opacity: headingOpacity }}>
            <div className="engine-reveal-intro">
              <span>Inside Ordanis</span>
              <h2>Four responsibilities. One execution path.</h2>
              <p>The execution engine resolves into place as you move through the system.</p>
            </div>
          </motion.div>

          <div className="engine-reveal-stage">
            <motion.div className="engine-reveal-frame" style={{ opacity: frameOpacity, scale: frameScale }} aria-hidden="true" />
            <motion.div className="engine-reveal-rail" style={{ scaleX: railScale, opacity: frameOpacity }} aria-hidden="true">
              <i /><i /><i /><i />
            </motion.div>

            <div className="engine-reveal-cards">
              {modules.map((module, index) => (
                <RevealCard key={module.title} module={module} index={index} progress={progress} mobile={mobile} />
              ))}
            </div>
          </div>

          <motion.div className="engine-reveal-status" style={{ opacity: statusOpacity }}>
            <span>RUN / 7F3A</span>
            <b>document-analysis</b>
            <small>durable ownership · recoverable execution</small>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function RevealCard({
  index,
  progress,
  module,
  mobile,
}: {
  index: number
  progress: MotionValue<number>
  module: (typeof modules)[number]
  mobile: boolean
}) {
  const [start, end] = revealWindows[index]

  const startY = mobile ? 28 + index * 2 : 74 + index * 7
  const startX = mobile ? (index % 2 === 0 ? -5 : 5) : [-36, -13, 13, 36][index]
  const startRotateY = mobile ? [-6, -4, 4, 6][index] : [-30, -17, 17, 30][index]
  const startRotateX = mobile ? 3 : [9, 7, 7, 9][index]
  const startRotateZ = mobile ? [-0.35, -0.2, 0.2, 0.35][index] : [-1.1, -0.55, 0.55, 1.1][index]

  const y = useTransform(progress, [start, end], [startY, 0])
  const x = useTransform(progress, [start, end], [startX, 0])
  const z = useTransform(progress, [start, end], [mobile ? -12 : -78, 0])
  const rotateY = useTransform(progress, [start, end], [startRotateY, 0])
  const rotateX = useTransform(progress, [start, end], [startRotateX, 0])
  const rotateZ = useTransform(progress, [start, end], [startRotateZ, 0])
  const scale = useTransform(progress, [start, end], [mobile ? 0.975 : 0.9, 1])
  const opacity = useTransform(progress, [start, Math.min(start + 0.16, end), end], [0.26, 0.78, 1])

  return (
    <motion.article
      className={`engine-reveal-card engine-reveal-card-${index + 1}`}
      style={{ x, y, z, rotateX, rotateY, rotateZ, scale, opacity }}
    >
      <div className="engine-reveal-card-head">
        <span>{module.label}</span>
        <small>0{index + 1}</small>
      </div>

      <div className="engine-reveal-mini" aria-hidden="true">
        <span>{module.visual[0]}</span>
        <b>{module.visual[1]}</b>
        <small>{module.visual[2]}</small>
      </div>

      <div className="engine-reveal-card-copy">
        <h3>{module.title}</h3>
        <p>{module.body}</p>
      </div>

      <small className="engine-reveal-meta">{module.meta}</small>
    </motion.article>
  )
}
