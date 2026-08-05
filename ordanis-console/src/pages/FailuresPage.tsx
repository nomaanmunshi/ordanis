import { AlertTriangle, ArrowRight, Clock3, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRuns, useWorkflows } from '../api/hooks'
import { EmptyState, ErrorState, PageHeader, Panel } from '../components/Page'
import { StatusBadge } from '../components/StatusBadge'

export default function FailuresPage() {
  const runs = useRuns(); const workflows = useWorkflows()
  if (runs.isError) return <ErrorState error={runs.error} retry={() => runs.refetch()} />
  const failures = (runs.data ?? []).flatMap((run) => run.tasks.filter((task) => task.status === 'FAILED' || task.status === 'TIMED_OUT').map((task) => ({ run, task, workflow: workflows.data?.find((workflow) => workflow.id === run.workflowDefinitionId) })))
  return <><PageHeader eyebrow="Investigation" title="Failure centre" description="Failures grouped with their execution context, attempts, and safe operational next steps." />
    {failures.length === 0 ? <EmptyState title="No failed tasks" description="The current dataset contains no tasks requiring investigation." /> : <div className="failure-layout"><div className="failure-list">{failures.map(({ run, task, workflow }) => <article key={task.id}><div className="failure-icon"><AlertTriangle/></div><div className="failure-main"><div><strong>{task.taskKey}</strong><StatusBadge status={task.status}/></div><p>{task.errorMessage ?? 'The worker reported an execution failure without an error message.'}</p><div className="failure-meta"><span>{workflow?.name ?? 'Unknown workflow'}</span><span><RotateCcw size={13}/>Attempt {task.attempt}/{task.maxAttempts}</span><span><Clock3 size={13}/>{new Date(task.finishedAt ?? run.createdAt).toLocaleString()}</span></div></div><Link className="icon-button" to={`/console/executions/${run.id}`}><ArrowRight size={17}/></Link></article>)}</div><Panel title="Operational guidance"><div className="guidance-list"><div><span>1</span><p><strong>Inspect the failed task.</strong> Confirm whether the handler produced an external side effect before retrying.</p></div><div><span>2</span><p><strong>Check idempotency.</strong> The stable task-run ID should protect repeated side effects.</p></div><div><span>3</span><p><strong>Retry carefully.</strong> Automatic task retry and retry-from-step APIs are not implemented in version one.</p></div></div></Panel></div>}
  </>
}
