package dev.ordanis.worker;

public final class TaskCancelledException extends RuntimeException {
    public TaskCancelledException() {
        super("task cancellation requested");
    }
}
