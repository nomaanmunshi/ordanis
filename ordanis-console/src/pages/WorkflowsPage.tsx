import { Copy, FilePlus2, MoreHorizontal, Play, Search, Upload, Workflow as WorkflowIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStartRun, useWorkflows } from '../api/hooks'
import { EmptyState, ErrorState, PageHeader, Panel } from '../components/Page'

export default function WorkflowsPage() {
  const query = useWorkflows(); const startRun = useStartRun(); const navigate = useNavigate(); const [search, setSearch] = useState('')
  const workflows = useMemo(() => (query.data ?? []).filter((workflow) => workflow.name.toLowerCase().includes(search.toLowerCase())), [query.data, search])
  const run = async (id: string) => { const execution = await startRun.mutateAsync({ workflowId: id }); navigate(`/console/executions/${execution.id}`) }
  return <>
    <PageHeader eyebrow="Definitions" title="Workflows" description="Versioned execution graphs compiled and stored by the control plane." actions={<><Link className="button secondary" to="/console/workflows/new?import=1"><Upload size={16}/>Import definition</Link><Link className="button primary" to="/console/workflows/new"><FilePlus2 size={16}/>Create workflow</Link></>} />
    <Panel className="toolbar-panel"><div className="list-toolbar"><label className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workflows" /></label><select aria-label="Workflow state"><option>All definitions</option><option>Latest versions</option></select><select aria-label="Trigger type"><option>All triggers</option><option>Manual</option></select></div></Panel>
    {query.isError ? <ErrorState error={query.error} retry={() => query.refetch()} /> : query.isLoading ? <WorkflowSkeleton /> : workflows.length === 0 ? <EmptyState title={search ? 'No matching workflows' : 'No workflows yet'} description={search ? 'Change the search term or clear the filters.' : 'Create a workflow definition or import JSON to begin.'} action={<Link className="button primary" to="/console/workflows/new">Create workflow</Link>} /> : <div className="workflow-card-grid">{workflows.map((workflow) => <article className="workflow-card" key={workflow.id}><div className="workflow-card-icon"><WorkflowIcon /></div><div className="workflow-card-title"><div><Link to={`/console/workflows/${workflow.id}`}>{workflow.name}</Link><span>Version {workflow.version}</span></div><button className="icon-button"><MoreHorizontal size={17}/></button></div><p>Reliable distributed workflow with {workflow.taskCount} executable tasks.</p><div className="workflow-card-meta"><span><b>{workflow.taskCount}</b> nodes</span><span>Manual trigger</span><span>{new Date(workflow.createdAt).toLocaleDateString()}</span></div><div className="workflow-card-actions"><button className="button primary small" disabled={startRun.isPending} onClick={() => run(workflow.id)}><Play size={14}/>Run now</button><Link className="button secondary small" to={`/console/workflows/${workflow.id}`}>Open</Link><button className="icon-button" aria-label="Duplicate workflow"><Copy size={15}/></button></div></article>)}</div>}
  </>
}

function WorkflowSkeleton() { return <div className="workflow-card-grid">{[1,2,3,4,5,6].map((i) => <div className="workflow-card skeleton" key={i}><i/><i/><i/><i/></div>)}</div> }
