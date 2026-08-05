package dev.ordanis.server.repository;

import dev.ordanis.server.domain.WorkerNodeEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkerNodeRepository extends JpaRepository<WorkerNodeEntity, UUID> {
    List<WorkerNodeEntity> findAllByOrderByLastSeenAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WorkerNodeEntity w where w.id = :id")
    Optional<WorkerNodeEntity> findForUpdate(@Param("id") UUID id);

    @Modifying(clearAutomatically = true)
    @Query("""
            update WorkerNodeEntity w
            set w.status = 'ONLINE', w.lastSeenAt = :now, w.entityVersion = w.entityVersion + 1
            where w.id = :id
            """)
    int touch(@Param("id") UUID id, @Param("now") java.time.Instant now);
}
