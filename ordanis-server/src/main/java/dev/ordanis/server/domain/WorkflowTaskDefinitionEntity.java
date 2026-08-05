package dev.ordanis.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "workflow_task_definitions")
public class WorkflowTaskDefinitionEntity {
    @Id
    private UUID id;
    @Column(name = "workflow_definition_id")
    private UUID workflowDefinitionId;
    @Column(name = "task_key")
    private String taskKey;
    @Column(name = "task_type")
    private String taskType;
    private String handler;
    private int priority;
    @Column(name = "max_attempts")
    private int maxAttempts;
    @Column(name = "timeout_seconds")
    private int timeoutSeconds;
    @Column(name = "payload_json", columnDefinition = "text")
    private String payloadJson;
    @Column(name = "execution_level")
    private int executionLevel;

    protected WorkflowTaskDefinitionEntity() {}

    public WorkflowTaskDefinitionEntity(
            UUID id, UUID workflowDefinitionId, String taskKey, String taskType, String handler,
            int priority, int maxAttempts, int timeoutSeconds, String payloadJson, int executionLevel) {
        this.id = id;
        this.workflowDefinitionId = workflowDefinitionId;
        this.taskKey = taskKey;
        this.taskType = taskType;
        this.handler = handler;
        this.priority = priority;
        this.maxAttempts = maxAttempts;
        this.timeoutSeconds = timeoutSeconds;
        this.payloadJson = payloadJson;
        this.executionLevel = executionLevel;
    }

    public UUID getId() { return id; }
    public UUID getWorkflowDefinitionId() { return workflowDefinitionId; }
    public String getTaskKey() { return taskKey; }
    public String getTaskType() { return taskType; }
    public String getHandler() { return handler; }
    public int getPriority() { return priority; }
    public int getMaxAttempts() { return maxAttempts; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public String getPayloadJson() { return payloadJson; }
    public int getExecutionLevel() { return executionLevel; }
}
