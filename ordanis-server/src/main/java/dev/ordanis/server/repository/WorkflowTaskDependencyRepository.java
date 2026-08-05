package dev.ordanis.server.repository;

import dev.ordanis.server.domain.WorkflowTaskDependencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowTaskDependencyRepository extends JpaRepository<WorkflowTaskDependencyEntity, UUID> {
    List<WorkflowTaskDependencyEntity> findByWorkflowDefinitionId(UUID workflowDefinitionId);
}
