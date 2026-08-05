import type { AuditRecord, WorkflowDetail, WorkflowRun, Worker } from '../types'

const now = Date.now()
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString()

export const fixtureWorkflows: WorkflowDetail[] = [
  {
    id: 'b4267a5b-d123-4a93-8a5f-003a648ae701',
    name: 'document-analysis',
    version: 4,
    taskCount: 6,
    createdAt: iso(1320),
    executionLevels: [['upload'], ['scan', 'extract'], ['classify'], ['report'], ['notify']],
    tasks: [
      { id: 'upload', type: 'FILE', handler: 'receive-document', dependsOn: [], priority: 10, maxAttempts: 2, timeoutSeconds: 45, payload: {} },
      { id: 'scan', type: 'JAVA', handler: 'virus-scan', dependsOn: ['upload'], priority: 8, maxAttempts: 3, timeoutSeconds: 60, payload: {} },
      { id: 'extract', type: 'JAVA', handler: 'extract-text', dependsOn: ['upload'], priority: 8, maxAttempts: 3, timeoutSeconds: 120, payload: {} },
      { id: 'classify', type: 'INFERENCE', handler: 'classify-document', dependsOn: ['scan', 'extract'], priority: 6, maxAttempts: 2, timeoutSeconds: 180, payload: { model: 'document-classifier-v2' } },
      { id: 'report', type: 'JAVA', handler: 'generate-report', dependsOn: ['classify'], priority: 4, maxAttempts: 3, timeoutSeconds: 90, payload: {} },
      { id: 'notify', type: 'HTTP', handler: 'notify-user', dependsOn: ['report'], priority: 2, maxAttempts: 5, timeoutSeconds: 30, payload: { method: 'POST' } },
    ],
  },
  {
    id: 'a927b62b-d933-42b3-8dfa-8f3fb9593e0a',
    name: 'transaction-reconciliation',
    version: 2,
    taskCount: 5,
    createdAt: iso(3060),
    executionLevels: [['import'], ['validate', 'dedupe'], ['reconcile'], ['report']],
    tasks: [
      { id: 'import', type: 'FILE', handler: 'import-transactions', dependsOn: [], priority: 10, maxAttempts: 3, timeoutSeconds: 120, payload: {} },
      { id: 'validate', type: 'JAVA', handler: 'validate-transactions', dependsOn: ['import'], priority: 8, maxAttempts: 3, timeoutSeconds: 90, payload: {} },
      { id: 'dedupe', type: 'DATABASE', handler: 'deduplicate-transactions', dependsOn: ['import'], priority: 8, maxAttempts: 3, timeoutSeconds: 90, payload: {} },
      { id: 'reconcile', type: 'JAVA', handler: 'reconcile-ledger', dependsOn: ['validate', 'dedupe'], priority: 6, maxAttempts: 4, timeoutSeconds: 180, payload: {} },
      { id: 'report', type: 'JAVA', handler: 'generate-reconciliation-report', dependsOn: ['reconcile'], priority: 4, maxAttempts: 2, timeoutSeconds: 90, payload: {} },
    ],
  },
  {
    id: 'c63cb456-58e4-4d23-a27e-4a7fc135f811',
    name: 'media-pipeline',
    version: 1,
    taskCount: 5,
    createdAt: iso(6240),
    executionLevels: [['ingest'], ['thumbnail', 'metadata', 'optimize'], ['publish']],
    tasks: [
      { id: 'ingest', type: 'FILE', handler: 'ingest-media', dependsOn: [], priority: 10, maxAttempts: 3, timeoutSeconds: 60, payload: {} },
      { id: 'thumbnail', type: 'JAVA', handler: 'create-thumbnails', dependsOn: ['ingest'], priority: 7, maxAttempts: 3, timeoutSeconds: 120, payload: {} },
      { id: 'metadata', type: 'JAVA', handler: 'extract-metadata', dependsOn: ['ingest'], priority: 7, maxAttempts: 3, timeoutSeconds: 60, payload: {} },
      { id: 'optimize', type: 'JAVA', handler: 'optimize-media', dependsOn: ['ingest'], priority: 7, maxAttempts: 3, timeoutSeconds: 180, payload: {} },
      { id: 'publish', type: 'HTTP', handler: 'publish-asset', dependsOn: ['thumbnail', 'metadata', 'optimize'], priority: 4, maxAttempts: 5, timeoutSeconds: 45, payload: {} },
    ],
  },
]

export const fixtureRuns: WorkflowRun[] = [
  {
    id: '5d8d9678-948f-43a4-b253-af607c58d181',
    workflowDefinitionId: fixtureWorkflows[0].id,
    status: 'RUNNING',
    createdAt: iso(5),
    startedAt: iso(5),
    tasks: [
      { id: 'r1', taskKey: 'upload', type: 'FILE', handler: 'receive-document', status: 'SUCCEEDED', attempt: 1, maxAttempts: 2, progress: 100, resultJson: '{"fileId":"doc-218"}', startedAt: iso(5), finishedAt: iso(4.6) },
      { id: 'r2', taskKey: 'scan', type: 'JAVA', handler: 'virus-scan', status: 'SUCCEEDED', attempt: 1, maxAttempts: 3, progress: 100, resultJson: '{"clean":true}', startedAt: iso(4.5), finishedAt: iso(4.2) },
      { id: 'r3', taskKey: 'extract', type: 'JAVA', handler: 'extract-text', status: 'SUCCEEDED', attempt: 1, maxAttempts: 3, progress: 100, resultJson: '{"pages":18}', startedAt: iso(4.5), finishedAt: iso(3) },
      { id: 'r4', taskKey: 'classify', type: 'INFERENCE', handler: 'classify-document', status: 'RUNNING', attempt: 1, maxAttempts: 2, progress: 68, progressMessage: 'Applying policy model to section 12 of 18', startedAt: iso(2.8) },
      { id: 'r5', taskKey: 'report', type: 'JAVA', handler: 'generate-report', status: 'BLOCKED', attempt: 0, maxAttempts: 3, progress: 0 },
      { id: 'r6', taskKey: 'notify', type: 'HTTP', handler: 'notify-user', status: 'BLOCKED', attempt: 0, maxAttempts: 5, progress: 0 },
    ],
  },
  {
    id: 'b0d87784-e4ad-4e16-b2ce-2d222db65ae2',
    workflowDefinitionId: fixtureWorkflows[1].id,
    status: 'FAILED',
    createdAt: iso(42),
    startedAt: iso(42),
    finishedAt: iso(34),
    tasks: [
      { id: 'f1', taskKey: 'import', type: 'FILE', handler: 'import-transactions', status: 'SUCCEEDED', attempt: 1, maxAttempts: 3, progress: 100, startedAt: iso(42), finishedAt: iso(41) },
      { id: 'f2', taskKey: 'validate', type: 'JAVA', handler: 'validate-transactions', status: 'SUCCEEDED', attempt: 1, maxAttempts: 3, progress: 100, startedAt: iso(41), finishedAt: iso(39) },
      { id: 'f3', taskKey: 'dedupe', type: 'DATABASE', handler: 'deduplicate-transactions', status: 'FAILED', attempt: 3, maxAttempts: 3, progress: 71, errorMessage: 'Unique constraint conflict while committing reconciliation batch', startedAt: iso(39), finishedAt: iso(34) },
      { id: 'f4', taskKey: 'reconcile', type: 'JAVA', handler: 'reconcile-ledger', status: 'BLOCKED', attempt: 0, maxAttempts: 4, progress: 0 },
      { id: 'f5', taskKey: 'report', type: 'JAVA', handler: 'generate-reconciliation-report', status: 'BLOCKED', attempt: 0, maxAttempts: 2, progress: 0 },
    ],
  },
  {
    id: 'c78e2644-91c9-469f-b357-63e0cb3b1584',
    workflowDefinitionId: fixtureWorkflows[2].id,
    status: 'SUCCEEDED',
    createdAt: iso(96),
    startedAt: iso(96),
    finishedAt: iso(89),
    tasks: fixtureWorkflows[2].tasks.map((task, index) => ({
      id: `m${index}`,
      taskKey: task.id,
      type: task.type,
      handler: task.handler,
      status: 'SUCCEEDED' as const,
      attempt: 1,
      maxAttempts: task.maxAttempts,
      progress: 100,
      startedAt: iso(96 - index),
      finishedAt: iso(95 - index),
    })),
  },
]

export const fixtureWorkers: Worker[] = [
  { id: 'worker-a61', name: 'java-worker-eu-1', capabilities: ['JAVA', 'HTTP'], maxSlots: 8, activeTasks: 3, status: 'ONLINE', lastSeenAt: iso(0.08) },
  { id: 'worker-b72', name: 'document-worker-eu-2', capabilities: ['FILE', 'JAVA'], maxSlots: 6, activeTasks: 2, status: 'ONLINE', lastSeenAt: iso(0.15) },
  { id: 'worker-c83', name: 'compute-worker-eu-3', capabilities: ['INFERENCE'], maxSlots: 2, activeTasks: 1, status: 'ONLINE', lastSeenAt: iso(0.05) },
  { id: 'worker-d94', name: 'legacy-worker-eu-3', capabilities: ['DATABASE'], maxSlots: 4, activeTasks: 0, status: 'OFFLINE', lastSeenAt: iso(8) },
]

export const fixtureAudit: AuditRecord[] = [
  { id: 'a1', actor: 'nomaan.munshi', action: 'WORKFLOW_PUBLISHED', resource: 'workflow', resourceId: fixtureWorkflows[0].id, timestamp: iso(27), outcome: 'SUCCESS', correlationId: 'cor_01HZP8S7VJ3' },
  { id: 'a2', actor: 'scheduler', action: 'TASK_RETRY_SCHEDULED', resource: 'task-run', resourceId: 'f3', timestamp: iso(36), outcome: 'SUCCESS', correlationId: 'cor_01HZP7M9XK4' },
  { id: 'a3', actor: 'nomaan.munshi', action: 'EXECUTION_CANCEL_REQUESTED', resource: 'workflow-run', resourceId: 'run-old-12', timestamp: iso(180), outcome: 'SUCCESS', correlationId: 'cor_01HZNY1D7S2' },
]

export const throughputFixture = [
  { time: '09:00', tasks: 38 }, { time: '10:00', tasks: 52 }, { time: '11:00', tasks: 47 },
  { time: '12:00', tasks: 71 }, { time: '13:00', tasks: 64 }, { time: '14:00', tasks: 82 },
  { time: '15:00', tasks: 76 }, { time: '16:00', tasks: 91 },
]
