package dev.ordanis.server.repository;

import dev.ordanis.server.domain.WorkflowTaskDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowTaskDefinitionRepository extends JpaRepository<WorkflowTaskDefinitionEntity, UUID> {
    List<WorkflowTaskDefinitionEntity> findByWorkflowDefinitionIdOrderByExecutionLevelAscTaskKeyAsc(UUID workflowDefinitionId);
}
