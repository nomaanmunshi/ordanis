import { ArrowRight, Braces, Check, Code2, Github, GitBranch, Network, ShieldCheck, TerminalSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brand } from '../components/Brand'
import { InteractiveSurface } from '../components/InteractiveSurface'
import { ArchitectureGraph } from '../components/ArchitectureGraph'
import { InteractiveHeroGraph } from '../components/InteractiveHeroGraph'

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
}

export default function LandingPage() {
  return <>
    <section className="hero" id="product">
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62 }}>
        <span className="hero-kicker"><Network size={14} />Distributed workflow infrastructure</span>
        <h1>Orchestrate work.<br /><em>Recover with confidence.</em></h1>
        <p>Define, schedule, and inspect reliable workflows across Java workers, HTTP services, files, databases, and specialised compute workloads.</p>
        <div className="hero-actions">
          <Link className="button primary large" to="/console">Open engineering console <ArrowRight size={17} /></Link>
          <a className="button secondary large" href="#engineering">View engineering case study</a>
        </div>
        <div className="hero-links">
          <a href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={14} />Source on GitHub</a>
          <a href="#architecture">Inspect the architecture</a>
        </div>
        <div className="owner-line"><span>NM</span><div><strong>Built by Nomaan Munshi</strong><small>Java backend, distributed execution, frontend console</small></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }}>
        <InteractiveSurface className="hero-visual"><InteractiveHeroGraph /></InteractiveSurface>
      </motion.div>
    </section>

    <section className="proof-strip" aria-label="Reliability features">
      {['At-least-once task delivery','Lease-based worker assignment','Idempotent handler support','Live DAG monitoring','Retry and crash recovery','Versioned definitions'].map((item) => <span key={item}><Check size={14} />{item}</span>)}
    </section>

    <motion.section {...reveal} className="marketing-section architecture" id="architecture">
      <div className="section-heading"><span className="eyebrow">Platform architecture</span><h2>Control decisions stay separate from task execution.</h2><p>The scheduler owns durable coordination. Workers remain replaceable, capability-aware executors that can disappear without taking ownership state with them.</p></div>
      <InteractiveSurface className="architecture-diagram"><ArchitectureGraph /></InteractiveSurface>
    </motion.section>

    <motion.section {...reveal} className="marketing-section engineering-section" id="engineering">
      <div className="section-heading"><span className="eyebrow">Engineering case study</span><h2>Built around backend correctness, not dashboard decoration.</h2><p>The public site explains the product. The console and repository expose the distributed systems work behind it.</p></div>
      <div className="engineering-grid">
        <article><Code2 /><span>01</span><strong>DAG compiler</strong><p>Parses workflow definitions, rejects missing dependencies and cycles, then calculates executable concurrency levels.</p><small>Graph validation · topological planning</small></article>
        <article><GitBranch /><span>02</span><strong>Lease scheduler</strong><p>Uses atomic PostgreSQL row locking to prevent concurrent workers from leasing the same eligible task.</p><small>SKIP LOCKED · capacity matching</small></article>
        <article><Network /><span>03</span><strong>Worker protocol</strong><p>Supports capability registration, heartbeats, progress, cancellation, lease tokens, timeouts, and graceful shutdown.</p><small>Java SDK · gRPC</small></article>
        <article><ShieldCheck /><span>04</span><strong>Failure recovery</strong><p>Expired leases return tasks to the queue while stale worker acknowledgements are rejected by token validation.</p><small>Retries · idempotency · recovery</small></article>
      </div>
      <div className="stack-band"><span>Core stack</span>{['Java 21','Spring Boot','PostgreSQL','gRPC','React','TypeScript','Docker','Testcontainers'].map((item) => <code key={item}>{item}</code>)}</div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section definition" id="workflow-definition">
      <div className="section-heading"><span className="eyebrow">Workflow compiler</span><h2>Define intent, then compile an executable graph.</h2><p>Ordanis validates dependencies, rejects cycles, and exposes safe concurrency before a run begins.</p></div>
      <div className="definition-grid"><pre><code><span>name:</span> document-analysis{`\n\n`}<span>tasks:</span>{`\n`}  - id: extract{`\n`}    type: JAVA{`\n`}    handler: extract-text{`\n\n`}  - id: classify{`\n`}    type: INFERENCE{`\n`}    dependsOn: [extract]{`\n\n`}  - id: notify{`\n`}    type: HTTP{`\n`}    dependsOn: [classify]</code></pre><div className="compiled-card"><div className="compiled-head"><ShieldCheck /><div><strong>Definition valid</strong><small>3 tasks · 3 execution levels</small></div></div>{['extract','classify','notify'].map((node, i) => <div className="compiled-row" key={node}><span>{i + 1}</span><strong>{node}</strong><i />{i < 2 && <ArrowRight size={15} />}</div>)}<div className="compiler-note"><Braces size={16} /><span>No cycle detected. Maximum concurrency: <strong>1 task</strong>.</span></div></div></div>
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
      ].map(([title, steps]) => <article key={title as string}><strong>{title as string}</strong><div>{(steps as string[]).map((step, i) => <span key={step}>{step}{i < (steps as string[]).length - 1 && <ArrowRight size={12} />}</span>)}</div></article>)}</div>
    </motion.section>

    <motion.section {...reveal} className="marketing-section recruiter-cta" id="docs">
      <div><span className="eyebrow">Platform brief</span><h2>The product story and engineering evidence are connected.</h2><p>Open the console to inspect workflows, live execution state, worker health, failure handling, and the visual DAG builder. Visit the repository for implementation details and the complete source.</p><div className="hero-actions"><Link className="button primary" to="/console"><TerminalSquare size={16} />Open console</Link><a className="button secondary" href="https://github.com/nomaanmunshi/ordanis" target="_blank" rel="noreferrer"><Github size={16} />Source repository</a></div></div>
      <div className="statement-card"><Brand /><blockquote>Ordanis provides at-least-once task delivery and supports idempotent handlers and compensation for safe recovery.</blockquote><span>Execution contract</span></div>
    </motion.section>
  </>
}
