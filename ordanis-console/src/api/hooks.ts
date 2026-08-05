import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { CreateWorkflowRequest } from '../types'

export const keys = {
  workflows: ['workflows'] as const,
  workflow: (id: string) => ['workflows', id] as const,
  runs: ['runs'] as const,
  run: (id: string) => ['runs', id] as const,
  workers: ['workers'] as const,
}

export const useWorkflows = () => useQuery({ queryKey: keys.workflows, queryFn: api.workflows })
export const useWorkflow = (id?: string) => useQuery({ queryKey: keys.workflow(id ?? ''), queryFn: () => api.workflow(id!), enabled: Boolean(id) })
export const useRuns = () => useQuery({ queryKey: keys.runs, queryFn: api.runs, refetchInterval: 5000 })
export const useRun = (id?: string) => useQuery({ queryKey: keys.run(id ?? ''), queryFn: () => api.run(id!), enabled: Boolean(id), refetchInterval: (query) => query.state.data?.status === 'RUNNING' ? 1500 : false })
export const useWorkers = () => useQuery({ queryKey: keys.workers, queryFn: api.workers, refetchInterval: 5000 })

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: CreateWorkflowRequest) => api.createWorkflow(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.workflows }) })
}

export function useStartRun() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ workflowId, input }: { workflowId: string; input?: Record<string, unknown> }) => api.startRun(workflowId, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.runs }) })
}

export function useCancelRun() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: api.cancelRun, onSuccess: (run) => { queryClient.setQueryData(keys.run(run.id), run); queryClient.invalidateQueries({ queryKey: keys.runs }) } })
}
