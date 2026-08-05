package dev.ordanis.server.domain;

import dev.ordanis.engine.state.WorkflowStatus;
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
@Table(name = "workflow_runs")
public class WorkflowRunEntity {
    @Id
    private UUID id;
    @Column(name = "workflow_definition_id")
    private UUID workflowDefinitionId;
    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;
    @Column(name = "input_json", columnDefinition = "text")
    private String inputJson;
    @Column(name = "output_json", columnDefinition = "text")
    private String outputJson;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "finished_at")
    private Instant finishedAt;
    @Version
    @Column(name = "entity_version")
    private long entityVersion;

    protected WorkflowRunEntity() {}

    public WorkflowRunEntity(UUID id, UUID workflowDefinitionId, String inputJson, Instant now) {
        this.id = id;
        this.workflowDefinitionId = workflowDefinitionId;
        this.status = WorkflowStatus.RUNNING;
        this.inputJson = inputJson;
        this.createdAt = now;
        this.startedAt = now;
    }

    public void succeed(Instant now) {
        status = WorkflowStatus.SUCCEEDED;
        finishedAt = now;
    }

    public void fail(Instant now) {
        status = WorkflowStatus.FAILED;
        finishedAt = now;
    }

    public void cancel(Instant now) {
        status = WorkflowStatus.CANCELLED;
        finishedAt = now;
    }

    public UUID getId() { return id; }
    public UUID getWorkflowDefinitionId() { return workflowDefinitionId; }
    public WorkflowStatus getStatus() { return status; }
    public String getInputJson() { return inputJson; }
    public String getOutputJson() { return outputJson; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
}
