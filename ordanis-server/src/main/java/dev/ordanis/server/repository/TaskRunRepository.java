package dev.ordanis.server.repository;

import dev.ordanis.engine.state.TaskStatus;
import dev.ordanis.server.domain.TaskRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRunRepository extends JpaRepository<TaskRunEntity, UUID> {
    List<TaskRunEntity> findByWorkflowRunIdOrderByCreatedAtAsc(UUID workflowRunId);
    long countByWorkerIdAndStatus(UUID workerId, TaskStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TaskRunEntity t where t.id = :id")
    Optional<TaskRunEntity> findForUpdate(@Param("id") UUID id);
}
