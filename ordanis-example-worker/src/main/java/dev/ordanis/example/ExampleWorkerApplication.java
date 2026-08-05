package dev.ordanis.example;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ordanis.worker.WorkerClient;
import dev.ordanis.worker.WorkerConfig;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;

public final class ExampleWorkerApplication {
    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws InterruptedException {
        var config = new WorkerConfig(
                env("ORDANIS_HOST", "localhost"),
                Integer.parseInt(env("ORDANIS_PORT", "9090")),
                env("WORKER_NAME", "example-worker"),
                List.of("JAVA"),
                4,
                Duration.ofSeconds(30),
                Duration.ofMillis(250));

        var stopped = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread(stopped::countDown));

        try (var worker = new WorkerClient(config)
                .registerHandler("echo", (context, payload) -> payload)
                .registerHandler("uppercase", (context, payload) -> {
                    JsonNode task = JSON.readTree(payload).path("task");
                    return JSON.createObjectNode()
                            .put("value", task.path("value").asText().toUpperCase())
                            .toString();
                })
                .registerHandler("sleep", (context, payload) -> {
                    long delayMs = JSON.readTree(payload).path("task").path("delayMs").asLong(1000);
                    int steps = 10;
                    for (int step = 1; step <= steps; step++) {
                        context.throwIfCancellationRequested();
                        Thread.sleep(Math.max(delayMs / steps, 1));
                        context.reportProgress(step * 10, "step " + step + "/" + steps);
                    }
                    return "{\"sleptMs\":" + delayMs + "}";
                })) {
            worker.start();
            stopped.await();
        }
    }

    private static String env(String name, String fallback) {
        return System.getenv().getOrDefault(name, fallback);
    }
}
