package dev.ordanis.server.persistence;

import dev.ordanis.engine.state.TaskStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class TaskLeaseDao {
    private final NamedParameterJdbcTemplate jdbc;

    public TaskLeaseDao(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<LeasedTask> lease(UUID workerId, List<String> capabilities, Duration leaseDuration) {
        if (capabilities.isEmpty()) return Optional.empty();
        var token = UUID.randomUUID();
        var params = new MapSqlParameterSource()
                .addValue("workerId", workerId)
                .addValue("capabilities", capabilities)
                .addValue("leaseToken", token)
                .addValue("leaseSeconds", leaseDuration.toSeconds());

        var rows = jdbc.query("""
                WITH candidate AS (
                    SELECT id
                    FROM task_runs
                    WHERE status IN ('QUEUED', 'RETRY_WAIT')
                      AND available_at <= now()
                      AND task_type IN (:capabilities)
                      AND attempt < max_attempts
                    ORDER BY priority DESC, available_at, created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                UPDATE task_runs t
                SET status = 'RUNNING',
                    worker_id = :workerId,
                    lease_token = :leaseToken,
                    lease_until = now() + (:leaseSeconds * interval '1 second'),
                    started_at = now(),
                    finished_at = NULL,
                    attempt = t.attempt + 1,
                    progress = 0,
                    progress_message = NULL,
                    error_message = NULL,
                    entity_version = t.entity_version + 1
                FROM candidate
                WHERE t.id = candidate.id
                RETURNING t.id, t.workflow_run_id, t.task_key, t.task_type, t.handler,
                          (
                              SELECT jsonb_set(
                                  t.payload_json::jsonb,
                                  '{dependencies}',
                                  COALESCE(
                                      jsonb_object_agg(parent.task_key, parent.result_json::jsonb),
                                      '{}'::jsonb
                                  ),
                                  true
                              )::text
                              FROM task_run_dependencies dependency
                              JOIN task_runs parent ON parent.id = dependency.depends_on_task_run_id
                              WHERE dependency.task_run_id = t.id
                          ) AS payload_json,
                          t.lease_token, t.attempt, t.timeout_seconds, t.lease_until
                """, params, (rs, rowNum) -> new LeasedTask(
                rs.getObject("id", UUID.class),
                rs.getObject("workflow_run_id", UUID.class),
                rs.getString("task_key"),
                rs.getString("task_type"),
                rs.getString("handler"),
                rs.getString("payload_json"),
                rs.getObject("lease_token", UUID.class),
                rs.getInt("attempt"),
                rs.getInt("timeout_seconds"),
                rs.getTimestamp("lease_until").toInstant()));
        return rows.stream().findFirst();
    }

    public Optional<HeartbeatResult> heartbeat(
            UUID workerId, UUID taskRunId, UUID leaseToken, Duration leaseDuration) {
        var params = new MapSqlParameterSource()
                .addValue("workerId", workerId)
                .addValue("taskRunId", taskRunId)
                .addValue("leaseToken", leaseToken)
                .addValue("leaseSeconds", leaseDuration.toSeconds());
        var rows = jdbc.query("""
                UPDATE task_runs
                SET lease_until = now() + (:leaseSeconds * interval '1 second'),
                    entity_version = entity_version + 1
                WHERE id = :taskRunId
                  AND worker_id = :workerId
                  AND lease_token = :leaseToken
                  AND status = 'RUNNING'
                  AND started_at + (timeout_seconds * interval '1 second') > now()
                RETURNING cancellation_requested, lease_until
                """, params, (rs, rowNum) -> new HeartbeatResult(
                rs.getBoolean("cancellation_requested"),
                rs.getTimestamp("lease_until").toInstant()));
        return rows.stream().findFirst();
    }

    public boolean reportProgress(
            UUID workerId, UUID taskRunId, UUID leaseToken, int percent, String message) {
        var params = new MapSqlParameterSource()
                .addValue("workerId", workerId)
                .addValue("taskRunId", taskRunId)
                .addValue("leaseToken", leaseToken)
                .addValue("percent", Math.max(0, Math.min(percent, 100)))
                .addValue("message", message);
        return jdbc.update("""
                UPDATE task_runs
                SET progress = :percent,
                    progress_message = :message,
                    entity_version = entity_version + 1
                WHERE id = :taskRunId
                  AND worker_id = :workerId
                  AND lease_token = :leaseToken
                  AND status = 'RUNNING'
                """, params) == 1;
    }

    public int queueReadyTasks(UUID workflowRunId) {
        return jdbc.update("""
                UPDATE task_runs child
                SET status = 'QUEUED',
                    available_at = now(),
                    entity_version = child.entity_version + 1
                WHERE child.workflow_run_id = :runId
                  AND child.status = 'BLOCKED'
                  AND EXISTS (
                      SELECT 1 FROM workflow_runs run
                      WHERE run.id = child.workflow_run_id AND run.status = 'RUNNING'
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM task_run_dependencies dependency
                      JOIN task_runs parent ON parent.id = dependency.depends_on_task_run_id
                      WHERE dependency.task_run_id = child.id
                        AND parent.status <> 'SUCCEEDED'
                  )
                """, new MapSqlParameterSource("runId", workflowRunId));
    }

    public int queueAllReadyTasks() {
        return jdbc.update("""
                UPDATE task_runs child
                SET status = 'QUEUED',
                    available_at = now(),
                    entity_version = child.entity_version + 1
                WHERE child.status = 'BLOCKED'
                  AND EXISTS (
                      SELECT 1 FROM workflow_runs run
                      WHERE run.id = child.workflow_run_id AND run.status = 'RUNNING'
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM task_run_dependencies dependency
                      JOIN task_runs parent ON parent.id = dependency.depends_on_task_run_id
                      WHERE dependency.task_run_id = child.id
                        AND parent.status <> 'SUCCEEDED'
                  )
                """, new MapSqlParameterSource());
    }

    public int markCompletedWorkflows() {
        return jdbc.update("""
                UPDATE workflow_runs run
                SET status = 'SUCCEEDED',
                    finished_at = now(),
                    entity_version = run.entity_version + 1
                WHERE run.status = 'RUNNING'
                  AND NOT EXISTS (
                      SELECT 1 FROM task_runs task
                      WHERE task.workflow_run_id = run.id
                        AND task.status <> 'SUCCEEDED'
                  )
                """, new MapSqlParameterSource());
    }

    public boolean markWorkflowSucceededIfComplete(UUID workflowRunId) {
        return jdbc.update("""
                UPDATE workflow_runs run
                SET status = 'SUCCEEDED',
                    finished_at = now(),
                    entity_version = run.entity_version + 1
                WHERE run.id = :runId
                  AND run.status = 'RUNNING'
                  AND NOT EXISTS (
                      SELECT 1 FROM task_runs task
                      WHERE task.workflow_run_id = run.id
                        AND task.status <> 'SUCCEEDED'
                  )
                """, new MapSqlParameterSource("runId", workflowRunId)) == 1;
    }

    public void markWorkflowFailed(UUID workflowRunId) {
        var params = new MapSqlParameterSource("runId", workflowRunId);
        jdbc.update("""
                UPDATE workflow_runs
                SET status = 'FAILED', finished_at = now(), entity_version = entity_version + 1
                WHERE id = :runId AND status = 'RUNNING'
                """, params);
        jdbc.update("""
                UPDATE task_runs
                SET status = 'CANCELLED', finished_at = now(), entity_version = entity_version + 1
                WHERE workflow_run_id = :runId AND status IN ('BLOCKED', 'QUEUED', 'RETRY_WAIT')
                """, params);
        jdbc.update("""
                UPDATE task_runs
                SET cancellation_requested = TRUE, entity_version = entity_version + 1
                WHERE workflow_run_id = :runId AND status = 'RUNNING'
                """, params);
    }

    public void cancelTasks(UUID workflowRunId) {
        var params = new MapSqlParameterSource("runId", workflowRunId);
        jdbc.update("""
                UPDATE task_runs
                SET status = 'CANCELLED', finished_at = now(), entity_version = entity_version + 1
                WHERE workflow_run_id = :runId AND status IN ('BLOCKED', 'QUEUED', 'RETRY_WAIT')
                """, params);
        jdbc.update("""
                UPDATE task_runs
                SET cancellation_requested = TRUE, entity_version = entity_version + 1
                WHERE workflow_run_id = :runId AND status = 'RUNNING'
                """, params);
    }

    public List<RecoveryResult> recoverExpired(int limit) {
        return jdbc.query("""
                WITH expired AS (
                    SELECT id
                    FROM task_runs
                    WHERE status = 'RUNNING'
                      AND (
                          lease_until < now()
                          OR started_at + (timeout_seconds * interval '1 second') < now()
                      )
                    ORDER BY lease_until NULLS FIRST
                    FOR UPDATE SKIP LOCKED
                    LIMIT :limit
                )
                UPDATE task_runs task
                SET status = CASE
                        WHEN task.cancellation_requested THEN 'CANCELLED'
                        WHEN task.attempt < task.max_attempts THEN 'RETRY_WAIT'
                        ELSE 'TIMED_OUT'
                    END,
                    available_at = CASE
                        WHEN NOT task.cancellation_requested AND task.attempt < task.max_attempts
                            THEN now() + make_interval(secs => LEAST(30, CAST(power(2, task.attempt) AS integer)))
                        ELSE task.available_at
                    END,
                    error_message = CASE
                        WHEN task.cancellation_requested THEN 'cancelled by user'
                        ELSE 'worker lease expired or task timed out'
                    END,
                    finished_at = CASE
                        WHEN NOT task.cancellation_requested AND task.attempt < task.max_attempts THEN NULL
                        ELSE now()
                    END,
                    worker_id = NULL,
                    lease_token = NULL,
                    lease_until = NULL,
                    entity_version = task.entity_version + 1
                FROM expired
                WHERE task.id = expired.id
                RETURNING task.workflow_run_id, task.status
                """, new MapSqlParameterSource("limit", limit), (rs, rowNum) -> new RecoveryResult(
                rs.getObject("workflow_run_id", UUID.class),
                TaskStatus.valueOf(rs.getString("status"))));
    }

    public record LeasedTask(
            UUID taskRunId,
            UUID workflowRunId,
            String taskKey,
            String type,
            String handler,
            String payloadJson,
            UUID leaseToken,
            int attempt,
            int timeoutSeconds,
            Instant leaseUntil) {}

    public record HeartbeatResult(boolean cancellationRequested, Instant leaseUntil) {}

    public record RecoveryResult(UUID workflowRunId, TaskStatus status) {}
}
