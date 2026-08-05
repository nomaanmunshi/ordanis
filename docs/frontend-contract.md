# Frontend contract

The React console uses a small typed adapter in `ordanis-console/src/api/client.ts`. Components do not call `fetch` directly.

## Connected endpoints

```text
GET  /api/workflows
POST /api/workflows
GET  /api/workflows/{workflowId}
GET  /api/runs
POST /api/workflows/{workflowId}/runs
GET  /api/runs/{runId}
POST /api/runs/{runId}/cancel
GET  /api/workers
```

## Current live-update strategy

`GET /api/runs/{runId}` returns workflow state plus task state, attempts, progress, messages, errors, outputs, worker assignment, and timestamps. The execution page polls this authoritative endpoint while a run is active.

SSE or WebSocket delivery can be added later without changing execution semantics. A future event stream should carry state-change notifications, while REST remains the source used for reconciliation after reconnects.

## Data honesty

The console supports two explicit modes:

- `VITE_DATA_MODE=live`: only real backend data is shown.
- `VITE_DATA_MODE=showcase`: live backend records are combined with clearly labelled sample records.
- `VITE_DATA_MODE=fixture`: sample records are shown without calling the backend.

Unsupported operations are disabled or documented. The frontend does not simulate schedules, secret persistence, worker draining, retry-from-step, durable audit records, or streaming logs.

## Error handling

The adapter normalises HTTP errors and preserves server messages and correlation IDs when available. Mutations are not automatically retried. Safe reads use conservative retry behaviour through TanStack Query.
