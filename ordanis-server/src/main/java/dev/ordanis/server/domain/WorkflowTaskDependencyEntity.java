package dev.ordanis.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "workflow_task_dependencies")
public class WorkflowTaskDependencyEntity {
    @Id
    private UUID id;
    @Column(name = "workflow_definition_id")
    private UUID workflowDefinitionId;
    @Column(name = "task_definition_id")
    private UUID taskDefinitionId;
    @Column(name = "depends_on_task_definition_id")
    private UUID dependsOnTaskDefinitionId;

    protected WorkflowTaskDependencyEntity() {}

    public WorkflowTaskDependencyEntity(UUID id, UUID workflowDefinitionId, UUID taskDefinitionId, UUID dependsOnTaskDefinitionId) {
        this.id = id;
        this.workflowDefinitionId = workflowDefinitionId;
        this.taskDefinitionId = taskDefinitionId;
        this.dependsOnTaskDefinitionId = dependsOnTaskDefinitionId;
    }

    public UUID getTaskDefinitionId() { return taskDefinitionId; }
    public UUID getDependsOnTaskDefinitionId() { return dependsOnTaskDefinitionId; }
}
