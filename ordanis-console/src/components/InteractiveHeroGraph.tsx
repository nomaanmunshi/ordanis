import { Background, Controls, Handle, Position, ReactFlow, useNodesState, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Check, FileInput, FileSearch, RefreshCw, ScanSearch, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type DemoStatus = 'waiting' | 'running' | 'done' | 'recovering'

interface DemoNodeData extends Record<string, unknown> {
  label: string
  detail: string
  status: DemoStatus
  icon: string
}

const iconMap = { upload: FileInput, scan: ScanSearch, extract: FileSearch, classify: ShieldCheck, report: FileSearch, notify: Send }

const baseNodes: Node<DemoNodeData>[] = [
  { id: 'upload', type: 'demo', position: { x: 0, y: 105 }, data: { label: 'Upload document', detail: 'Input accepted', status: 'running', icon: 'upload' } },
  { id: 'scan', type: 'demo', position: { x: 245, y: 20 }, data: { label: 'Security scan', detail: 'Waiting', status: 'waiting', icon: 'scan' } },
  { id: 'extract', type: 'demo', position: { x: 245, y: 190 }, data: { label: 'Extract text', detail: 'Waiting', status: 'waiting', icon: 'extract' } },
  { id: 'classify', type: 'demo', position: { x: 505, y: 105 }, data: { label: 'Policy classification', detail: 'Waiting', status: 'waiting', icon: 'classify' } },
  { id: 'report', type: 'demo', position: { x: 760, y: 105 }, data: { label: 'Generate report', detail: 'Waiting', status: 'waiting', icon: 'report' } },
  { id: 'notify', type: 'demo', position: { x: 1015, y: 105 }, data: { label: 'Notify user', detail: 'Waiting', status: 'waiting', icon: 'notify' } },
]

const baseEdges: Edge[] = [
  { id: 'upload-scan', source: 'upload', target: 'scan' },
  { id: 'upload-extract', source: 'upload', target: 'extract' },
  { id: 'scan-classify', source: 'scan', target: 'classify' },
  { id: 'extract-classify', source: 'extract', target: 'classify' },
  { id: 'classify-report', source: 'classify', target: 'report' },
  { id: 'report-notify', source: 'report', target: 'notify' },
]

function DemoNode({ data }: NodeProps<Node<DemoNodeData>>) {
  const Icon = iconMap[data.icon as keyof typeof iconMap] ?? FileSearch
  return <div className={`demo-flow-node ${data.status}`}>
    <Handle type="target" position={Position.Left} />
    <span className="demo-node-icon">{data.status === 'done' ? <Check size={15} /> : data.status === 'recovering' ? <RefreshCw size={15} /> : <Icon size={15} />}</span>
    <div><strong>{data.label}</strong><small>{data.detail}</small></div>
    <Handle type="source" position={Position.Right} />
  </div>
}

const nodeTypes = { demo: DemoNode }
const stageCopy = [
  'Input accepted by the control plane',
  'Independent tasks are running in parallel',
  'A worker stopped sending heartbeats',
  'The lease expired and the task became eligible',
  'A healthy worker resumed execution',
  'The report is being assembled',
  'The workflow completed successfully',
]

function statusFor(id: string, stage: number): { status: DemoStatus; detail: string } {
  if (stage >= 6) return { status: 'done', detail: 'Completed' }
  if (id === 'upload') return stage === 0 ? { status: 'running', detail: 'Receiving input' } : { status: 'done', detail: 'Completed' }
  if (id === 'scan' || id === 'extract') {
    if (stage === 1) return { status: 'running', detail: 'Running in parallel' }
    return stage > 1 ? { status: 'done', detail: 'Completed' } : { status: 'waiting', detail: 'Waiting for input' }
  }
  if (id === 'classify') {
    if (stage === 2) return { status: 'recovering', detail: 'Heartbeat missed' }
    if (stage === 3) return { status: 'recovering', detail: 'Lease expired' }
    if (stage === 4) return { status: 'running', detail: 'Resumed on worker-b' }
    return stage > 4 ? { status: 'done', detail: 'Completed' } : { status: 'waiting', detail: 'Waiting for dependencies' }
  }
  if (id === 'report') return stage === 5 ? { status: 'running', detail: 'Building output' } : stage > 5 ? { status: 'done', detail: 'Completed' } : { status: 'waiting', detail: 'Waiting for classification' }
  return { status: 'waiting', detail: 'Waiting for report' }
}

export function InteractiveHeroGraph() {
  const [stage, setStage] = useState(0)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DemoNodeData>>(baseNodes)

  useEffect(() => {
    const timer = window.setInterval(() => setStage((value) => value >= 6 ? 0 : value + 1), 1900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setNodes((items) => items.map((node) => ({ ...node, data: { ...node.data, ...statusFor(node.id, stage) } })))
  }, [setNodes, stage])

  const edges = useMemo(() => baseEdges.map((edge) => {
    const target = nodes.find((node) => node.id === edge.target)
    return { ...edge, animated: target?.data.status === 'running' || target?.data.status === 'recovering', className: target?.data.status === 'recovering' ? 'recovery-edge' : '' }
  }), [nodes])

  return <div className="interactive-demo-graph">
    <div className="demo-graph-head"><div><span className="connection-dot" />Interactive demo run</div><button onClick={() => setStage(0)}><RefreshCw size={14} />Replay</button></div>
    <div className="demo-graph-status"><strong>{stageCopy[stage]}</strong><span>Drag nodes to inspect the graph layout</span></div>
    <div className="demo-graph-canvas">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView minZoom={0.45} maxZoom={1.45} nodesConnectable={false} zoomOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }}>
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  </div>
}
