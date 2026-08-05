package dev.ordanis.engine.model;

import java.util.List;
import java.util.Map;

public record CompiledWorkflow(
        String name,
        List<CompiledTask> tasks,
        List<List<String>> executionLevels,
        Map<String, List<String>> dependents
) {}
