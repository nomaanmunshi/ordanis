import type { ApiErrorShape, CreateWorkflowRequest, WorkflowDetail, WorkflowRun, WorkflowSummary, Worker } from '../types'
import { fixtureRuns, fixtureWorkers, fixtureWorkflows } from '../data/fixtures'

export type DataMode = 'live' | 'fixture' | 'showcase'
export const dataMode = (import.meta.env.VITE_DATA_MODE ?? 'showcase') as DataMode
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

let localWorkflows = [...fixtureWorkflows]
let localRuns = [...fixtureRuns]

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const isFixtureWorkflow = (id: string) => localWorkflows.some((workflow) => workflow.id === id)
const isFixtureRun = (id: string) => localRuns.some((run) => run.id === id)
const mergeById = <T extends { id: string }>(live: T[], sample: T[]) => [...live, ...sample.filter((item) => !live.some((liveItem) => liveItem.id === item.id))]

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    signal: init?.signal,
  })
  if (!response.ok) {
    let body: Partial<ApiErrorShape> = {}
    try { body = await response.json() as Partial<ApiErrorShape> } catch { /* response did not contain JSON */ }
    const error: ApiErrorShape = {
      message: body.message ?? `Request failed with status ${response.status}`,
      code: body.code,
      details: body.details,
      status: response.status,
      correlationId: response.headers.get('X-Correlation-Id') ?? undefined,
    }
    throw error
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

async function showcaseList<T extends { id: string }>(path: string, samples: T[]): Promise<T[]> {
  try { return mergeById(await request<T[]>(path), structuredClone(samples)) }
  catch { return structuredClone(samples) }
}

function sampleWorkflowSummary(workflow: WorkflowDetail): WorkflowSummary {
  const { tasks: _tasks, executionLevels: _levels, ...summary } = workflow
  return summary
}

export const api = {
  async workflows(): Promise<WorkflowSummary[]> {
    if (dataMode === 'fixture') { await delay(); return localWorkflows.map(sampleWorkflowSummary) }
    if (dataMode === 'showcase') return showcaseList('/workflows', localWorkflows.map(sampleWorkflowSummary))
    return request('/workflows')
  },
  async workflow(id: string): Promise<WorkflowDetail> {
    if (dataMode !== 'live' && isFixtureWorkflow(id)) {
      await delay()
      return structuredClone(localWorkflows.find((workflow) => workflow.id === id)!)
    }
    return request(`/workflows/${id}`)
  },
  async createWorkflow(input: CreateWorkflowRequest): Promise<{ id: string; name: string; version: number; executionLevels: string[][]; createdAt: string }> {
    if (dataMode === 'fixture') {
      await delay(260)
      const version = Math.max(0, ...localWorkflows.filter((workflow) => workflow.name === input.name).map((workflow) => workflow.version)) + 1
      const levels = compileLevels(input.tasks)
      const created = { id: crypto.randomUUID(), name: input.name, version, taskCount: input.tasks.length, tasks: input.tasks, executionLevels: levels, createdAt: new Date().toISOString() }
      localWorkflows = [created, ...localWorkflows]
      return created
    }
    return request('/workflows', { method: 'POST', body: JSON.stringify(input) })
  },
  async runs(): Promise<WorkflowRun[]> {
    if (dataMode === 'fixture') { await delay(); return structuredClone(localRuns) }
    if (dataMode === 'showcase') return showcaseList('/runs', localRuns)
    return request('/runs')
  },
  async run(id: string): Promise<WorkflowRun> {
    if (dataMode !== 'live' && isFixtureRun(id)) {
      await delay(120)
      return structuredClone(localRuns.find((run) => run.id === id)!)
    }
    return request(`/runs/${id}`)
  },
  async startRun(workflowId: string, input: Record<string, unknown> = {}): Promise<WorkflowRun> {
    if (dataMode !== 'live' && isFixtureWorkflow(workflowId)) {
      await delay(260)
      const workflow = localWorkflows.find((item) => item.id === workflowId)!
      const run: WorkflowRun = {
        id: crypto.randomUUID(), workflowDefinitionId: workflowId, status: 'RUNNING', createdAt: new Date().toISOString(), startedAt: new Date().toISOString(),
        tasks: workflow.tasks.map((task) => ({ id: crypto.randomUUID(), taskKey: task.id, type: task.type, handler: task.handler, status: task.dependsOn.length ? 'BLOCKED' : 'QUEUED', attempt: 0, maxAttempts: task.maxAttempts, progress: 0 })),
      }
      localRuns = [run, ...localRuns]
      return run
    }
    return request(`/workflows/${workflowId}/runs`, { method: 'POST', body: JSON.stringify({ input }) })
  },
  async cancelRun(id: string): Promise<WorkflowRun> {
    if (dataMode !== 'live' && isFixtureRun(id)) {
      await delay(180)
      const index = localRuns.findIndex((run) => run.id === id)
      localRuns[index] = { ...localRuns[index], status: 'CANCELLED', finishedAt: new Date().toISOString(), tasks: localRuns[index].tasks.map((task) => task.status === 'SUCCEEDED' ? task : { ...task, status: 'CANCELLED' }) }
      return structuredClone(localRuns[index])
    }
    return request(`/runs/${id}/cancel`, { method: 'POST' })
  },
  async workers(): Promise<Worker[]> {
    if (dataMode === 'fixture') { await delay(); return structuredClone(fixtureWorkers) }
    if (dataMode === 'showcase') return showcaseList('/workers', fixtureWorkers)
    return request('/workers')
  },
}

function compileLevels(tasks: CreateWorkflowRequest['tasks']): string[][] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const level = new Map<string, number>()
  const visit = (id: string, stack: Set<string>): number => {
    if (level.has(id)) return level.get(id)!
    if (stack.has(id)) throw { message: 'This workflow contains a dependency cycle', code: 'INVALID_WORKFLOW' }
    const task = byId.get(id)
    if (!task) throw { message: `Missing task: ${id}`, code: 'INVALID_WORKFLOW' }
    stack.add(id)
    const value = task.dependsOn.length ? 1 + Math.max(...task.dependsOn.map((parent) => visit(parent, stack))) : 0
    stack.delete(id)
    level.set(id, value)
    return value
  }
  tasks.forEach((task) => visit(task.id, new Set()))
  const result: string[][] = []
  for (const task of tasks) (result[level.get(task.id)!] ??= []).push(task.id)
  return result
}
