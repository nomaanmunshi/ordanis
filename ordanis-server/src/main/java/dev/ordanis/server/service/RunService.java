package dev.ordanis.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ordanis.engine.state.TaskStatus;
import dev.ordanis.engine.state.WorkflowStatus;
import dev.ordanis.server.api.ApiModels;
import dev.ordanis.server.domain.TaskRunDependencyEntity;
import dev.ordanis.server.domain.TaskRunEntity;
import dev.ordanis.server.domain.WorkflowRunEntity;
import dev.ordanis.server.persistence.TaskLeaseDao;
import dev.ordanis.server.repository.TaskRunDependencyRepository;
import dev.ordanis.server.repository.TaskRunRepository;
import dev.ordanis.server.repository.WorkflowDefinitionRepository;
import dev.ordanis.server.repository.WorkflowRunRepository;
import dev.ordanis.server.repository.WorkflowTaskDefinitionRepository;
import dev.ordanis.server.repository.WorkflowTaskDependencyRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.UUID;

@Service
public class RunService {
    private final ObjectMapper objectMapper;
    private final WorkflowDefinitionRepository workflowRepository;
    private final WorkflowTaskDefinitionRepository taskDefinitionRepository;
    private final WorkflowTaskDependencyRepository definitionDependencyRepository;
    private final WorkflowRunRepository runRepository;
    private final TaskRunRepository taskRunRepository;
    private final TaskRunDependencyRepository taskDependencyRepository;
    private final TaskLeaseDao taskLeaseDao;

    public RunService(
            ObjectMapper objectMapper,
            WorkflowDefinitionRepository workflowRepository,
            WorkflowTaskDefinitionRepository taskDefinitionRepository,
            WorkflowTaskDependencyRepository definitionDependencyRepository,
            WorkflowRunRepository runRepository,
            TaskRunRepository taskRunRepository,
            TaskRunDependencyRepository taskDependencyRepository,
            TaskLeaseDao taskLeaseDao) {
        this.objectMapper = objectMapper;
        this.workflowRepository = workflowRepository;
        this.taskDefinitionRepository = taskDefinitionRepository;
        this.definitionDependencyRepository = definitionDependencyRepository;
        this.runRepository = runRepository;
        this.taskRunRepository = taskRunRepository;
        this.taskDependencyRepository = taskDependencyRepository;
        this.taskLeaseDao = taskLeaseDao;
    }

    @Transactional
    public ApiModels.RunResponse start(UUID workflowId, ApiModels.StartRunRequest request) {
        workflowRepository.findById(workflowId)
                .orElseThrow(() -> new EntityNotFoundException("workflow not found: " + workflowId));

        var definitions = taskDefinitionRepository.findByWorkflowDefinitionIdOrderByExecutionLevelAscTaskKeyAsc(workflowId);
        var dependencies = definitionDependencyRepository.findByWorkflowDefinitionId(workflowId);
        var dependencyCount = new HashMap<UUID, Integer>();
        dependencies.forEach(dependency -> dependencyCount.merge(dependency.getTaskDefinitionId(), 1, Integer::sum));

        JsonNode input = request == null || request.input() == null
                ? objectMapper.createObjectNode()
                : request.input();
        var now = Instant.now();
        var run = runRepository.save(new WorkflowRunEntity(UUID.randomUUID(), workflowId, writeJson(input), now));

        var runsByDefinition = new HashMap<UUID, TaskRunEntity>();
        for (var definition : definitions) {
            var status = dependencyCount.containsKey(definition.getId()) ? TaskStatus.BLOCKED : TaskStatus.QUEUED;
            var taskRun = new TaskRunEntity(
                    UUID.randomUUID(), run.getId(), definition.getId(), definition.getTaskKey(),
                    definition.getTaskType(), definition.getHandler(), status, definition.getPriority(),
                    definition.getMaxAttempts(), definition.getTimeoutSeconds(),
                    executionPayload(input, definition.getPayloadJson()), now);
            runsByDefinition.put(definition.getId(), taskRun);
        }
        taskRunRepository.saveAll(runsByDefinition.values());

        taskDependencyRepository.saveAll(dependencies.stream()
                .map(dependency -> new TaskRunDependencyEntity(
                        UUID.randomUUID(), run.getId(),
                        runsByDefinition.get(dependency.getTaskDefinitionId()).getId(),
                        runsByDefinition.get(dependency.getDependsOnTaskDefinitionId()).getId()))
                .toList());

        return view(run, taskRunRepository.findByWorkflowRunIdOrderByCreatedAtAsc(run.getId()));
    }

    @Transactional(readOnly = true)
    public java.util.List<ApiModels.RunResponse> list() {
        return runRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(run -> view(run, taskRunRepository.findByWorkflowRunIdOrderByCreatedAtAsc(run.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiModels.RunResponse get(UUID runId) {
        var run = runRepository.findById(runId)
                .orElseThrow(() -> new EntityNotFoundException("workflow run not found: " + runId));
        return view(run, taskRunRepository.findByWorkflowRunIdOrderByCreatedAtAsc(runId));
    }

    @Transactional
    public ApiModels.RunResponse cancel(UUID runId) {
        var run = runRepository.findForUpdate(runId)
                .orElseThrow(() -> new EntityNotFoundException("workflow run not found: " + runId));
        if (run.getStatus() == WorkflowStatus.RUNNING) {
            run.cancel(Instant.now());
            taskLeaseDao.cancelTasks(runId);
        }
        return view(run, taskRunRepository.findByWorkflowRunIdOrderByCreatedAtAsc(runId));
    }

    private ApiModels.RunResponse view(WorkflowRunEntity run, java.util.List<TaskRunEntity> tasks) {
        return new ApiModels.RunResponse(
                run.getId(), run.getWorkflowDefinitionId(), run.getStatus(),
                run.getCreatedAt(), run.getStartedAt(), run.getFinishedAt(),
                tasks.stream().map(task -> new ApiModels.TaskRunResponse(
                        task.getId(), task.getTaskKey(), task.getTaskType(), task.getHandler(),
                        task.getStatus(), task.getAttempt(), task.getMaxAttempts(), task.getProgress(),
                        task.getProgressMessage(), task.getResultJson(), task.getErrorMessage(),
                        task.getStartedAt(), task.getFinishedAt()))
                        .toList());
    }

    private String executionPayload(JsonNode input, String taskPayloadJson) {
        try {
            var payload = objectMapper.createObjectNode();
            payload.set("workflowInput", input);
            payload.set("task", objectMapper.readTree(taskPayloadJson));
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to prepare task payload", exception);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to serialize run input", exception);
        }
    }
}
