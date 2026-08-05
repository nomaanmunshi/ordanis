# Frontend architecture

The console is a React and TypeScript application with a feature-oriented but intentionally compact structure.

## Main choices

- Vite and strict TypeScript
- React Router for public and authenticated-style application routes
- TanStack Query for server state and conservative polling
- React Flow for workflow and execution DAGs
- Recharts only when historical fixture data is explicitly labelled
- Framer Motion for restrained marketing motion
- Tailwind available for utility composition; the visual system is centralized in `styles.css`

## Backend integration

All network traffic passes through `src/api/client.ts`. Components do not call `fetch` directly. Query keys and mutation invalidation live in `src/api/hooks.ts`.

The backend currently provides polling, not SSE or WebSocket events. Running executions are refreshed every 1.5 seconds. Worker and list pages refresh every 5 seconds. This is honest and replaceable: a future live-event adapter can reconcile events into the same query cache.

## Fixture boundary

`VITE_DATA_MODE=showcase` combines live backend records with the sample records in `src/data/fixtures.ts`. A permanent banner labels the sample overlay. Docker uses showcase mode so a recruiter does not open an empty dashboard. `VITE_DATA_MODE=live` remains available for backend-only operation.

## Workflow builder

The builder supports:

- Visual DAG editing
- Validated connections
- Task palette and contextual inspector
- Rename, duplicate-safe IDs, delete, undo, redo, and auto-layout
- JSON and YAML import/edit modes
- Cycle, duplicate-ID, missing-handler, missing-dependency, and timeout validation
- Publish and publish-and-run through the real API adapter

## Unsupported controls

Pause, drain-worker, schedules, secrets, persistent audit logs, and log download remain disabled or documented because no backend contract exists. This prevents a polished UI from lying about system behaviour.
