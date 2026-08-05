package dev.ordanis.worker;

import java.util.concurrent.atomic.AtomicBoolean;

public final class TaskContext {
    private final String taskRunId;
    private final String workflowRunId;
    private final String taskKey;
    private final int attempt;
    private final AtomicBoolean cancellationRequested;
    private final ProgressReporter progressReporter;

    TaskContext(
            String taskRunId, String workflowRunId, String taskKey, int attempt,
            AtomicBoolean cancellationRequested, ProgressReporter progressReporter) {
        this.taskRunId = taskRunId;
        this.workflowRunId = workflowRunId;
        this.taskKey = taskKey;
        this.attempt = attempt;
        this.cancellationRequested = cancellationRequested;
        this.progressReporter = progressReporter;
    }

    public String taskRunId() { return taskRunId; }
    public String workflowRunId() { return workflowRunId; }
    public String taskKey() { return taskKey; }
    public int attempt() { return attempt; }
    public boolean isCancellationRequested() { return cancellationRequested.get(); }

    public void throwIfCancellationRequested() {
        if (isCancellationRequested()) throw new TaskCancelledException();
    }

    public void reportProgress(int percent, String message) {
        progressReporter.report(percent, message);
    }

    @FunctionalInterface
    interface ProgressReporter {
        void report(int percent, String message);
    }
}
