# Ordanis

**A distributed workflow and execution platform by Nomaan Munshi.**

Ordanis combines a workflow compiler, durable execution state, a distributed task scheduler, a Java worker runtime, and a full React operations console. It is designed around the parts that matter in real backend systems: dependency graphs, leases, retries, worker loss, idempotency, cancellation, and observable execution state.

> Ordanis provides at-least-once task delivery and supports idempotent handlers and compensation for safe recovery.

## Product surfaces

- Premium public product website
- Responsive engineering console
- Visual workflow builder with JSON and YAML modes
- Live execution graph with polling-based updates
- Worker health and capability dashboard
- Failure investigation centre
- Clearly labelled sample records for a recruiter-ready first launch

## Repository

```text
ordanis-engine          pure Java DAG compiler and state rules
ordanis-protocol        gRPC worker contract
ordanis-server          REST control plane, scheduler, persistence
ordanis-worker-sdk      reusable Java worker runtime
ordanis-example-worker  sample worker and handlers
ordanis-console         React + TypeScript product website and console
```

## Start the full stack

```bash
docker compose up --build
```

Open:

- Product and console: `http://localhost:3000`
- REST API: `http://localhost:8080/api`
- Health: `http://localhost:8080/actuator/health`
- gRPC worker gateway: `localhost:9090`

## Local development

Backend:

```bash
./gradlew clean test
./gradlew :ordanis-server:bootRun
```

Frontend:

```bash
cd ordanis-console
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

## Console data modes

The console never silently presents mock data as production data.

```bash
# Real Java backend
VITE_DATA_MODE=live

# Live records plus clearly labelled sample records
VITE_DATA_MODE=showcase

# Sample records only for frontend development
VITE_DATA_MODE=fixture
```

Docker builds the console in `showcase` mode. It combines real backend records with a visible sample overlay so the first launch is informative without presenting sample values as benchmarks. Set `VITE_DATA_MODE=live` for backend-only data.

GitHub profile: `https://github.com/nomaanmunshi`

## REST API

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

## Core execution behaviour

- DAG validation, cycle detection, topological ordering, and concurrency levels
- Versioned workflow definitions
- PostgreSQL durable workflow and task state
- Atomic leasing with `FOR UPDATE SKIP LOCKED`
- Worker capability matching and server-enforced slot capacity
- Lease tokens and stale-worker update rejection
- Heartbeats, progress, cooperative cancellation, and local timeouts
- Retry backoff and recovery after worker loss
- Dependency-result propagation
- Stable task-run IDs for handler idempotency

## Frontend route map

```text
/                                  public product website
/console                           operations overview
/console/workflows                 workflow definitions
/console/workflows/new             visual workflow builder
/console/workflows/:workflowId     workflow detail and compiled DAG
/console/executions                execution list
/console/executions/:runId         live execution inspection
/console/workers                   worker fleet
/console/failures                  failure centre
/console/schedules                 honest capability boundary
/console/audit                     audit viewer / capability boundary
/console/credentials               secure capability boundary
/console/settings                  runtime profile
```

## Testing

```bash
./gradlew clean test
cd ordanis-console
npm test
npm run build
npm run test:e2e
```

The backend integration test requires Docker through Testcontainers. Playwright installs its browser separately with `npx playwright install`.

## Deliberate limitations

Authentication, tenants, schedules, persisted audit logs, secret storage, retry-from-step, and worker log streaming are not implemented in the backend yet. The console does not fabricate those capabilities. Their pages document the exact backend contract required before controls should be enabled.

See `docs/architecture.md`, `docs/frontend.md`, `docs/missing-capabilities.md`, and `docs/verification.md`.
