package dev.ordanis.engine.model;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record TaskSpec(
        String id,
        String type,
        String handler,
        List<String> dependsOn,
        int priority,
        int maxAttempts,
        int timeoutSeconds,
        Map<String, Object> payload
) {
    public TaskSpec {
        dependsOn = dependsOn == null ? List.of() : List.copyOf(dependsOn);
        payload = payload == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(payload));
        if (priority < 0) throw new IllegalArgumentException("priority must be >= 0");
        if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts must be >= 1");
        if (timeoutSeconds < 1) throw new IllegalArgumentException("timeoutSeconds must be >= 1");
    }
}
