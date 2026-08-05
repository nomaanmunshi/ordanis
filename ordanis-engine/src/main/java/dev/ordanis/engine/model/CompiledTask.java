package dev.ordanis.engine.model;

import java.util.List;
import java.util.Map;

public record CompiledTask(
        String id,
        String type,
        String handler,
        List<String> dependsOn,
        int level,
        int priority,
        int maxAttempts,
        int timeoutSeconds,
        Map<String, Object> payload
) {}
