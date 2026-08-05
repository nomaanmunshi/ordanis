package dev.ordanis.worker;

import java.time.Duration;
import java.util.List;

public record WorkerConfig(
        String host,
        int port,
        String name,
        List<String> capabilities,
        int maxConcurrency,
        Duration leaseDuration,
        Duration pollInterval
) {
    public WorkerConfig {
        if (host == null || host.isBlank()) throw new IllegalArgumentException("host is required");
        if (port < 1 || port > 65535) throw new IllegalArgumentException("port is invalid");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("worker name is required");
        if (capabilities == null || capabilities.isEmpty()) {
            throw new IllegalArgumentException("at least one capability is required");
        }
        if (capabilities.stream().anyMatch(value -> value == null || value.isBlank())) {
            throw new IllegalArgumentException("capabilities cannot be blank");
        }
        if (maxConcurrency < 1) throw new IllegalArgumentException("maxConcurrency must be >= 1");
        if (leaseDuration == null || leaseDuration.compareTo(Duration.ofSeconds(5)) < 0) {
            throw new IllegalArgumentException("leaseDuration must be >= 5 seconds");
        }
        if (pollInterval == null || pollInterval.isZero() || pollInterval.isNegative()) {
            throw new IllegalArgumentException("pollInterval must be positive");
        }
        capabilities = capabilities.stream().distinct().toList();
    }

    public static WorkerConfig local(String name, List<String> capabilities) {
        return new WorkerConfig(
                "localhost", 9090, name, capabilities, 2,
                Duration.ofSeconds(30), Duration.ofMillis(300));
    }
}
