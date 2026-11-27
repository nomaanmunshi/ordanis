import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, FileCode2, GitBranch, HeartPulse, RotateCcw, ShieldCheck } from 'lucide-react'
import { InteractiveHeroGraph } from './InteractiveHeroGraph'

const chapters = [
  { id: 'execution-run', label: 'Run', title: 'Let the work flow.', body: 'Follow a document through parallel tasks. Inspect the graph, pause execution, or step through it yourself.' },
  { id: 'execution-own', label: 'Coordinate', title: 'Give every task an owner.', body: 'Dependencies decide what is ready. Time-bound leases decide who can run it. Durable state keeps that decision visible.' },
  { id: 'execution-recover', label: 'Recover', title: 'Pick up where it stopped.', body: 'A worker misses its heartbeat. Its lease expires. Another worker can take over. Handlers must tolerate repeated execution.' },
]

function ChapterPanel({ children, id, label }: { children: ReactNode; id: string; label: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'end 5%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: .35 })
  const y = useTransform(progress, [0,.35,.7,1], [60,0,0,-32])
  const scale = useTransform(progress, [0,.3,.75,1], [.96,1,1,.98])
  const opacity = useTransform(progress, [0,.2,.8,1], [.25,1,1,.45])
  return <article id={id} ref={ref} className="execution-chapter" aria-label={label}>
    <motion.div className="chapter-motion" style={reduced ? undefined : { y, scale, opacity }}>{children}</motion.div>
  </article>
}

export function ExecutionScrollStory() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  useEffect(() => {
    const panels = root.current?.querySelectorAll<HTMLElement>('.execution-chapter')
    if (!panels) return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(chapters.findIndex(chapter => chapter.id === entry.target.id))
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 })
    panels.forEach(panel => observer.observe(panel))
    return () => observer.disconnect()
  }, [])
  return <section className="marketing-section execution-section" id="product">
    <div className="execution-intro">
      <div className="section-heading"><span className="eyebrow">The failure is part of the demo</span><h2>One worker stops.<br /><em>The workflow continues.</em></h2></div>
      <p>Scroll through the execution model. From the first task to the moment a replacement worker takes over.</p>
    </div>
    <div className="execution-narrative" ref={root}>
      <div className="chapter-navigation" aria-label="Execution walkthrough">
        {chapters.map((chapter,index) => <a key={chapter.id} href={`#${chapter.id}`} className={`chapter-link ${active===index?'active':''}`} aria-current={active===index?'step':undefined}>
          <span className="chapter-label">{chapter.label}</span><h3>{chapter.title}</h3><div className="chapter-description"><p>{chapter.body}</p></div>
        </a>)}
        <span className="chapter-scroll-hint">Scroll to follow the execution</span>
      </div>
      <div className="chapter-panels">
        <ChapterPanel id="execution-run" label="Run a workflow">
          <div className="execution-window"><div className="execution-window-bar"><span>document-analysis</span><span>Illustrative simulation</span></div><InteractiveHeroGraph /></div>
        </ChapterPanel>
        <ChapterPanel id="execution-own" label="Coordinate task ownership">
          <div className="ownership-window execution-window">
            <div className="execution-window-bar"><span>Durable coordination</span><ShieldCheck size={16}/></div>
            <div className="ownership-pipeline"><div><FileCode2 size={24}/><strong>Definition</strong><small>document-analysis.yaml</small></div><i/><div><GitBranch size={24}/><strong>Dependencies</strong><small>Ready to execute</small></div><i/><div><HeartPulse size={24}/><strong>Ownership</strong><small>worker-a</small></div></div>
            <div className="ownership-record"><span>Task ownership</span><strong>classify-document</strong><dl><div><dt>Assigned worker</dt><dd>worker-a</dd></div><div><dt>Lease duration</dt><dd>30 seconds</dd></div><div><dt>Dependency check</dt><dd><Check size={14}/> Satisfied</dd></div><div><dt>State</dt><dd>RUNNING</dd></div></dl></div>
            <div className="chapter-footnote">Illustrative state · not a live backend record</div>
          </div>
        </ChapterPanel>
        <ChapterPanel id="execution-recover" label="Recover after a worker failure">
          <div className="recovery-window execution-window">
            <div className="execution-window-bar"><span>Recovery sequence</span><RotateCcw size={16}/></div>
            <div className="recovery-headline"><span>Same task. New owner.</span><h3>The work has<br />a way forward.</h3></div>
            <div className="recovery-handoff"><div><span className="worker-lost">worker-a</span><small>Heartbeat missed</small></div><span className="handoff-line"/><div><span>worker-b</span><small>Eligible to resume</small></div></div>
            <div className="recovery-events"><p><time>00:00</time><span>Worker stops responding</span></p><p><time>00:30</time><span>Lease expires; task becomes eligible</span></p><p><time>00:31</time><span>A healthy worker claims the task</span></p></div>
            <div className="chapter-footnote">Illustrative timing · at-least-once delivery</div>
          </div>
        </ChapterPanel>
      </div>
    </div>
    <div className="execution-contract"><span>Explicit guarantees</span><p>At-least-once delivery. Time-bound ownership. Handlers must tolerate repeated execution.</p></div>
  </section>
}
