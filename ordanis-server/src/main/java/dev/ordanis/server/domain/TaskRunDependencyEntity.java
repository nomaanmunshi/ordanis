package dev.ordanis.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "task_run_dependencies")
public class TaskRunDependencyEntity {
    @Id
    private UUID id;
    @Column(name = "workflow_run_id")
    private UUID workflowRunId;
    @Column(name = "task_run_id")
    private UUID taskRunId;
    @Column(name = "depends_on_task_run_id")
    private UUID dependsOnTaskRunId;

    protected TaskRunDependencyEntity() {}

    public TaskRunDependencyEntity(UUID id, UUID workflowRunId, UUID taskRunId, UUID dependsOnTaskRunId) {
        this.id = id;
        this.workflowRunId = workflowRunId;
        this.taskRunId = taskRunId;
        this.dependsOnTaskRunId = dependsOnTaskRunId;
    }
}
