package dev.ordanis.server.api;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ordanis.engine.state.TaskStatus;
import dev.ordanis.engine.state.WorkflowStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ApiModels {
    private ApiModels() {}

    public record CreateWorkflowRequest(
            @NotBlank String name,
            @NotEmpty List<@Valid TaskRequest> tasks) {}

    public record TaskRequest(
            @NotBlank String id,
            @NotBlank String type,
            @NotBlank String handler,
            List<String> dependsOn,
            @Min(0) Integer priority,
            @Min(1) Integer maxAttempts,
            @Min(1) Integer timeoutSeconds,
            JsonNode payload) {
        public List<String> dependencies() { return dependsOn == null ? List.of() : dependsOn; }
        public int resolvedPriority() { return priority == null ? 0 : priority; }
        public int resolvedMaxAttempts() { return maxAttempts == null ? 3 : maxAttempts; }
        public int resolvedTimeoutSeconds() { return timeoutSeconds == null ? 60 : timeoutSeconds; }
    }

    public record WorkflowResponse(
            UUID id,
            String name,
            int version,
            List<List<String>> executionLevels,
            Instant createdAt) {}

    public record WorkflowSummaryResponse(
            UUID id,
            String name,
            int version,
            int taskCount,
            Instant createdAt) {}

    public record WorkflowDetailResponse(
            UUID id,
            String name,
            int version,
            List<TaskDefinitionResponse> tasks,
            List<List<String>> executionLevels,
            Instant createdAt) {}

    public record TaskDefinitionResponse(
            String id,
            String type,
            String handler,
            List<String> dependsOn,
            int priority,
            int maxAttempts,
            int timeoutSeconds,
            JsonNode payload,
            int executionLevel) {}

    public record StartRunRequest(JsonNode input) {}

    public record RunResponse(
            UUID id,
            UUID workflowDefinitionId,
            WorkflowStatus status,
            Instant createdAt,
            Instant startedAt,
            Instant finishedAt,
            List<TaskRunResponse> tasks) {}

    public record TaskRunResponse(
            UUID id,
            String taskKey,
            String type,
            String handler,
            TaskStatus status,
            int attempt,
            int maxAttempts,
            int progress,
            String progressMessage,
            String resultJson,
            String errorMessage,
            Instant startedAt,
            Instant finishedAt) {}

    public record WorkerResponse(
            UUID id,
            String name,
            List<String> capabilities,
            int maxSlots,
            long activeTasks,
            String status,
            Instant lastSeenAt) {}

    public record ErrorResponse(String code, String message, List<String> details) {}
}
