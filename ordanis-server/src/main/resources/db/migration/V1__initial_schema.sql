CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    definition_version INTEGER NOT NULL,
    definition_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    entity_version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_workflow_name_version UNIQUE (name, definition_version)
);

CREATE TABLE workflow_task_definitions (
    id UUID PRIMARY KEY,
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    task_key VARCHAR(120) NOT NULL,
    task_type VARCHAR(80) NOT NULL,
    handler VARCHAR(160) NOT NULL,
    priority INTEGER NOT NULL,
    max_attempts INTEGER NOT NULL,
    timeout_seconds INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    execution_level INTEGER NOT NULL,
    CONSTRAINT uk_workflow_task_key UNIQUE (workflow_definition_id, task_key)
);

CREATE TABLE workflow_task_dependencies (
    id UUID PRIMARY KEY,
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    task_definition_id UUID NOT NULL REFERENCES workflow_task_definitions(id) ON DELETE CASCADE,
    depends_on_task_definition_id UUID NOT NULL REFERENCES workflow_task_definitions(id) ON DELETE CASCADE,
    CONSTRAINT uk_workflow_task_dependency UNIQUE (task_definition_id, depends_on_task_definition_id)
);

CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY,
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
    status VARCHAR(32) NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    entity_version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE task_runs (
    id UUID PRIMARY KEY,
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    task_definition_id UUID NOT NULL REFERENCES workflow_task_definitions(id),
    task_key VARCHAR(120) NOT NULL,
    task_type VARCHAR(80) NOT NULL,
    handler VARCHAR(160) NOT NULL,
    status VARCHAR(32) NOT NULL,
    priority INTEGER NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL,
    timeout_seconds INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    result_json TEXT,
    error_message TEXT,
    available_at TIMESTAMPTZ NOT NULL,
    worker_id UUID,
    lease_token UUID,
    lease_until TIMESTAMPTZ,
    cancellation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    progress INTEGER NOT NULL DEFAULT 0,
    progress_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    entity_version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_run_task_key UNIQUE (workflow_run_id, task_key)
);

CREATE TABLE task_run_dependencies (
    id UUID PRIMARY KEY,
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    task_run_id UUID NOT NULL REFERENCES task_runs(id) ON DELETE CASCADE,
    depends_on_task_run_id UUID NOT NULL REFERENCES task_runs(id) ON DELETE CASCADE,
    CONSTRAINT uk_task_run_dependency UNIQUE (task_run_id, depends_on_task_run_id)
);

CREATE TABLE worker_nodes (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    capabilities_json TEXT NOT NULL,
    max_slots INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL,
    entity_version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_task_runs_schedulable
    ON task_runs (status, available_at, priority DESC, created_at)
    WHERE status IN ('QUEUED', 'RETRY_WAIT');

CREATE INDEX idx_task_runs_lease
    ON task_runs (lease_until)
    WHERE status = 'RUNNING';

CREATE INDEX idx_task_runs_workflow_status
    ON task_runs (workflow_run_id, status);

CREATE INDEX idx_task_runs_blocked
    ON task_runs (workflow_run_id)
    WHERE status = 'BLOCKED';

CREATE INDEX idx_task_run_dependencies_child ON task_run_dependencies(task_run_id);
CREATE INDEX idx_task_run_dependencies_parent ON task_run_dependencies(depends_on_task_run_id);
CREATE INDEX idx_worker_nodes_last_seen ON worker_nodes(last_seen_at);
