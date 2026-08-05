package dev.ordanis.engine.model;

import java.util.List;

public record WorkflowSpec(String name, List<TaskSpec> tasks) {
    public WorkflowSpec {
        tasks = tasks == null ? List.of() : List.copyOf(tasks);
    }
}
