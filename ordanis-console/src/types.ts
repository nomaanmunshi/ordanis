export type TaskStatus =
  | 'BLOCKED' | 'QUEUED' | 'RUNNING' | 'RETRY_WAIT' | 'SUCCEEDED'
  | 'FAILED' | 'TIMED_OUT' | 'CANCELLED' | 'SKIPPED'

export type WorkflowStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'

export interface TaskDefinition {
  id: string
  type: string
  handler: string
  dependsOn: string[]
  priority: number
  maxAttempts: number
  timeoutSeconds: number
  payload: Record<string, unknown>
  executionLevel?: number
}

export interface WorkflowSummary {
  id: string
  name: string
  version: number
  taskCount: number
  createdAt: string
}

export interface WorkflowDetail extends WorkflowSummary {
  tasks: TaskDefinition[]
  executionLevels: string[][]
}

export interface CreateWorkflowRequest {
  name: string
  tasks: Omit<TaskDefinition, 'executionLevel'>[]
}

export interface TaskRun {
  id: string
  taskKey: string
  type: string
  handler: string
  status: TaskStatus
  attempt: number
  maxAttempts: number
  progress: number
  progressMessage?: string | null
  resultJson?: string | null
  errorMessage?: string | null
  startedAt?: string | null
  finishedAt?: string | null
}

export interface WorkflowRun {
  id: string
  workflowDefinitionId: string
  status: WorkflowStatus
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  tasks: TaskRun[]
}

export interface Worker {
  id: string
  name: string
  capabilities: string[]
  maxSlots: number
  activeTasks: number
  status: string
  lastSeenAt: string
}

export interface ApiErrorShape {
  code?: string
  message: string
  details?: string[]
  status?: number
  correlationId?: string
}

export interface AuditRecord {
  id: string
  actor: string
  action: string
  resource: string
  resourceId: string
  timestamp: string
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED'
  correlationId: string
}
