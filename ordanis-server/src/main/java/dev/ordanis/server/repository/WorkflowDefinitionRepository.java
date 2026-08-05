package dev.ordanis.server.repository;

import dev.ordanis.server.domain.WorkflowDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinitionEntity, UUID> {
    Optional<WorkflowDefinitionEntity> findTopByNameOrderByDefinitionVersionDesc(String name);
    List<WorkflowDefinitionEntity> findAllByOrderByCreatedAtDesc();
}
