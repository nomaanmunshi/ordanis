# Ordanis

**A distributed workflow and execution platform built by Nomaan Munshi.**

Ordanis helps developers run long, multi-step jobs reliably across multiple computers.

Instead of writing one large program and hoping every step succeeds, developers describe the work as a workflow. Ordanis then decides:

* which task should run first
* which tasks can run at the same time
* which worker should receive each task
* what should happen when something fails
* when a failed task should be tried again
* how progress should be stored and displayed

---

## What does Ordanis actually do?

Imagine an application that processes uploaded documents.

The process may look like this:

```text
Upload document
      ↓
Check the file for viruses
      ↓
Extract the text
      ↓
Classify the document using AI
      ↓
Generate a PDF report
      ↓
Store the result
      ↓
Notify the user
```

Each box is a separate task.

Without a workflow platform, developers must manually manage:

* the order of the tasks
* failed tasks
* repeated requests
* crashed servers
* timeouts
* task status
* worker availability
* recovery after an interruption

Ordanis handles this coordination.

It is not the application that scans files, runs AI models or sends emails. It is the platform that makes sure those operations happen in the correct order and are completed reliably.

---

## A simple real-world comparison

Ordanis works a little like a delivery control centre.

A delivery company has:

* packages that must be delivered
* drivers who can perform the work
* routes that define the correct order
* a control centre that assigns jobs
* tracking information that records progress
* recovery procedures when a driver becomes unavailable

In Ordanis:

| Delivery company              | Ordanis                   |
| ----------------------------- | ------------------------- |
| Package                       | Task                      |
| Delivery route                | Workflow                  |
| Driver                        | Worker                    |
| Control centre                | Ordanis server            |
| Tracking system               | Execution state           |
| Reassigning a failed delivery | Retry and worker recovery |

The server coordinates the work, while worker applications perform the actual tasks.

---

## Why would a company need this?

Many real applications perform work that is too important or too long to run inside one normal web request.

Examples include:

### Document processing

```text
Upload → Scan → Extract → Analyse → Store → Notify
```

### Payment processing

```text
Receive payment → Validate → Check fraud → Update ledger → Send confirmation
```

### Media processing

```text
Upload video → Validate → Convert → Generate thumbnail → Publish
```

### Data pipelines

```text
Import data → Clean data → Transform data → Store results → Generate report
```

### AI applications

```text
Receive file → Extract content → Create embeddings → Run model → Save response
```

If one step fails, the whole process should not disappear or restart blindly.

Ordanis stores the state of the workflow and can continue safely.

---

## How Ordanis works

A workflow moves through the following process.

### 1. A developer defines a workflow

The developer describes the tasks and their dependencies.

For example:

```text
A: Upload document
B: Scan document
C: Extract text
D: Run classification
E: Generate report
```

The dependencies may be:

```text
A → B
B → C
C → D
D → E
```

This means task `C` cannot begin until task `B` has finished successfully.

Workflows can be created using:

* the visual workflow builder
* JSON
* YAML
* the REST API

---

### 2. Ordanis validates the workflow

Before running anything, Ordanis checks that the workflow is valid.

It verifies that:

* every dependency refers to a real task
* the workflow does not contain a circular dependency
* tasks can be placed in a valid execution order
* tasks that do not depend on each other may run in parallel

For example, this workflow is invalid:

```text
A depends on B
B depends on C
C depends on A
```

No task can begin because every task is waiting for another one.

Ordanis detects this problem before execution starts.

---

### 3. A workflow run is created

When a developer starts a workflow, Ordanis creates a new run.

The run contains:

* the workflow version being used
* the current workflow status
* the status of every task
* retry information
* timestamps
* task results
* worker assignment information

The state is stored in PostgreSQL, so it is not lost if the server restarts.

---

### 4. The scheduler finds ready tasks

The scheduler continuously looks for tasks that are ready to run.

A task is ready when:

* all required previous tasks have succeeded
* the task is not already running
* the task has not been cancelled
* its retry delay has finished
* a suitable worker is available

Tasks that do not depend on each other can run at the same time.

For example:

```text
          ┌→ Resize image ──┐
Upload ───┤                 ├→ Publish
          └→ Scan image ────┘
```

`Resize image` and `Scan image` may run in parallel.

---

### 5. A worker receives the task

Workers are separate Java applications that perform the actual work.

A worker may support capabilities such as:

```text
PDF_GENERATION
EMAIL
FILE_PROCESSING
AI_CLASSIFICATION
HTTP_REQUEST
```

Ordanis assigns a task only to a worker that supports the required capability.

A worker also has a limited number of execution slots. This prevents one worker from receiving more tasks than it can safely process.

---

### 6. The task is leased to the worker

Ordanis does not permanently give ownership of a task to a worker.

Instead, it gives the worker a temporary lease.

The lease says:

> You may work on this task for a limited period, provided that you continue reporting that you are alive.

The worker sends regular heartbeats while processing the task.

If the heartbeats stop, Ordanis assumes that the worker may have crashed, disconnected or become unavailable.

The lease eventually expires, allowing the task to be recovered.

---

### 7. The worker reports progress

While working, the worker may report:

* task started
* percentage completed
* current progress message
* task succeeded
* task failed
* task cancelled

The operations console displays this information so developers can inspect active and completed executions.

---

### 8. Ordanis handles failures

A task may fail because of:

* a temporary network problem
* an unavailable external service
* a worker crash
* invalid input
* a timeout
* an application error

Depending on the workflow configuration, Ordanis may try the task again.

Retries can use increasing delays.

For example:

```text
First retry:   wait 5 seconds
Second retry:  wait 15 seconds
Third retry:   wait 45 seconds
```

This prevents the system from repeatedly attacking an unavailable service without waiting.

---

### 9. The workflow continues

When a task succeeds, Ordanis checks which tasks are now unblocked.

The workflow continues until it reaches one of these outcomes:

```text
SUCCEEDED
FAILED
CANCELLED
```

All state remains available for inspection.

---

## What happens if a worker crashes?

Suppose a worker receives a task and then suddenly shuts down.

Without recovery logic, the task could remain stuck forever.

Ordanis prevents this using:

* temporary task leases
* heartbeat messages
* lease expiration
* retry rules
* stale-worker protection

After the lease expires, Ordanis may make the task available again.

A different worker can then continue the work.

---

## What does “at-least-once delivery” mean?

Ordanis provides **at-least-once task delivery**.

This means Ordanis tries to ensure that a task is executed, but under certain failure conditions the same task may be delivered more than once.

For example:

1. A worker completes a payment task.
2. The worker crashes before confirming completion.
3. Ordanis does not know whether the task finished.
4. The task may be sent to another worker.

For this reason, task handlers should be idempotent.

---

## What is idempotency?

An idempotent task can safely receive the same request more than once without creating an incorrect result.

For example, a payment handler should not charge a customer twice simply because the same task was delivered twice.

Ordanis provides stable task-run identifiers that handlers can use to detect duplicate processing.

```text
Task-run ID: 7db4d5f2...
```

A handler can store this identifier and ignore repeated requests that have already been completed.

---

## What is compensation?

Some completed actions cannot simply be undone automatically.

For example:

```text
Reserve inventory
      ↓
Charge customer
      ↓
Create shipment
```

If shipment creation fails after the customer has been charged, the system may need to perform a compensating action, such as:

```text
Refund customer
Release inventory
```

Ordanis is designed to support safe recovery patterns using idempotent handlers and compensating operations.

---

## Main features

### Workflow management

* Create workflow definitions
* Store multiple workflow versions
* Define dependencies between tasks
* Validate dependency graphs
* Detect circular dependencies
* Calculate a valid execution order
* Identify tasks that can run concurrently

### Reliable execution

* Durable workflow state in PostgreSQL
* Task retries
* Retry backoff
* Task timeouts
* Workflow cancellation
* Recovery after worker loss
* Dependency-result propagation
* Stable task-run identifiers

### Distributed workers

* Java worker runtime
* Capability-based task assignment
* Worker heartbeats
* Task leases
* Worker slot limits
* Stale lease protection
* Cooperative cancellation

### Operations console

* Workflow list
* Visual workflow builder
* JSON and YAML editing
* Execution history
* Live execution graph
* Worker health dashboard
* Failure investigation centre
* Clearly labelled sample records

---

## System overview

```text
┌─────────────────────────────┐
│ React Operations Console    │
│                             │
│ Create workflows            │
│ Start executions            │
│ Inspect progress            │
│ View workers and failures   │
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│ Ordanis Server              │
│                             │
│ Workflow validation         │
│ Scheduler                   │
│ Task leasing                │
│ Retry handling              │
│ Execution state             │
└───────┬──────────────┬──────┘
        │              │
        │ PostgreSQL   │ gRPC
        ▼              ▼
┌──────────────┐   ┌──────────────────┐
│ Database     │   │ Java Workers     │
│              │   │                  │
│ Workflows    │   │ Execute tasks    │
│ Runs         │   │ Send heartbeats  │
│ Tasks        │   │ Report progress  │
│ Workers      │   │ Return results   │
└──────────────┘   └──────────────────┘
```

---

## Technology stack

### Backend

* Java 21
* Spring Boot
* Spring Data JPA
* PostgreSQL
* Flyway
* gRPC
* Gradle

### Frontend

* React
* TypeScript
* Vite
* React Flow
* TanStack Query

### Infrastructure and testing

* Docker
* Docker Compose
* Testcontainers
* JUnit
* Vitest
* Playwright

---

## Repository structure

```text
ordanis-engine
```

Contains the workflow compiler and core execution rules.

It handles:

* dependency graph validation
* cycle detection
* execution ordering
* workflow state rules

```text
ordanis-protocol
```

Contains the gRPC communication contract shared by the server and workers.

```text
ordanis-server
```

The main control plane.

It handles:

* REST APIs
* workflow storage
* task scheduling
* task leasing
* retries
* worker registration
* execution state

```text
ordanis-worker-sdk
```

A reusable Java runtime for building Ordanis workers.

It manages:

* worker registration
* heartbeats
* task polling
* task execution
* progress reporting
* cancellation

```text
ordanis-example-worker
```

A sample worker with example task handlers.

It demonstrates how external developers can connect their own task implementations to Ordanis.

```text
ordanis-console
```

The React and TypeScript interface.

It includes:

* the public product website
* the workflow builder
* execution monitoring
* worker monitoring
* failure investigation

---

## Run Ordanis with Docker

### Requirements

Install:

* Docker
* Docker Compose

Then run:

```bash
docker compose up --build
```

Docker will start:

* PostgreSQL
* the Ordanis server
* the example Java worker
* the React operations console

Open the following addresses:

| Service                     | Address                                 |
| --------------------------- | --------------------------------------- |
| Product website and console | `http://localhost:3000`                 |
| REST API                    | `http://localhost:8080/api`             |
| Server health check         | `http://localhost:8080/actuator/health` |
| gRPC worker gateway         | `localhost:9090`                        |

Stop the system with:

```bash
docker compose down
```

Remove containers and stored Docker volumes with:

```bash
docker compose down -v
```

---

## Run the backend locally

### Requirements

Install:

* Java 21
* Docker
* PostgreSQL, or use the PostgreSQL Docker service

Run the tests:

```bash
./gradlew clean test
```

Start the server:

```bash
./gradlew :ordanis-server:bootRun
```

The backend will be available at:

```text
http://localhost:8080
```

---

## Run the frontend locally

Open the console directory:

```bash
cd ordanis-console
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

The Vite development server forwards `/api` requests to:

```text
http://localhost:8080
```

---

## Console data modes

The console supports three data modes.

This prevents sample information from being silently presented as real production information.

### Live mode

```bash
VITE_DATA_MODE=live
```

Displays only records returned by the real Java backend.

Use this mode when testing actual workflows and workers.

### Showcase mode

```bash
VITE_DATA_MODE=showcase
```

Displays real backend records together with clearly labelled sample records.

This is the default Docker mode.

It helps new users explore the interface immediately without pretending that sample records are real benchmarks or production activity.

### Fixture mode

```bash
VITE_DATA_MODE=fixture
```

Displays only local sample records.

Use this mode for frontend development when the Java backend is not running.

---

## REST API

### List workflows

```http
GET /api/workflows
```

### Create a workflow

```http
POST /api/workflows
```

### Get one workflow

```http
GET /api/workflows/{workflowId}
```

### List workflow runs

```http
GET /api/runs
```

### Start a workflow

```http
POST /api/workflows/{workflowId}/runs
```

### Inspect a workflow run

```http
GET /api/runs/{runId}
```

### Cancel a workflow run

```http
POST /api/runs/{runId}/cancel
```

### List connected workers

```http
GET /api/workers
```

---

## Console pages

| Route                            | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `/`                              | Public product website              |
| `/console`                       | Operations overview                 |
| `/console/workflows`             | Workflow definitions                |
| `/console/workflows/new`         | Visual workflow builder             |
| `/console/workflows/:workflowId` | Workflow details and compiled graph |
| `/console/executions`            | Workflow execution list             |
| `/console/executions/:runId`     | Live execution inspection           |
| `/console/workers`               | Worker fleet and health             |
| `/console/failures`              | Failed task investigation           |
| `/console/schedules`             | Planned scheduling capability       |
| `/console/audit`                 | Planned persisted audit capability  |
| `/console/credentials`           | Planned secure credential storage   |
| `/console/settings`              | Runtime and console settings        |

---

## Testing

### Backend tests

```bash
./gradlew clean test
```

The backend integration tests use Testcontainers.

Docker must be running because Testcontainers creates temporary PostgreSQL containers during testing.

### Frontend tests

```bash
cd ordanis-console
npm test
```

### Production frontend build

```bash
npm run build
```

### End-to-end browser tests

Install the Playwright browser:

```bash
npx playwright install
```

Run the tests:

```bash
npm run test:e2e
```

---

## Current limitations

Ordanis is a serious engineering project, but it is not yet a complete commercial workflow platform.

The following backend capabilities are not implemented yet:

* user authentication
* organisation and tenant isolation
* scheduled workflow execution
* persisted audit logs
* secure credential and secret storage
* retrying a workflow from a selected step
* live worker log streaming
* full production deployment automation

The console contains pages for some of these areas, but it does not pretend that the backend functionality already exists.

Those pages explain what would need to be implemented before the controls could be safely enabled.

---

## Important design decisions

Ordanis intentionally focuses on reliability before adding a large number of features.

The project prioritises:

* correct workflow dependency handling
* durable state
* safe task assignment
* worker failure recovery
* honest capability boundaries
* understandable operational visibility
* testable execution behaviour

The goal is not to create another simple task manager.

The goal is to demonstrate how the underlying infrastructure for payment systems, document platforms, media pipelines, AI products and enterprise automation can be designed.

---

## Additional documentation

More detailed technical information is available in:

```text
docs/architecture.md
docs/frontend.md
docs/missing-capabilities.md
docs/verification.md
```

These documents cover:

* system architecture
* backend and frontend boundaries
* execution behaviour
* missing production capabilities
* verification and testing

---

## Author

**Nomaan Munshi**

GitHub: [github.com/nomaanmunshi](https://github.com/nomaanmunshi)

Repository: [github.com/nomaanmunshi/ordanis](https://github.com/nomaanmunshi/ordanis)
