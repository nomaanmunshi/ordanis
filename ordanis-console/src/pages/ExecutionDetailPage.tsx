import { ArrowLeft, Ban, Check, Clock3, Copy, Download, Pause, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TaskRun } from '../types'
import { Link, useParams } from 'react-router-dom'
import { useCancelRun, useRun, useWorkflow } from '../api/hooks'
import { ErrorState, PageHeader, Panel } from '../components/Page'
import { StatusBadge } from '../components/StatusBadge'
import { WorkflowGraph } from '../components/WorkflowGraph'

export default function ExecutionDetailPage() {
  const { runId } = useParams(); const run = useRun(runId); const workflow = useWorkflow(run.data?.workflowDefinitionId); const cancel = useCancelRun(); const [selected, setSelected] = useState<string | null>(null); const [logSearch, setLogSearch] = useState('')
  const selectedTask = run.data?.tasks.find((task) => task.taskKey === selected) ?? run.data?.tasks.find((task) => task.status === 'RUNNING' || task.status === 'FAILED') ?? run.data?.tasks[0]
  const logs = useMemo(() => selectedTask ? buildLogs(selectedTask).filter((line) => line.message.toLowerCase().includes(logSearch.toLowerCase())) : [], [selectedTask, logSearch])
  if (run.isLoading) return <div className="detail-skeleton" />
  if (run.isError || !run.data) return <ErrorState error={run.error} retry={() => run.refetch()} />
  const started = new Date(run.data.startedAt ?? run.data.createdAt); const end = run.data.finishedAt ? new Date(run.data.finishedAt) : new Date(); const elapsed = Math.max(0, Math.round((end.getTime() - started.getTime()) / 1000))
  return <><Link className="back-link" to="/console/executions"><ArrowLeft size={15}/>Executions</Link>
    <PageHeader eyebrow={workflow.data?.name ?? 'Workflow execution'} title={run.data.id.slice(0, 18)} description={`Version ${workflow.data?.version ?? '?'} · Started ${started.toLocaleString()}`} actions={<><button className="button secondary" onClick={() => navigator.clipboard.writeText(run.data.id)}><Copy size={15}/>Copy ID</button><button className="button secondary" disabled title="Pause is not supported by the backend"><Pause size={15}/>Pause</button>{run.data.status === 'RUNNING' && <button className="button danger" onClick={() => confirm('Cancel this execution? Running tasks receive a cancellation request.') && cancel.mutate(run.data.id)}><Ban size={15}/>Cancel</button>}</>} />
    <div className="execution-summary"><div><span>Status</span><StatusBadge status={run.data.status}/></div><div><span>Elapsed</span><strong className="mono">{elapsed}s</strong></div><div><span>Completed</span><strong>{run.data.tasks.filter((t) => t.status === 'SUCCEEDED').length}/{run.data.tasks.length}</strong></div><div><span>Retries</span><strong>{run.data.tasks.reduce((n, task) => n + Math.max(0, task.attempt - 1), 0)}</strong></div><div className="live-state"><i className={run.data.status === 'RUNNING' ? 'online' : ''}/><span>{run.data.status === 'RUNNING' ? 'Polling every 1.5s' : 'Execution finished'}</span></div></div>
    <div className="execution-layout"><Panel title="Live execution graph" description="Select a task below to inspect runtime details" className="execution-graph"><WorkflowGraph tasks={workflow.data?.tasks ?? run.data.tasks.map((task) => ({ id: task.taskKey, type: task.type, handler: task.handler, dependsOn: [], priority: 0, maxAttempts: task.maxAttempts, timeoutSeconds: 60, payload: {} }))} runs={run.data.tasks} height={470}/><div className="task-strip">{run.data.tasks.map((task) => <button key={task.id} className={selectedTask?.id === task.id ? 'active' : ''} onClick={() => setSelected(task.taskKey)}><StatusBadge status={task.status}/><strong>{task.taskKey}</strong><small>{task.progress}%</small></button>)}</div></Panel>
      <aside className="task-runtime-panel"><div className="runtime-head"><span>Task inspector</span><StatusBadge status={selectedTask?.status ?? 'BLOCKED'}/></div>{selectedTask && <><h2>{selectedTask.taskKey}</h2><p>{selectedTask.handler}</p><dl><div><dt>Task run ID</dt><dd className="mono">{selectedTask.id.slice(0, 14)}</dd></div><div><dt>Attempt</dt><dd>{selectedTask.attempt} of {selectedTask.maxAttempts}</dd></div><div><dt>Progress</dt><dd>{selectedTask.progress}%</dd></div><div><dt>Started</dt><dd>{selectedTask.startedAt ? new Date(selectedTask.startedAt).toLocaleTimeString() : 'Waiting'}</dd></div></dl>{selectedTask.errorMessage && <div className="runtime-error"><strong>Execution error</strong><p>{selectedTask.errorMessage}</p></div>}<div className="json-preview"><span>Result</span><pre>{selectedTask.resultJson ? formatJson(selectedTask.resultJson) : 'No result has been recorded.'}</pre></div></>}</aside></div>
    <Panel title="Task logs" description="The current backend does not persist worker log streams; these lines are reconstructed from task state." action={<div className="log-actions"><label><Search size={15}/><input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="Search logs"/></label><button className="icon-button" title="Download unavailable until log persistence exists"><Download size={15}/></button></div>}><div className="log-viewer">{logs.map((line, index) => <div key={index} className={`log-line ${line.level.toLowerCase()}`}><time>{line.time}</time><span>{line.level}</span><code>{line.message}</code></div>)}</div></Panel>
  </>
}

function formatJson(value: string) { try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value } }
function buildLogs(task: TaskRun) {
  const time = (offset: number) => new Date((task.startedAt ? new Date(task.startedAt).getTime() : Date.now()) + offset).toLocaleTimeString()
  const lines = [{ time: time(0), level: 'INFO', message: `Task ${task.taskKey} entered ${task.status}` }, { time: time(350), level: 'INFO', message: `Handler ${task.handler} · attempt ${task.attempt}/${task.maxAttempts}` }]
  if (task.progressMessage) lines.push({ time: time(800), level: 'INFO', message: task.progressMessage })
  if (task.errorMessage) lines.push({ time: time(1200), level: 'ERROR', message: task.errorMessage })
  if (task.status === 'SUCCEEDED') lines.push({ time: time(1500), level: 'INFO', message: 'Task result acknowledged by control plane' })
  return lines
}
