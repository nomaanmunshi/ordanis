package dev.ordanis.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ordanis.engine.WorkflowCompiler;
import dev.ordanis.engine.model.TaskSpec;
import dev.ordanis.engine.model.WorkflowSpec;
import dev.ordanis.server.api.ApiModels;
import dev.ordanis.server.domain.WorkflowDefinitionEntity;
import dev.ordanis.server.domain.WorkflowTaskDefinitionEntity;
import dev.ordanis.server.domain.WorkflowTaskDependencyEntity;
import dev.ordanis.server.repository.WorkflowDefinitionRepository;
import dev.ordanis.server.repository.WorkflowTaskDefinitionRepository;
import dev.ordanis.server.repository.WorkflowTaskDependencyRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WorkflowService {
    private final WorkflowCompiler compiler = new WorkflowCompiler();
    private final ObjectMapper objectMapper;
    private final WorkflowDefinitionRepository workflowRepository;
    private final WorkflowTaskDefinitionRepository taskRepository;
    private final WorkflowTaskDependencyRepository dependencyRepository;

    public WorkflowService(
            ObjectMapper objectMapper,
            WorkflowDefinitionRepository workflowRepository,
            WorkflowTaskDefinitionRepository taskRepository,
            WorkflowTaskDependencyRepository dependencyRepository) {
        this.objectMapper = objectMapper;
        this.workflowRepository = workflowRepository;
        this.taskRepository = taskRepository;
        this.dependencyRepository = dependencyRepository;
    }

    @Transactional(readOnly = true)
    public List<ApiModels.WorkflowSummaryResponse> list() {
        return workflowRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(workflow -> new ApiModels.WorkflowSummaryResponse(
                        workflow.getId(), workflow.getName(), workflow.getDefinitionVersion(),
                        taskRepository.findByWorkflowDefinitionIdOrderByExecutionLevelAscTaskKeyAsc(workflow.getId()).size(),
                        workflow.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiModels.WorkflowDetailResponse get(UUID workflowId) {
        var workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new EntityNotFoundException("workflow not found: " + workflowId));
        var tasks = taskRepository.findByWorkflowDefinitionIdOrderByExecutionLevelAscTaskKeyAsc(workflowId);
        var dependencies = dependencyRepository.findByWorkflowDefinitionId(workflowId);
        var taskKeyById = new HashMap<UUID, String>();
        tasks.forEach(task -> taskKeyById.put(task.getId(), task.getTaskKey()));
        var dependenciesByTask = new HashMap<UUID, List<String>>();
        dependencies.forEach(dependency -> dependenciesByTask
                .computeIfAbsent(dependency.getTaskDefinitionId(), ignored -> new ArrayList<>())
                .add(taskKeyById.get(dependency.getDependsOnTaskDefinitionId())));

        var levels = tasks.stream().collect(java.util.stream.Collectors.groupingBy(
                WorkflowTaskDefinitionEntity::getExecutionLevel,
                java.util.TreeMap::new,
                java.util.stream.Collectors.mapping(WorkflowTaskDefinitionEntity::getTaskKey, java.util.stream.Collectors.toList())))
                .values().stream().toList();

        return new ApiModels.WorkflowDetailResponse(
                workflow.getId(), workflow.getName(), workflow.getDefinitionVersion(),
                tasks.stream().map(task -> new ApiModels.TaskDefinitionResponse(
                        task.getTaskKey(), task.getTaskType(), task.getHandler(),
                        dependenciesByTask.getOrDefault(task.getId(), List.of()), task.getPriority(),
                        task.getMaxAttempts(), task.getTimeoutSeconds(), readJson(task.getPayloadJson()),
                        task.getExecutionLevel())).toList(),
                levels, workflow.getCreatedAt());
    }

    @Transactional
    public ApiModels.WorkflowResponse create(ApiModels.CreateWorkflowRequest request) {
        var spec = new WorkflowSpec(request.name(), request.tasks().stream()
                .map(task -> new TaskSpec(
                        task.id(), task.type(), task.handler(), task.dependencies(),
                        task.resolvedPriority(), task.resolvedMaxAttempts(),
                        task.resolvedTimeoutSeconds(), toMap(task.payload())))
                .toList());
        var compiled = compiler.compile(spec);

        int version = workflowRepository.findTopByNameOrderByDefinitionVersionDesc(request.name())
                .map(existing -> existing.getDefinitionVersion() + 1)
                .orElse(1);
        var now = Instant.now();
        var workflowId = UUID.randomUUID();
        var workflow = workflowRepository.save(new WorkflowDefinitionEntity(
                workflowId, request.name(), version, writeJson(request), now));

        var definitionsByKey = new HashMap<String, WorkflowTaskDefinitionEntity>();
        for (var task : compiled.tasks()) {
            var entity = new WorkflowTaskDefinitionEntity(
                    UUID.randomUUID(), workflowId, task.id(), task.type(), task.handler(),
                    task.priority(), task.maxAttempts(), task.timeoutSeconds(),
                    writeJson(task.payload()), task.level());
            definitionsByKey.put(task.id(), entity);
        }
        taskRepository.saveAll(definitionsByKey.values());

        dependencyRepository.saveAll(compiled.tasks().stream()
                .flatMap(task -> task.dependsOn().stream().map(parent ->
                        new WorkflowTaskDependencyEntity(
                                UUID.randomUUID(), workflowId,
                                definitionsByKey.get(task.id()).getId(),
                                definitionsByKey.get(parent).getId())))
                .toList());

        return new ApiModels.WorkflowResponse(
                workflow.getId(), workflow.getName(), workflow.getDefinitionVersion(),
                compiled.executionLevels(), workflow.getCreatedAt());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(JsonNode payload) {
        if (payload == null || payload.isNull()) return Map.of();
        return objectMapper.convertValue(payload, Map.class);
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to read workflow payload", exception);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to serialize workflow", exception);
        }
    }
}
