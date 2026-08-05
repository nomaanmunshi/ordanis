package dev.ordanis.server.repository;

import dev.ordanis.server.domain.TaskRunDependencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TaskRunDependencyRepository extends JpaRepository<TaskRunDependencyEntity, UUID> {}
