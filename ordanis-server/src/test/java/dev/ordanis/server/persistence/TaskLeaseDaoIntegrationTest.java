package dev.ordanis.server.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class TaskLeaseDaoIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("ordanis.grpc-port", () -> 0);
    }

    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired TaskLeaseDao taskLeaseDao;
    @Autowired JdbcTemplate jdbc;

    UUID workflow;
    UUID run;
    UUID task;

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE worker_nodes, task_run_dependencies, task_runs, workflow_runs, " +
                "workflow_task_dependencies, workflow_task_definitions, workflow_definitions CASCADE");

        workflow = UUID.randomUUID();
        UUID definition = UUID.randomUUID();
        run = UUID.randomUUID();
        task = UUID.randomUUID();
        Instant now = Instant.now();

        jdbc.update("INSERT INTO workflow_definitions VALUES (?, ?, ?, ?, ?, ?)",
                workflow, "test", 1, "{}", Timestamp.from(now), 0L);
        jdbc.update("INSERT INTO workflow_task_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                definition, workflow, "task", "JAVA", "echo", 1, 3, 30, "{}", 0);
        jdbc.update("INSERT INTO workflow_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                run, workflow, "RUNNING", "{}", null, Timestamp.from(now), Timestamp.from(now), null, 0L);
        jdbc.update("""
                INSERT INTO task_runs (
                    id, workflow_run_id, task_definition_id, task_key, task_type, handler,
                    status, priority, attempt, max_attempts, timeout_seconds, payload_json,
                    available_at, cancellation_requested, progress, created_at, entity_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, task, run, definition, "task", "JAVA", "echo", "QUEUED", 1, 0, 3, 30,
                "{}", Timestamp.from(now), false, 0, Timestamp.from(now), 0L);
    }

    @Test
    void dependencyResultsAreIncludedInLeasedPayload() throws Exception {
        jdbc.update("UPDATE task_runs SET status = 'SUCCEEDED', result_json = ?, finished_at = now() WHERE id = ?",
                "{\"value\":\"done\"}", task);

        UUID childDefinition = UUID.randomUUID();
        UUID childTask = UUID.randomUUID();
        jdbc.update("INSERT INTO workflow_task_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                childDefinition, workflow, "child", "JAVA", "echo", 1, 3, 30, "{}", 1);
        jdbc.update("""
                INSERT INTO task_runs (
                    id, workflow_run_id, task_definition_id, task_key, task_type, handler,
                    status, priority, attempt, max_attempts, timeout_seconds, payload_json,
                    available_at, cancellation_requested, progress, created_at, entity_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), false, 0, now(), 0)
                """, childTask, run, childDefinition, "child", "JAVA", "echo", "QUEUED", 1, 0, 3, 30, "{}");
        jdbc.update("INSERT INTO task_run_dependencies VALUES (?, ?, ?, ?)",
                UUID.randomUUID(), run, childTask, task);

        var lease = taskLeaseDao.lease(UUID.randomUUID(), List.of("JAVA"), Duration.ofSeconds(30))
                .orElseThrow();
        assertThat(JSON.readTree(lease.payloadJson()).path("dependencies").path("task").path("value").asText())
                .isEqualTo("done");
    }

    @Test
    void oneTaskCannotBeLeasedTwice() {
        var first = taskLeaseDao.lease(UUID.randomUUID(), List.of("JAVA"), Duration.ofSeconds(30));
        var second = taskLeaseDao.lease(UUID.randomUUID(), List.of("JAVA"), Duration.ofSeconds(30));

        assertThat(first).isPresent();
        assertThat(second).isEmpty();
        assertThat(first.orElseThrow().attempt()).isEqualTo(1);
    }
}
