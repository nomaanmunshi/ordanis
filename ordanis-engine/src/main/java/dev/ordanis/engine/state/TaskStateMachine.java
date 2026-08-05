package dev.ordanis.engine.state;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;

public final class TaskStateMachine {
    private static final Map<TaskStatus, EnumSet<TaskStatus>> ALLOWED = new EnumMap<>(TaskStatus.class);

    static {
        ALLOWED.put(TaskStatus.BLOCKED, EnumSet.of(TaskStatus.QUEUED, TaskStatus.CANCELLED));
        ALLOWED.put(TaskStatus.QUEUED, EnumSet.of(TaskStatus.RUNNING, TaskStatus.CANCELLED));
        ALLOWED.put(TaskStatus.RUNNING, EnumSet.of(
                TaskStatus.SUCCEEDED, TaskStatus.RETRY_WAIT, TaskStatus.FAILED,
                TaskStatus.TIMED_OUT, TaskStatus.CANCELLED));
        ALLOWED.put(TaskStatus.RETRY_WAIT, EnumSet.of(TaskStatus.RUNNING, TaskStatus.CANCELLED));
    }

    private TaskStateMachine() {}

    public static void require(TaskStatus from, TaskStatus to) {
        if (!ALLOWED.getOrDefault(from, EnumSet.noneOf(TaskStatus.class)).contains(to)) {
            throw new IllegalStateException("invalid task transition: " + from + " -> " + to);
        }
    }
}
