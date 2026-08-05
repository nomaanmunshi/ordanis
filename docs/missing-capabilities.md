# Backend capabilities still missing

These are product gaps, not frontend TODOs hidden behind fake controls.

## Authentication and authorization

Required for user identity, workspace access, role checks, API keys, secrets, and actor-aware audit records.

## Schedules

Requires persisted cron/interval definitions, timezone handling, next-run calculation, misfire policy, duplicate-trigger protection, and scheduler ownership.

## Live event transport

SSE or WebSocket events should cover task status, progress, worker presence, retries, and workflow completion. Events must be deduplicated and reconciled with authoritative REST state.

## Log persistence and streaming

Worker log messages need a protocol, storage/retention policy, redaction, pagination or cursor streaming, and download authorization.

## Retry operations

Version one automatically retries through the engine. Manual retry-task and retry-from-failed-step APIs need explicit idempotency and dependency-reset semantics.

## Worker lifecycle management

Drain, resume, and remote cancellation need persisted worker state and clear interaction with leases.

## Audit and credentials

Audit records must be immutable. Credentials need encrypted storage, one-time reveal, scopes, rotation, revocation, and audit coverage.
