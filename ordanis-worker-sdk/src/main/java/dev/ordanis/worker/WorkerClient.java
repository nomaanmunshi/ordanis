package dev.ordanis.worker;

import dev.ordanis.protocol.worker.v1.CompleteTaskRequest;
import dev.ordanis.protocol.worker.v1.FailTaskRequest;
import dev.ordanis.protocol.worker.v1.HeartbeatRequest;
import dev.ordanis.protocol.worker.v1.LeaseTaskRequest;
import dev.ordanis.protocol.worker.v1.LeaseTaskResponse;
import dev.ordanis.protocol.worker.v1.ProgressRequest;
import dev.ordanis.protocol.worker.v1.RegisterWorkerRequest;
import dev.ordanis.protocol.worker.v1.WorkerGatewayGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.logging.Logger;

public final class WorkerClient implements AutoCloseable {
    private static final Logger LOG = Logger.getLogger(WorkerClient.class.getName());

    private final WorkerConfig config;
    private final ManagedChannel channel;
    private final WorkerGatewayGrpc.WorkerGatewayBlockingStub stub;
    private final Map<String, TaskHandler> handlers = new ConcurrentHashMap<>();
    private final ExecutorService taskExecutor;
    private final ScheduledExecutorService controlExecutor = Executors.newScheduledThreadPool(2);
    private final AtomicInteger activeTasks = new AtomicInteger();
    private final AtomicBoolean running = new AtomicBoolean();
    private volatile UUID workerId;

    public WorkerClient(WorkerConfig config) {
        this.config = config;
        this.channel = ManagedChannelBuilder.forAddress(config.host(), config.port())
                .usePlaintext()
                .build();
        this.stub = WorkerGatewayGrpc.newBlockingStub(channel);
        this.taskExecutor = Executors.newFixedThreadPool(config.maxConcurrency());
    }

    public WorkerClient registerHandler(String handlerName, TaskHandler handler) {
        if (handlers.putIfAbsent(handlerName, handler) != null) {
            throw new IllegalArgumentException("handler already registered: " + handlerName);
        }
        return this;
    }

    public void start() {
        if (!running.compareAndSet(false, true)) return;
        try {
            workerId = register();
        } catch (RuntimeException exception) {
            running.set(false);
            throw exception;
        }
        controlExecutor.scheduleWithFixedDelay(
                this::pollSafely, 0, config.pollInterval().toMillis(), TimeUnit.MILLISECONDS);
        LOG.info(() -> "Ordanis worker started: " + workerId);
    }


    private UUID register() {
        RuntimeException lastFailure = null;
        for (int attempt = 0; attempt < 30 && running.get(); attempt++) {
            try {
                var response = stub.registerWorker(RegisterWorkerRequest.newBuilder()
                        .setName(config.name())
                        .addAllCapabilities(config.capabilities())
                        .setMaxSlots(config.maxConcurrency())
                        .build());
                return UUID.fromString(response.getWorkerId());
            } catch (RuntimeException exception) {
                lastFailure = exception;
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("worker registration interrupted", interrupted);
                }
            }
        }
        throw new IllegalStateException("could not register worker", lastFailure);
    }

    private void pollSafely() {
        if (!running.get()) return;
        try {
            while (activeTasks.get() < config.maxConcurrency()) {
                var lease = stub.leaseTask(LeaseTaskRequest.newBuilder()
                        .setWorkerId(workerId.toString())
                        .setLeaseSeconds(Math.toIntExact(config.leaseDuration().toSeconds()))
                        .build());
                if (!lease.getFound()) return;
                activeTasks.incrementAndGet();
                taskExecutor.submit(() -> execute(lease));
            }
        } catch (Exception exception) {
            LOG.log(Level.FINE, "worker poll failed", exception);
        }
    }

    private void execute(LeaseTaskResponse lease) {
        var cancelled = new AtomicBoolean();
        var executingThread = Thread.currentThread();
        ScheduledFuture<?> heartbeat = controlExecutor.scheduleWithFixedDelay(
                () -> heartbeat(lease, cancelled, executingThread),
                heartbeatInterval().toSeconds(),
                heartbeatInterval().toSeconds(),
                TimeUnit.SECONDS);
        ScheduledFuture<?> timeout = controlExecutor.schedule(() -> {
            cancelled.set(true);
            executingThread.interrupt();
        }, lease.getTimeoutSeconds(), TimeUnit.SECONDS);

        try {
            var handler = handlers.get(lease.getHandler());
            if (handler == null) {
                fail(lease, "unknown handler: " + lease.getHandler(), false);
                return;
            }

            var context = new TaskContext(
                    lease.getTaskRunId(), lease.getWorkflowRunId(), lease.getTaskKey(), lease.getAttempt(),
                    cancelled, (percent, message) -> progress(lease, percent, message));
            var result = handler.execute(context, lease.getPayloadJson());
            if (cancelled.get()) fail(lease, "task cancelled or timed out", true);
            else complete(lease, result);
        } catch (TaskCancelledException exception) {
            fail(lease, exception.getMessage(), false);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            fail(lease, "task interrupted", true);
        } catch (Exception exception) {
            fail(lease, safeMessage(exception), true);
        } finally {
            heartbeat.cancel(false);
            timeout.cancel(false);
            activeTasks.decrementAndGet();
            Thread.interrupted();
        }
    }

    private void heartbeat(LeaseTaskResponse lease, AtomicBoolean cancelled, Thread executingThread) {
        try {
            var response = stub.heartbeat(HeartbeatRequest.newBuilder()
                    .setWorkerId(workerId.toString())
                    .setTaskRunId(lease.getTaskRunId())
                    .setLeaseToken(lease.getLeaseToken())
                    .setLeaseSeconds(Math.toIntExact(config.leaseDuration().toSeconds()))
                    .build());
            if (!response.getAccepted() || response.getCancelRequested()) {
                cancelled.set(true);
                executingThread.interrupt();
            }
        } catch (Exception exception) {
            LOG.log(Level.FINE, "heartbeat failed", exception);
        }
    }

    private void progress(LeaseTaskResponse lease, int percent, String message) {
        try {
            stub.reportProgress(ProgressRequest.newBuilder()
                    .setWorkerId(workerId.toString())
                    .setTaskRunId(lease.getTaskRunId())
                    .setLeaseToken(lease.getLeaseToken())
                    .setPercent(percent)
                    .setMessage(message == null ? "" : message)
                    .build());
        } catch (Exception exception) {
            LOG.log(Level.FINE, "progress update failed", exception);
        }
    }

    private void complete(LeaseTaskResponse lease, String resultJson) {
        stub.completeTask(CompleteTaskRequest.newBuilder()
                .setWorkerId(workerId.toString())
                .setTaskRunId(lease.getTaskRunId())
                .setLeaseToken(lease.getLeaseToken())
                .setResultJson(resultJson == null || resultJson.isBlank() ? "{}" : resultJson)
                .build());
    }

    private void fail(LeaseTaskResponse lease, String error, boolean retryable) {
        try {
            stub.failTask(FailTaskRequest.newBuilder()
                    .setWorkerId(workerId.toString())
                    .setTaskRunId(lease.getTaskRunId())
                    .setLeaseToken(lease.getLeaseToken())
                    .setErrorMessage(error)
                    .setRetryable(retryable)
                    .build());
        } catch (Exception exception) {
            LOG.log(Level.WARNING, "failed to report task failure", exception);
        }
    }

    private Duration heartbeatInterval() {
        return config.leaseDuration().dividedBy(3);
    }

    private String safeMessage(Exception exception) {
        return exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage();
    }

    @Override
    public void close() {
        running.set(false);
        taskExecutor.shutdown();
        try {
            if (!taskExecutor.awaitTermination(10, TimeUnit.SECONDS)) taskExecutor.shutdownNow();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            taskExecutor.shutdownNow();
        }
        controlExecutor.shutdownNow();
        channel.shutdown();
        try {
            if (!channel.awaitTermination(5, TimeUnit.SECONDS)) channel.shutdownNow();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            channel.shutdownNow();
        }
    }
}
