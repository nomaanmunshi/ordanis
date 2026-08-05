package dev.ordanis.server.domain;

import dev.ordanis.engine.state.TaskStateMachine;
import dev.ordanis.engine.state.TaskStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_runs")
public class TaskRunEntity {
    @Id
    private UUID id;
    @Column(name = "workflow_run_id")
    private UUID workflowRunId;
    @Column(name = "task_definition_id")
    private UUID taskDefinitionId;
    @Column(name = "task_key")
    private String taskKey;
    @Column(name = "task_type")
    private String taskType;
    private String handler;
    @Enumerated(EnumType.STRING)
    private TaskStatus status;
    private int priority;
    private int attempt;
    @Column(name = "max_attempts")
    private int maxAttempts;
    @Column(name = "timeout_seconds")
    private int timeoutSeconds;
    @Column(name = "payload_json", columnDefinition = "text")
    private String payloadJson;
    @Column(name = "result_json", columnDefinition = "text")
    private String resultJson;
    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;
    @Column(name = "available_at")
    private Instant availableAt;
    @Column(name = "worker_id")
    private UUID workerId;
    @Column(name = "lease_token")
    private UUID leaseToken;
    @Column(name = "lease_until")
    private Instant leaseUntil;
    @Column(name = "cancellation_requested")
    private boolean cancellationRequested;
    private int progress;
    @Column(name = "progress_message")
    private String progressMessage;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "finished_at")
    private Instant finishedAt;
    @Version
    @Column(name = "entity_version")
    private long entityVersion;

    protected TaskRunEntity() {}

    public TaskRunEntity(
            UUID id, UUID workflowRunId, UUID taskDefinitionId, String taskKey, String taskType,
            String handler, TaskStatus status, int priority, int maxAttempts, int timeoutSeconds,
            String payloadJson, Instant now) {
        this.id = id;
        this.workflowRunId = workflowRunId;
        this.taskDefinitionId = taskDefinitionId;
        this.taskKey = taskKey;
        this.taskType = taskType;
        this.handler = handler;
        this.status = status;
        this.priority = priority;
        this.maxAttempts = maxAttempts;
        this.timeoutSeconds = timeoutSeconds;
        this.payloadJson = payloadJson;
        this.availableAt = now;
        this.createdAt = now;
    }

    public void succeed(String resultJson, Instant now) {
        transition(TaskStatus.SUCCEEDED);
        this.resultJson = resultJson;
        this.progress = 100;
        this.finishedAt = now;
        clearLease();
    }

    public void retry(String error, Instant availableAt) {
        transition(TaskStatus.RETRY_WAIT);
        this.errorMessage = error;
        this.availableAt = availableAt;
        clearLease();
    }

    public void fail(String error, Instant now) {
        transition(TaskStatus.FAILED);
        this.errorMessage = error;
        this.finishedAt = now;
        clearLease();
    }

    public void cancel(Instant now) {
        if (status == TaskStatus.RUNNING) transition(TaskStatus.CANCELLED);
        else if (!status.terminal()) transition(TaskStatus.CANCELLED);
        this.finishedAt = now;
        clearLease();
    }

    private void transition(TaskStatus next) {
        TaskStateMachine.require(status, next);
        status = next;
    }

    private void clearLease() {
        workerId = null;
        leaseToken = null;
        leaseUntil = null;
    }

    public UUID getId() { return id; }
    public UUID getWorkflowRunId() { return workflowRunId; }
    public UUID getTaskDefinitionId() { return taskDefinitionId; }
    public String getTaskKey() { return taskKey; }
    public String getTaskType() { return taskType; }
    public String getHandler() { return handler; }
    public TaskStatus getStatus() { return status; }
    public int getPriority() { return priority; }
    public int getAttempt() { return attempt; }
    public int getMaxAttempts() { return maxAttempts; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public String getPayloadJson() { return payloadJson; }
    public String getResultJson() { return resultJson; }
    public String getErrorMessage() { return errorMessage; }
    public Instant getAvailableAt() { return availableAt; }
    public UUID getWorkerId() { return workerId; }
    public UUID getLeaseToken() { return leaseToken; }
    public Instant getLeaseUntil() { return leaseUntil; }
    public boolean isCancellationRequested() { return cancellationRequested; }
    public int getProgress() { return progress; }
    public String getProgressMessage() { return progressMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
}
