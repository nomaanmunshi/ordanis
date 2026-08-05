import { useCallback, useEffect, useMemo, useState } from 'react'
import { addEdge, Background, Controls, Handle, MiniMap, Position, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Cpu, Braces, CheckCircle2, Code2, Database, Download, FileBox, Globe2, LayoutGrid, Mail, Play, Plus, Redo2, Save, Trash2, Undo2, Workflow } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import YAML from 'yaml'
import { useCreateWorkflow, useStartRun, useWorkflow } from '../api/hooks'
import type { CreateWorkflowRequest, TaskDefinition } from '../types'

const taskTypes = [
  ['JAVA', Braces], ['HTTP', Globe2], ['DATABASE', Database], ['FILE', FileBox], ['INFERENCE', Cpu], ['NOTIFICATION', Mail],
] as const
const icons: Record<string, typeof Braces> = Object.fromEntries(taskTypes)

interface BuilderData extends TaskDefinition, Record<string, unknown> {
  label: string
}

function BuilderNode({ data, selected }: NodeProps<Node<BuilderData>>) {
  const Icon = icons[data.type] ?? Workflow
  return <div className={`builder-node ${selected ? 'selected' : ''}`}><Handle type="target" position={Position.Left}/><span><Icon size={16}/></span><div><strong>{data.label}</strong><small>{data.type} · {data.handler || 'Handler required'}</small></div><Handle type="source" position={Position.Right}/></div>
}

const nodeTypes = { builder: BuilderNode }
const initialTasks: TaskDefinition[] = [
  { id: 'receive', type: 'FILE', handler: 'receive-document', dependsOn: [], priority: 10, maxAttempts: 3, timeoutSeconds: 60, payload: {} },
  { id: 'process', type: 'JAVA', handler: 'process-document', dependsOn: ['receive'], priority: 5, maxAttempts: 3, timeoutSeconds: 120, payload: {} },
  { id: 'notify', type: 'HTTP', handler: 'notify-user', dependsOn: ['process'], priority: 1, maxAttempts: 5, timeoutSeconds: 30, payload: {} },
]

function tasksToGraph(tasks: TaskDefinition[]) {
  const levels = new Map<string, number>(); const byId = new Map(tasks.map((task) => [task.id, task]))
  const depth = (id: string, seen = new Set<string>()): number => { if (levels.has(id)) return levels.get(id)!; if (seen.has(id)) return 0; seen.add(id); const task = byId.get(id); const level = !task?.dependsOn.length ? 0 : 1 + Math.max(...task.dependsOn.map((parent) => depth(parent, seen))); levels.set(id, level); return level }
  tasks.forEach((task) => depth(task.id))
  const rows = new Map<number, number>()
  const nodes: Node<BuilderData>[] = tasks.map((task) => { const level = levels.get(task.id) ?? 0; const row = rows.get(level) ?? 0; rows.set(level, row + 1); return { id: task.id, type: 'builder', position: { x: level * 270, y: row * 110 + 40 }, data: { ...task, label: task.id } } })
  const edges: Edge[] = tasks.flatMap((task) => task.dependsOn.map((parent) => ({ id: `${parent}-${task.id}`, source: parent, target: task.id })))
  return { nodes, edges }
}

function graphToRequest(name: string, nodes: Node<BuilderData>[], edges: Edge[]): CreateWorkflowRequest {
  return { name, tasks: nodes.map((node) => ({ id: node.id, type: node.data.type, handler: node.data.handler, dependsOn: edges.filter((edge) => edge.target === node.id).map((edge) => edge.source), priority: node.data.priority, maxAttempts: node.data.maxAttempts, timeoutSeconds: node.data.timeoutSeconds, payload: node.data.payload })) }
}

function validateDefinition(definition: CreateWorkflowRequest) {
  const errors: string[] = []
  if (!definition.name.trim()) errors.push('Workflow name is required.')
  if (!definition.tasks.length) errors.push('Add at least one task.')
  const ids = new Set<string>()
  for (const task of definition.tasks) {
    if (!task.id.trim()) errors.push('Every task needs an ID.')
    if (ids.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`)
    ids.add(task.id)
    if (!task.handler.trim()) errors.push(`${task.id}: handler is required.`)
    if (task.timeoutSeconds < 1) errors.push(`${task.id}: timeout must be at least 1 second.`)
  }
  for (const task of definition.tasks) for (const parent of task.dependsOn) if (!ids.has(parent)) errors.push(`${task.id}: missing dependency ${parent}.`)
  const map = new Map(definition.tasks.map((task) => [task.id, task])); const visiting = new Set<string>(); const visited = new Set<string>()
  const visit = (id: string) => { if (visiting.has(id)) { errors.push(`Dependency cycle detected at ${id}.`); return } if (visited.has(id)) return; visiting.add(id); map.get(id)?.dependsOn.forEach(visit); visiting.delete(id); visited.add(id) }
  definition.tasks.forEach((task) => visit(task.id))
  return [...new Set(errors)]
}

export default function WorkflowBuilderPage() {
  const navigate = useNavigate(); const [params] = useSearchParams(); const from = params.get('from'); const imported = params.get('import')
  const source = useWorkflow(from ?? undefined); const create = useCreateWorkflow(); const startRun = useStartRun()
  const [name, setName] = useState('document-analysis')
  const [mode, setMode] = useState<'visual'|'json'|'yaml'>('visual')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [history, setHistory] = useState<{ nodes: Node<BuilderData>[]; edges: Edge[] }[]>([])
  const [future, setFuture] = useState<typeof history>([])
  const [message, setMessage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const initial = tasksToGraph(initialTasks)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BuilderData>>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  useEffect(() => {
    if (!source.data) return
    const graph = tasksToGraph(source.data.tasks)
    setName(source.data.name); setNodes(graph.nodes); setEdges(graph.edges)
  }, [source.data, setEdges, setNodes])
  useEffect(() => { if (imported) setMode('json') }, [imported])

  const definition = useMemo(() => graphToRequest(name, nodes, edges), [name, nodes, edges])
  const errors = useMemo(() => validateDefinition(definition), [definition])
  const selected = nodes.find((node) => node.id === selectedId)

  const snapshot = useCallback(() => { setHistory((items) => [...items.slice(-19), { nodes: structuredClone(nodes), edges: structuredClone(edges) }]); setFuture([]) }, [edges, nodes])
  const connect = useCallback((connection: Connection) => { if (!connection.source || !connection.target || connection.source === connection.target) return; snapshot(); setEdges((items) => addEdge({ ...connection, id: `${connection.source}-${connection.target}` }, items)) }, [setEdges, snapshot])
  const addTask = (type: string) => { snapshot(); const base = type.toLowerCase(); let id = base; let index = 2; while (nodes.some((node) => node.id === id)) id = `${base}-${index++}`; setNodes((items) => [...items, { id, type: 'builder', position: { x: 80 + items.length * 35, y: 80 + items.length * 30 }, data: { id, label: id, type, handler: '', dependsOn: [], priority: 0, maxAttempts: 3, timeoutSeconds: 60, payload: {} } }]); setSelectedId(id) }
  const updateSelected = (patch: Partial<BuilderData>) => setNodes((items) => items.map((node) => node.id === selectedId ? { ...node, data: { ...node.data, ...patch } } : node))
  const renameSelected = (next: string) => { if (!selected || !next.trim() || nodes.some((node) => node.id === next && node.id !== selected.id)) return; snapshot(); setNodes((items) => items.map((node) => node.id === selected.id ? { ...node, id: next, data: { ...node.data, id: next, label: next } } : node)); setEdges((items) => items.map((edge) => ({ ...edge, id: `${edge.source === selected.id ? next : edge.source}-${edge.target === selected.id ? next : edge.target}`, source: edge.source === selected.id ? next : edge.source, target: edge.target === selected.id ? next : edge.target }))); setSelectedId(next) }
  const removeSelected = () => { if (!selectedId) return; snapshot(); setNodes((items) => items.filter((node) => node.id !== selectedId)); setEdges((items) => items.filter((edge) => edge.source !== selectedId && edge.target !== selectedId)); setSelectedId(null) }
  const undo = () => { const previous = history.at(-1); if (!previous) return; setFuture((items) => [{ nodes: structuredClone(nodes), edges: structuredClone(edges) }, ...items]); setHistory((items) => items.slice(0, -1)); setNodes(previous.nodes); setEdges(previous.edges) }
  const redo = () => { const next = future[0]; if (!next) return; setHistory((items) => [...items, { nodes: structuredClone(nodes), edges: structuredClone(edges) }]); setFuture((items) => items.slice(1)); setNodes(next.nodes); setEdges(next.edges) }
  const autoLayout = () => { snapshot(); const graph = tasksToGraph(definition.tasks); setNodes(graph.nodes); setEdges(graph.edges) }
  const switchMode = (next: typeof mode) => { if (next !== 'visual') setCode(next === 'json' ? JSON.stringify(definition, null, 2) : YAML.stringify(definition)); setMode(next) }
  const applyCode = () => { try { const parsed = (mode === 'yaml' ? YAML.parse(code) : JSON.parse(code)) as CreateWorkflowRequest; const found = validateDefinition(parsed); if (found.length) { setMessage(found.join(' ')); return } const graph = tasksToGraph(parsed.tasks); snapshot(); setName(parsed.name); setNodes(graph.nodes); setEdges(graph.edges); setMode('visual'); setMessage('Definition applied to the visual graph.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid definition.') } }
  const save = async (runAfter = false) => { if (errors.length) { setMessage(errors[0]); return } try { const saved = await create.mutateAsync(definition); if (runAfter) { const run = await startRun.mutateAsync({ workflowId: saved.id }); navigate(`/console/executions/${run.id}`) } else navigate(`/console/workflows/${saved.id}`) } catch (error) { setMessage(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Workflow could not be saved.') } }
  const exportDefinition = () => { const blob = new Blob([JSON.stringify(definition, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${name || 'workflow'}.json`; link.click(); URL.revokeObjectURL(url) }

  return <div className="builder-page">
    <div className="builder-top"><Link className="back-link" to="/console/workflows"><ArrowLeft size={15}/>Workflows</Link><div className="builder-title"><input value={name} onChange={(e) => setName(e.target.value)} aria-label="Workflow name"/><span>{from ? 'New version' : 'Draft'} · {nodes.length} tasks</span></div><div className="builder-actions"><button className="icon-button" onClick={undo} disabled={!history.length} title="Undo"><Undo2 size={16}/></button><button className="icon-button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={16}/></button><button className="button secondary small" onClick={exportDefinition}><Download size={15}/>Export</button><button className="button secondary small" onClick={() => save(false)} disabled={create.isPending}><Save size={15}/>Publish</button><button className="button primary small" onClick={() => save(true)} disabled={create.isPending || startRun.isPending}><Play size={15}/>Publish & run</button></div></div>
    <div className="builder-mode"><button className={mode === 'visual' ? 'active' : ''} onClick={() => switchMode('visual')}><Workflow size={15}/>Visual DAG</button><button className={mode === 'yaml' ? 'active' : ''} onClick={() => switchMode('yaml')}><Code2 size={15}/>YAML</button><button className={mode === 'json' ? 'active' : ''} onClick={() => switchMode('json')}><Braces size={15}/>JSON</button><span className={errors.length ? 'validation-bad' : 'validation-good'}>{errors.length ? `${errors.length} validation issue${errors.length > 1 ? 's' : ''}` : <><CheckCircle2 size={14}/>Definition valid</>}</span></div>
    {message && <div className="builder-message" role="status">{message}<button onClick={() => setMessage(null)}>×</button></div>}
    {mode === 'visual' ? <div className="builder-workspace"><aside className="node-palette"><span>Task types</span>{taskTypes.map(([type, Icon]) => <button key={type} onClick={() => addTask(type)}><Icon size={16}/><strong>{type}</strong><Plus size={14}/></button>)}<div className="palette-note">Connect source handles to target handles. Cycles are rejected during validation.</div></aside><div className="builder-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => setSelectedId(node.id)} onPaneClick={() => setSelectedId(null)} fitView minZoom={.3} maxZoom={1.8} snapToGrid snapGrid={[16,16]} proOptions={{ hideAttribution: true }}><Background gap={22} size={1}/><Controls/><MiniMap pannable zoomable nodeColor="#cbb19f"/></ReactFlow><button className="auto-layout" onClick={autoLayout}><LayoutGrid size={15}/>Auto layout</button></div><aside className={`node-inspector ${selected ? 'open' : ''}`}>{selected ? <><div className="inspector-head"><div><span>Task configuration</span><strong>{selected.id}</strong></div><button className="icon-button danger" onClick={removeSelected}><Trash2 size={15}/></button></div><label>Task ID<input value={selected.id} onChange={(e) => renameSelected(e.target.value.replace(/\s+/g,'-').toLowerCase())}/></label><label>Task type<select value={selected.data.type} onChange={(e) => updateSelected({ type: e.target.value })}>{taskTypes.map(([type]) => <option key={type}>{type}</option>)}</select></label><label>Handler<input value={selected.data.handler} onChange={(e) => updateSelected({ handler: e.target.value })} placeholder="handler-name"/></label><div className="form-grid"><label>Priority<input type="number" min="0" value={selected.data.priority} onChange={(e) => updateSelected({ priority: Number(e.target.value) })}/></label><label>Attempts<input type="number" min="1" value={selected.data.maxAttempts} onChange={(e) => updateSelected({ maxAttempts: Number(e.target.value) })}/></label></div><label>Timeout (seconds)<input type="number" min="1" value={selected.data.timeoutSeconds} onChange={(e) => updateSelected({ timeoutSeconds: Number(e.target.value) })}/></label><label>Payload JSON<textarea value={JSON.stringify(selected.data.payload, null, 2)} onChange={(e) => { try { updateSelected({ payload: JSON.parse(e.target.value) }) } catch { /* keep previous valid value */ } }} rows={7}/></label><div className="dependency-list"><span>Dependencies</span>{edges.filter((edge) => edge.target === selected.id).map((edge) => <code key={edge.id}>{edge.source}</code>)}{!edges.some((edge) => edge.target === selected.id) && <small>No dependencies</small>}</div></> : <div className="inspector-empty"><Workflow/><strong>Select a task</strong><p>Configure its handler, retry policy, timeout, and payload.</p></div>}</aside></div> : <div className="code-editor-shell"><div className="code-editor-head"><span>{mode.toUpperCase()} definition</span><button className="button primary small" onClick={applyCode}>Apply definition</button></div><textarea spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-label={`${mode} workflow definition`}/></div>}
  </div>
}
