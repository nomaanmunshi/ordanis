package dev.ordanis.server.service;

import dev.ordanis.engine.state.TaskStatus;
import dev.ordanis.server.persistence.TaskLeaseDao;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaseRecoveryService {
    private final TaskLeaseDao taskLeaseDao;

    public LeaseRecoveryService(TaskLeaseDao taskLeaseDao) {
        this.taskLeaseDao = taskLeaseDao;
    }

    @Scheduled(fixedDelayString = "${ordanis.scheduler.recovery-interval-ms:1000}")
    @Transactional
    public void recoverExpiredLeases() {
        taskLeaseDao.recoverExpired(100).stream()
                .filter(result -> result.status() == TaskStatus.TIMED_OUT)
                .map(TaskLeaseDao.RecoveryResult::workflowRunId)
                .distinct()
                .forEach(taskLeaseDao::markWorkflowFailed);
        taskLeaseDao.queueAllReadyTasks();
        taskLeaseDao.markCompletedWorkflows();
    }
}
