package dev.ordanis.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ordanis.engine.RetryPolicy;
import dev.ordanis.engine.state.TaskStatus;
import dev.ordanis.server.domain.TaskRunEntity;
import dev.ordanis.server.persistence.TaskLeaseDao;
import dev.ordanis.server.repository.TaskRunRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaskExecutionService {
    private final RetryPolicy retryPolicy = new RetryPolicy(Duration.ofSeconds(1), Duration.ofSeconds(30));
    private final ObjectMapper objectMapper;
    private final TaskRunRepository taskRepository;
    private final TaskLeaseDao taskLeaseDao;
    private final WorkerService workerService;

    public TaskExecutionService(
            ObjectMapper objectMapper,
            TaskRunRepository taskRepository,
            TaskLeaseDao taskLeaseDao,
            WorkerService workerService) {
        this.objectMapper = objectMapper;
        this.taskRepository = taskRepository;
        this.taskLeaseDao = taskLeaseDao;
        this.workerService = workerService;
    }

    @Transactional
    public Optional<TaskLeaseDao.LeasedTask> lease(UUID workerId, Duration leaseDuration) {
        var worker = workerService.lockForLease(workerId);
        if (taskRepository.countByWorkerIdAndStatus(workerId, TaskStatus.RUNNING) >= worker.maxSlots()) {
            return Optional.empty();
        }
        return taskLeaseDao.lease(workerId, worker.capabilities(), leaseDuration);
    }

    @Transactional
    public Optional<TaskLeaseDao.HeartbeatResult> heartbeat(
            UUID workerId, UUID taskRunId, UUID leaseToken, Duration leaseDuration) {
        workerService.seen(workerId);
        return taskLeaseDao.heartbeat(workerId, taskRunId, leaseToken, leaseDuration);
    }

    @Transactional
    public boolean progress(
            UUID workerId, UUID taskRunId, UUID leaseToken, int percent, String message) {
        return taskLeaseDao.reportProgress(workerId, taskRunId, leaseToken, percent, message);
    }

    @Transactional
    public void complete(UUID workerId, UUID taskRunId, UUID leaseToken, String resultJson) {
        var task = lockedTask(taskRunId);
        requireLease(task, workerId, leaseToken);
        var now = Instant.now();

        if (task.isCancellationRequested()) {
            task.cancel(now);
            taskRepository.saveAndFlush(task);
            return;
        }

        task.succeed(validJson(resultJson), now);
        taskRepository.saveAndFlush(task);
        taskLeaseDao.queueReadyTasks(task.getWorkflowRunId());
        taskLeaseDao.markWorkflowSucceededIfComplete(task.getWorkflowRunId());
    }

    @Transactional
    public void fail(
            UUID workerId, UUID taskRunId, UUID leaseToken, String error, boolean retryable) {
        var task = lockedTask(taskRunId);
        requireLease(task, workerId, leaseToken);
        var now = Instant.now();

        if (task.isCancellationRequested()) {
            task.cancel(now);
            taskRepository.saveAndFlush(task);
        } else if (retryable && task.getAttempt() < task.getMaxAttempts()) {
            task.retry(error, now.plus(retryPolicy.delayForAttempt(task.getAttempt())));
            taskRepository.saveAndFlush(task);
        } else {
            task.fail(error, now);
            taskRepository.saveAndFlush(task);
            taskLeaseDao.markWorkflowFailed(task.getWorkflowRunId());
        }
    }

    private String validJson(String value) {
        if (value == null || value.isBlank()) return "{}";
        try {
            objectMapper.readTree(value);
            return value;
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("task result must be valid JSON");
        }
    }

    private TaskRunEntity lockedTask(UUID taskRunId) {
        return taskRepository.findForUpdate(taskRunId)
                .orElseThrow(() -> new EntityNotFoundException("task run not found: " + taskRunId));
    }

    private void requireLease(TaskRunEntity task, UUID workerId, UUID leaseToken) {
        if (task.getStatus() != TaskStatus.RUNNING
                || !Objects.equals(task.getWorkerId(), workerId)
                || !Objects.equals(task.getLeaseToken(), leaseToken)) {
            throw new IllegalStateException("task lease is no longer valid");
        }
        if (task.getLeaseUntil() == null || task.getLeaseUntil().isBefore(Instant.now())) {
            throw new IllegalStateException("task lease has expired");
        }
    }
}
