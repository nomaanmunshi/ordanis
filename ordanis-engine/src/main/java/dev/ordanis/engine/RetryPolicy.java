package dev.ordanis.engine;

import java.time.Duration;

public final class RetryPolicy {
    private final Duration base;
    private final Duration max;

    public RetryPolicy(Duration base, Duration max) {
        this.base = base;
        this.max = max;
    }

    public Duration delayForAttempt(int attempt) {
        long multiplier = 1L << Math.min(Math.max(attempt - 1, 0), 20);
        long millis = Math.min(base.toMillis() * multiplier, max.toMillis());
        return Duration.ofMillis(millis);
    }
}
