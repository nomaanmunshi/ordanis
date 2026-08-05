package dev.ordanis.engine.state;

public enum TaskStatus {
    BLOCKED,
    QUEUED,
    RUNNING,
    RETRY_WAIT,
    SUCCEEDED,
    FAILED,
    TIMED_OUT,
    CANCELLED;

    public boolean terminal() {
        return this == SUCCEEDED || this == FAILED || this == TIMED_OUT || this == CANCELLED;
    }
}
