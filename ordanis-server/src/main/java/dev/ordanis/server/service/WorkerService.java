package dev.ordanis.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ordanis.server.api.ApiModels;
import dev.ordanis.server.domain.WorkerNodeEntity;
import dev.ordanis.server.repository.WorkerNodeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class WorkerService {
    private static final Duration OFFLINE_AFTER = Duration.ofSeconds(30);

    private final ObjectMapper objectMapper;
    private final WorkerNodeRepository workerRepository;
    private final dev.ordanis.server.repository.TaskRunRepository taskRunRepository;

    public WorkerService(ObjectMapper objectMapper, WorkerNodeRepository workerRepository,
                         dev.ordanis.server.repository.TaskRunRepository taskRunRepository) {
        this.objectMapper = objectMapper;
        this.workerRepository = workerRepository;
        this.taskRunRepository = taskRunRepository;
    }

    @Transactional
    public UUID register(UUID requestedId, String name, List<String> capabilities, int maxSlots) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("worker name is required");
        if (capabilities == null || capabilities.isEmpty()) {
            throw new IllegalArgumentException("worker capabilities are required");
        }
        if (capabilities.stream().anyMatch(value -> value == null || value.isBlank())) {
            throw new IllegalArgumentException("worker capabilities cannot be blank");
        }
        if (maxSlots < 1) throw new IllegalArgumentException("maxSlots must be >= 1");

        var workerId = requestedId == null ? UUID.randomUUID() : requestedId;
        var now = Instant.now();
        var capabilitiesJson = writeJson(capabilities.stream().distinct().toList());
        var worker = workerRepository.findById(workerId)
                .orElseGet(() -> new WorkerNodeEntity(workerId, name, capabilitiesJson, maxSlots, now));
        worker.touch(name, capabilitiesJson, maxSlots, now);
        workerRepository.save(worker);
        return workerId;
    }

    @Transactional
    public void seen(UUID workerId) {
        if (workerRepository.touch(workerId, Instant.now()) == 0) {
            throw new EntityNotFoundException("worker not registered: " + workerId);
        }
    }

    @Transactional
    public LeaseProfile lockForLease(UUID workerId) {
        var worker = workerRepository.findForUpdate(workerId)
                .orElseThrow(() -> new EntityNotFoundException("worker not registered: " + workerId));
        worker.seen(Instant.now());
        return new LeaseProfile(readCapabilities(worker.getCapabilitiesJson()), worker.getMaxSlots());
    }

    @Transactional(readOnly = true)
    public List<ApiModels.WorkerResponse> list() {
        var offlineBefore = Instant.now().minus(OFFLINE_AFTER);
        return workerRepository.findAllByOrderByLastSeenAtDesc().stream()
                .map(worker -> new ApiModels.WorkerResponse(
                        worker.getId(), worker.getName(), readCapabilities(worker.getCapabilitiesJson()),
                        worker.getMaxSlots(), taskRunRepository.countByWorkerIdAndStatus(worker.getId(), dev.ordanis.engine.state.TaskStatus.RUNNING),
                        worker.getLastSeenAt().isBefore(offlineBefore) ? "OFFLINE" : "ONLINE",
                        worker.getLastSeenAt()))
                .toList();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to serialize worker capabilities", exception);
        }
    }

    private List<String> readCapabilities(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("failed to read worker capabilities", exception);
        }
    }

    public record LeaseProfile(List<String> capabilities, int maxSlots) {}
}
