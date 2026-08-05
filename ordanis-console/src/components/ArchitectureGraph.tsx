import { Background, Controls, Handle, Position, ReactFlow, useNodesState, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Braces, Cpu, Database, FileBox, GitBranch, Network, Server } from 'lucide-react'

interface ArchitectureNodeData extends Record<string, unknown> {
  label: string
  detail: string
  kind: 'control' | 'protocol' | 'worker' | 'storage'
  icon: 'compiler' | 'scheduler' | 'gateway' | 'java' | 'compute' | 'file' | 'database'
}

const icons = {
  compiler: Braces,
  scheduler: GitBranch,
  gateway: Network,
  java: Server,
  compute: Cpu,
  file: FileBox,
  database: Database,
}

function ArchitectureNode({ data }: NodeProps<Node<ArchitectureNodeData>>) {
  const Icon = icons[data.icon]
  return <div className={`architecture-flow-node ${data.kind}`}>
    <Handle type="target" position={Position.Left} />
    <span><Icon size={17} /></span>
    <div><strong>{data.label}</strong><small>{data.detail}</small></div>
    <Handle type="source" position={Position.Right} />
  </div>
}

const nodes: Node<ArchitectureNodeData>[] = [
  { id: 'compiler', type: 'architecture', position: { x: 20, y: 20 }, data: { label: 'Workflow compiler', detail: 'Validation, DAG planning, versioning', kind: 'control', icon: 'compiler' } },
  { id: 'scheduler', type: 'architecture', position: { x: 20, y: 145 }, data: { label: 'Lease scheduler', detail: 'Priority, capacity, retries', kind: 'control', icon: 'scheduler' } },
  { id: 'gateway', type: 'architecture', position: { x: 330, y: 82 }, data: { label: 'Worker gateway', detail: 'gRPC leases, heartbeats, results', kind: 'protocol', icon: 'gateway' } },
  { id: 'java', type: 'architecture', position: { x: 650, y: 0 }, data: { label: 'Java worker', detail: 'General task execution', kind: 'worker', icon: 'java' } },
  { id: 'compute', type: 'architecture', position: { x: 650, y: 115 }, data: { label: 'Compute worker', detail: 'Specialised capability', kind: 'worker', icon: 'compute' } },
  { id: 'file', type: 'architecture', position: { x: 650, y: 230 }, data: { label: 'File worker', detail: 'Streaming file operations', kind: 'worker', icon: 'file' } },
  { id: 'database', type: 'architecture', position: { x: 330, y: 280 }, data: { label: 'PostgreSQL state', detail: 'Runs, leases, attempts, recovery', kind: 'storage', icon: 'database' } },
]

const edges: Edge[] = [
  { id: 'compiler-scheduler', source: 'compiler', target: 'scheduler' },
  { id: 'scheduler-gateway', source: 'scheduler', target: 'gateway', animated: true },
  { id: 'gateway-java', source: 'gateway', target: 'java' },
  { id: 'gateway-compute', source: 'gateway', target: 'compute' },
  { id: 'gateway-file', source: 'gateway', target: 'file' },
  { id: 'scheduler-database', source: 'scheduler', target: 'database' },
  { id: 'gateway-database', source: 'gateway', target: 'database' },
]

const nodeTypes = { architecture: ArchitectureNode }

export function ArchitectureGraph() {
  const [graphNodes, , onNodesChange] = useNodesState<Node<ArchitectureNodeData>>(nodes)
  return <div className="architecture-flow" aria-label="Interactive Ordanis architecture diagram">
    <div className="architecture-flow-head"><div><span className="connection-dot" />Architecture map</div><span>Drag nodes, pan, or zoom</span></div>
    <ReactFlow nodes={graphNodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.55} maxZoom={1.5} nodesConnectable={false} onNodesChange={onNodesChange} zoomOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }}>
      <Background gap={25} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  </div>
}
