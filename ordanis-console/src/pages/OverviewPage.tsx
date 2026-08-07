import { Activity, AlertTriangle, Clock3, Gauge, Server, Workflow } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useRuns, useWorkers, useWorkflows } from '../api/hooks'
import { dataMode } from '../api/client'
import { throughputFixture } from '../data/fixtures'
import { MetricCard, PageHeader, Panel, ErrorState } from '../components/Page'
import { StatusBadge } from '../components/StatusBadge'

export default function OverviewPage() {
  const workflows = useWorkflows(); const runs = useRuns(); const workers = useWorkers()
  if (workflows.isError || runs.isError || workers.isError) return <ErrorState error={workflows.error ?? runs.error ?? workers.error} retry={() => { workflows.refetch(); runs.refetch(); workers.refetch() }} />
  const runData = runs.data ?? []
  const workerData = workers.data ?? []
  const runningTasks = runData.flatMap((run) => run.tasks).filter((task) => task.status === 'RUNNING').length
  const queuedTasks = runData.flatMap((run) => run.tasks).filter((task) => task.status === 'QUEUED' || task.status === 'BLOCKED').length
  const failed = runData.filter((run) => run.status === 'FAILED').length
  const healthy = workerData.filter((worker) => worker.status === 'ONLINE').length
  const sampleMetrics = dataMode !== 'live'
  return <>
    <PageHeader eyebrow="Operations" title="Execution overview" description="Current workflow activity, worker health, and failures that need attention." actions={<Link className="button primary" to="/console/workflows/new">Create workflow</Link>} />
    <div className="metric-grid"><MetricCard label="Active workflows" value={runData.filter((r) => r.status === 'RUNNING').length} detail={`${workflows.data?.length ?? 0} definitions available`} icon={<Workflow />} /><MetricCard label="Running tasks" value={runningTasks} detail={`${queuedTasks} waiting or queued`} icon={<Activity />} /><MetricCard label="Healthy workers" value={`${healthy}/${workerData.length}`} detail={`${workerData.reduce((n, w) => n + Math.max(0, w.maxSlots - w.activeTasks), 0)} execution slots free`} icon={<Server />} /><MetricCard label="Failed executions" value={failed} detail={failed ? 'Investigation recommended' : 'No active failures'} icon={<AlertTriangle />} /></div>
    <div className="dashboard-grid">
      <Panel title="Task throughput" description={sampleMetrics ? 'Clearly labelled sample telemetry for the demo workspace' : 'Historical metrics endpoint not available yet'} className="chart-panel">
        {sampleMetrics ? <ResponsiveContainer width="100%" height={270}><AreaChart data={throughputFixture}><defs><linearGradient id="throughput" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity={.3}/><stop offset="100%" stopColor="var(--brand)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="time" axisLine={false} tickLine={false} stroke="var(--text-3)"/><YAxis axisLine={false} tickLine={false} stroke="var(--text-3)"/><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}/><Area type="monotone" dataKey="tasks" stroke="var(--brand)" fill="url(#throughput)" strokeWidth={2}/></AreaChart></ResponsiveContainer> : <div className="unavailable-chart"><Gauge /><strong>No time-series endpoint</strong><p>Live totals are shown above. Add a metrics history endpoint before drawing trend lines.</p></div>}
      </Panel>
      <Panel title="Worker fleet" description="Capacity reported by connected workers"><div className="worker-summary">{workerData.map((worker) => <div key={worker.id}><span className={`worker-light ${worker.status.toLowerCase()}`} /><div><strong>{worker.name}</strong><small>{worker.capabilities.join(' · ')}</small></div><b>{worker.activeTasks}/{worker.maxSlots}</b></div>)}</div><Link className="panel-link" to="/console/workers">View worker fleet →</Link></Panel>
    </div>
    <Panel title="Recent executions" description="Newest workflow runs from the control plane" action={<Link className="button secondary small" to="/console/executions">View all</Link>}><div className="table-wrap"><table><thead><tr><th>Execution</th><th>Workflow</th><th>Started</th><th>Tasks</th><th>Status</th></tr></thead><tbody>{runData.slice(0, 6).map((run) => { const workflow = workflows.data?.find((w) => w.id === run.workflowDefinitionId); return <tr key={run.id}><td><Link className="mono-link" to={`/console/executions/${run.id}`}>{run.id.slice(0, 8)}</Link></td><td><strong>{workflow?.name ?? run.workflowDefinitionId.slice(0, 8)}</strong></td><td><Clock3 size={14} /> {new Date(run.startedAt ?? run.createdAt).toLocaleString()}</td><td>{run.tasks.filter((t) => t.status === 'SUCCEEDED').length}/{run.tasks.length}</td><td><StatusBadge status={run.status} /></td></tr>})}</tbody></table></div></Panel>
  </>
}
