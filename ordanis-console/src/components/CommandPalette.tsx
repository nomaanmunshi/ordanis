import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command, FilePlus2, Gauge, Search, Server, Workflow, X } from 'lucide-react'

const commands = [
  { label: 'Open overview', path: '/console', icon: Gauge },
  { label: 'Create workflow', path: '/console/workflows/new', icon: FilePlus2 },
  { label: 'Browse workflows', path: '/console/workflows', icon: Workflow },
  { label: 'Open executions', path: '/console/executions', icon: Command },
  { label: 'Inspect workers', path: '/console/workers', icon: Server },
  { label: 'Open failure centre', path: '/console/failures', icon: X },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const filtered = useMemo(() => commands.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query])

  useEffect(() => { if (open) setQuery('') }, [open])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
    <div className="command-search"><Search size={17} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands…" /><kbd>ESC</kbd></div>
    <div className="command-results">{filtered.map(({ label, path, icon: Icon }) => <button key={path} onClick={() => { navigate(path); onClose() }}><Icon size={17} /><span>{label}</span><small>Open</small></button>)}</div>
  </div></div>
}
