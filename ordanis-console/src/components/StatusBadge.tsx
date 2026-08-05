import { CheckCircle2, Circle, Clock3, LoaderCircle, OctagonX, RotateCcw, Ban } from 'lucide-react'
import type { TaskStatus, WorkflowStatus } from '../types'

type Status = TaskStatus | WorkflowStatus | 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'DRAINING'

const iconMap = {
  SUCCEEDED: CheckCircle2, RUNNING: LoaderCircle, QUEUED: Clock3, BLOCKED: Circle,
  RETRY_WAIT: RotateCcw, FAILED: OctagonX, TIMED_OUT: OctagonX, CANCELLED: Ban,
  SKIPPED: Circle, ONLINE: CheckCircle2, OFFLINE: Ban, DEGRADED: OctagonX, DRAINING: Clock3,
}

export function StatusBadge({ status }: { status: Status }) {
  const Icon = iconMap[status] ?? Circle
  return <span className={`status status-${status.toLowerCase()}`}><Icon size={13} className={status === 'RUNNING' ? 'spin' : ''} />{status.replace('_', ' ')}</span>
}
