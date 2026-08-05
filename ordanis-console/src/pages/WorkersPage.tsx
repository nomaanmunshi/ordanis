import { Cpu, HardDrive, Radio, Server, ShieldAlert } from 'lucide-react'
import { useWorkers } from '../api/hooks'
import { ErrorState, MetricCard, PageHeader, Panel } from '../components/Page'
import { StatusBadge } from '../components/StatusBadge'

export default function WorkersPage() {
  const query = useWorkers()
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />
  const workers = query.data ?? []
  const online = workers.filter((worker) => worker.status === 'ONLINE').length
  const slots = workers.reduce((sum, worker) => sum + worker.maxSlots, 0)
  const active = workers.reduce((sum, worker) => sum + worker.activeTasks, 0)
  return <><PageHeader eyebrow="Data plane" title="Worker fleet" description="Registered executors, advertised capabilities, capacity, and heartbeat health." />
    <div className="metric-grid three"><MetricCard label="Online workers" value={`${online}/${workers.length}`} detail="Heartbeat threshold: 30 seconds" icon={<Server/>}/><MetricCard label="Execution slots" value={slots} detail={`${Math.max(0, slots - active)} currently available`} icon={<Cpu/>}/><MetricCard label="Active assignments" value={active} detail="Tasks holding a valid worker lease" icon={<Radio/>}/></div>
    <div className="worker-grid">{workers.map((worker) => <article className="worker-card" key={worker.id}><div className="worker-card-head"><div className="worker-machine"><Server size={19}/></div><div><strong>{worker.name}</strong><code>{worker.id}</code></div><StatusBadge status={worker.status as 'ONLINE'|'OFFLINE'}/></div><div className="worker-capacity"><div><span>Slot usage</span><b>{worker.activeTasks} / {worker.maxSlots}</b></div><span><i style={{ width: `${worker.maxSlots ? worker.activeTasks / worker.maxSlots * 100 : 0}%` }}/></span></div><div className="capability-list">{worker.capabilities.map((capability) => <code key={capability}>{capability}</code>)}</div><dl><div><dt>Last heartbeat</dt><dd>{new Date(worker.lastSeenAt).toLocaleTimeString()}</dd></div><div><dt>Protocol</dt><dd>gRPC</dd></div><div><dt>Lease state</dt><dd>{worker.status === 'ONLINE' ? 'Eligible' : 'Unavailable'}</dd></div></dl><div className="worker-actions"><button className="button secondary small" disabled title="Worker draining is not implemented by the backend">Drain worker</button><button className="button secondary small" onClick={() => navigator.clipboard.writeText(worker.id)}>Copy ID</button></div></article>)}</div>
    <Panel title="Capability distribution" description="Capabilities are registered by each worker when it connects"><div className="capability-bars">{capabilityCounts(workers).map(([name, count]) => <div key={name}><code>{name}</code><span><i style={{ width: `${workers.length ? count / workers.length * 100 : 0}%` }}/></span><b>{count} worker{count !== 1 ? 's' : ''}</b></div>)}</div></Panel>
    <div className="honesty-note"><ShieldAlert/><div><strong>Resource telemetry is intentionally limited.</strong><p>Version one enforces execution slots and heartbeat health. CPU, memory, and disk telemetry require a real worker metrics contract before this page should display them.</p></div></div>
  </>
}

function capabilityCounts(workers: Array<{ capabilities: string[] }>) {
  const counts = new Map<string, number>()
  workers.forEach((worker) => worker.capabilities.forEach((capability) => counts.set(capability, (counts.get(capability) ?? 0) + 1)))
  return [...counts.entries()].sort((a,b) => b[1] - a[1])
}
