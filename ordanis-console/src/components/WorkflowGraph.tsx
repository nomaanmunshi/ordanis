import { Background, Controls, Handle, Position, ReactFlow, useNodesState, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Braces, Cpu, Database, FileBox, Globe2, Mail, Timer, Workflow } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { TaskDefinition, TaskRun } from '../types'
import { StatusBadge } from './StatusBadge'

const icons: Record<string, typeof Braces> = { JAVA: Braces, HTTP: Globe2, DATABASE: Database, FILE: FileBox, INFERENCE: Cpu, NOTIFICATION: Mail, DELAY: Timer }

type GraphNodeData = Record<string, unknown> & { label: string; type: string; handler: string; status?: TaskRun['status']; progress?: number; compact?: boolean }

function TaskNode({ data, selected }: NodeProps<Node<GraphNodeData>>) {
  const Icon = icons[data.type] ?? Workflow
  return <div className={`flow-node ${selected ? 'selected' : ''} ${data.status ? `node-${data.status.toLowerCase()}` : ''}`}>
    <Handle type="target" position={Position.Left} />
    <div className="flow-icon"><Icon size={16} /></div>
    <div className="flow-copy"><strong>{data.label}</strong><span>{data.type} · {data.handler}</span>{data.status && <StatusBadge status={data.status} />}</div>
    {data.status === 'RUNNING' && <div className="node-progress"><i style={{ width: `${data.progress ?? 0}%` }} /></div>}
    <Handle type="source" position={Position.Right} />
  </div>
}

const nodeTypes = { task: TaskNode }

export function toGraph(tasks: TaskDefinition[], runs?: TaskRun[]) {
  const runByKey = new Map(runs?.map((run) => [run.taskKey, run]) ?? [])
  const levels = new Map<string, number>()
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const depth = (id: string): number => {
    if (levels.has(id)) return levels.get(id)!
    const task = byId.get(id)
    const value = !task?.dependsOn.length ? 0 : 1 + Math.max(...task.dependsOn.map(depth))
    levels.set(id, value)
    return value
  }
  tasks.forEach((task) => depth(task.id))
  const positions = new Map<number, number>()
  const nodes: Node<GraphNodeData>[] = tasks.map((task) => {
    const level = levels.get(task.id) ?? 0
    const row = positions.get(level) ?? 0
    positions.set(level, row + 1)
    const run = runByKey.get(task.id)
    return { id: task.id, type: 'task', position: { x: level * 260, y: row * 122 }, data: { label: task.id, type: task.type, handler: task.handler, status: run?.status, progress: run?.progress } }
  })
  const edges: Edge[] = tasks.flatMap((task) => task.dependsOn.map((parent) => ({ id: `${parent}-${task.id}`, source: parent, target: task.id, animated: runByKey.get(task.id)?.status === 'RUNNING', style: { strokeWidth: 1.6 } })))
  return { nodes, edges }
}

export function WorkflowGraph({ tasks, runs, height = 440, fitView = true }: { tasks: TaskDefinition[]; runs?: TaskRun[]; height?: number; fitView?: boolean }) {
  const graph = useMemo(() => toGraph(tasks, runs), [runs, tasks])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>(graph.nodes)

  useEffect(() => {
    setNodes((current) => graph.nodes.map((next) => {
      const existing = current.find((node) => node.id === next.id)
      return existing ? { ...next, position: existing.position } : next
    }))
  }, [graph.nodes, setNodes])

  return <div className="graph-shell" style={{ height }}><ReactFlow nodes={nodes} edges={graph.edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView={fitView} minZoom={0.35} maxZoom={1.6} nodesDraggable nodesConnectable={false} panOnScroll proOptions={{ hideAttribution: true }}><Background gap={22} size={1} /><Controls showInteractive={false} /></ReactFlow></div>
}
