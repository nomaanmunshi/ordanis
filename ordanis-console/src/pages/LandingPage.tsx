import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brand } from '../components/Brand'
import { InteractiveSurface } from '../components/InteractiveSurface'
import { ArchitectureGraph } from '../components/ArchitectureGraph'
import { InteractiveHeroGraph } from '../components/InteractiveHeroGraph'
import { WorkflowScrollStory } from '../components/WorkflowScrollStory'

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
}

const proofItems = [
  'At-least-once task delivery',
  'Lease-based worker assignment',
  'Idempotent handler support',
  'Live DAG monitoring',
  'Retry and crash recovery',
  'Versioned definitions',
]

export default function LandingPage() {
  return <>
    <section className="hero" id="product">
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62 }}>
        <span className="hero-kicker">Distributed workflow infrastructure</span>
        <h1>Orchestrate work.<br /><em>Recover with confidence.</em></h1>
        <p>Define, schedule, and inspect reliable workflows across Java workers, HTTP services, files, databases, and specialised compute workloads.</p>
        <div className="hero-actions">
          <Link className="button primary large" to="/console">Open engineering console <span aria-hidden="true">→</span></Link>
          <a className="button secondary large" href="#architecture">Inspect the architecture</a>
        </div>
        <div className="hero-links">
          <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer">Source on GitHub ↗</a>
          <a href="#story">Read the engineering story</a>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }}>
        <InteractiveSurface className="hero-visual"><InteractiveHeroGraph /></InteractiveSurface>
      </motion.div>
    </section>

    <section className="proof-strip" aria-label="Reliability features">
      {proofItems.map((item) => <span key={item}>{item}</span>)}
    </section>

    <motion.section {...reveal} className="marketing-section architecture" id="architecture">
      <div className="section-heading"><span className="eyebrow">Platform architecture</span><h2>Control decisions stay separate from task execution.</h2><p>The scheduler owns durable coordination. Workers remain replaceable, capability-aware executors that can disappear without taking ownership state with them.</p></div>
      <InteractiveSurface className="architecture-diagram"><ArchitectureGraph /></InteractiveSurface>
    </motion.section>

    <WorkflowScrollStory />

    <motion.section {...reveal} className="marketing-section definition" id="workflow-definition">
      <div className="section-heading"><span className="eyebrow">Workflow compiler</span><h2>Define intent, then compile an executable graph.</h2><p>Ordanis validates dependencies, rejects cycles, and exposes safe concurrency before a run begins.</p></div>
      <div className="definition-grid"><pre><code><span>name:</span> document-analysis{`\n\n`}<span>tasks:</span>{`\n`}  - id: extract{`\n`}    type: JAVA{`\n`}    handler: extract-text{`\n\n`}  - id: classify{`\n`}    type: INFERENCE{`\n`}    dependsOn: [extract]{`\n\n`}  - id: notify{`\n`}    type: HTTP{`\n`}    dependsOn: [classify]</code></pre><div className="compiled-card"><div className="compiled-head"><div><strong>Definition valid</strong><small>3 tasks · 3 execution levels</small></div></div>{['extract','classify','notify'].map((node, i) => <div className="compiled-row" key={node}><span>{i + 1}</span><strong>{node}</strong><i />{i < 2 && <b aria-hidden="true">→</b>}</div>)}<div className="compiler-note"><span>No cycle detected. Maximum concurrency: <strong>1 task</strong>.</span></div></div></div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section recovery">
      <div className="section-heading"><span className="eyebrow">Failure recovery</span><h2>A crashed worker does not own the task forever.</h2><p>Time-bound leases make work recoverable without pretending delivery is exactly once.</p></div>
      <div className="recovery-track">{[
        ['Task assigned','scheduler to worker-a'],['Lease active','30-second ownership'],['Heartbeat missed','worker stops responding'],['Lease expired','task eligible again'],['Execution resumed','worker-b continues']
      ].map(([title, detail], i) => <article key={title} className={i === 2 ? 'danger-step' : i === 4 ? 'success-step' : ''}><span>{i + 1}</span><strong>{title}</strong><small>{detail}</small></article>)}</div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section" id="use-cases">
      <div className="section-heading"><span className="eyebrow">Credible workloads</span><h2>One engine, several engineering domains.</h2><p>The platform stays general. Workflow definitions carry the domain-specific behaviour.</p></div>
      <div className="use-case-grid">{[
        ['Distributed data processing',['Split dataset','Process partitions','Merge','Validate']],
        ['Transaction reconciliation',['Import','Validate','Deduplicate','Reconcile']],
        ['Media processing',['Upload','Thumbnail','Metadata','Publish']],
        ['Document processing',['Extract','Redact','Classify','Approve']],
      ].map(([title, steps]) => <article key={title as string}><strong>{title as string}</strong><div>{(steps as string[]).map((step, i) => <span key={step}>{step}{i < (steps as string[]).length - 1 && <b aria-hidden="true">→</b>}</span>)}</div></article>)}</div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section story-section" id="story">
      <div className="section-heading"><span className="eyebrow">Engineering story</span><h2>Ordanis started with one question: what makes background work reliable when things fail?</h2></div>
      <div className="story-layout refined-story-layout">
        <article className="story-lead">
          <span>Origin</span>
          <h3>Start with the failure model</h3>
          <p>The project began around the parts of background execution that are easy to hide behind a queue: dependencies, leasing, retries, worker crashes, durable state, cancellation, and recovery.</p>
        </article>
        <article>
          <span>System</span>
          <h3>Keep coordination explicit</h3>
          <p>The execution engine, worker protocol, and operations console expose ownership and state transitions instead of burying them behind a decorative dashboard.</p>
        </article>
        <article>
          <span>Direction</span>
          <h3>Build outward from the core</h3>
          <p>New capabilities are added only when the underlying execution contract remains understandable, observable, and testable.</p>
        </article>
      </div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section recruiter-cta" id="docs">
      <div><span className="eyebrow">Platform brief</span><h2>The product story and engineering evidence are connected.</h2><p>Open the console to inspect workflows, live execution state, worker health, failure handling, and the visual DAG builder. Visit the repository for implementation details and the complete source.</p><div className="hero-actions"><Link className="button primary" to="/console">Open console</Link><a className="button secondary" href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer">Source repository ↗</a></div></div>
      <div className="statement-card"><Brand /><blockquote>At-least-once delivery, durable ownership, and recoverable execution are treated as explicit system contracts.</blockquote><span>Execution contract</span></div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section builder-section" id="builder">
      <div className="builder-intro">
        <span className="eyebrow">Behind Ordanis</span>
        <h2>Nomaan Munshi</h2>
        <p>Ordanis is a systems-engineering project by Nomaan Munshi, focused on reliable workflow execution, Java backend architecture, scheduling, worker coordination, and an inspectable operations console.</p>
      </div>
      <div className="builder-links">
        <a href="https://github.com/nomaanmunshi" target="_blank" rel="noreferrer"><span>GitHub</span><b aria-hidden="true">↗</b></a>
        <a href="https://www.linkedin.com/in/nomaan-munshi" target="_blank" rel="noreferrer"><span>LinkedIn</span><b aria-hidden="true">↗</b></a>
      </div>
    </motion.section>
  </>
}
