package dev.ordanis.server.grpc;

import dev.ordanis.protocol.worker.v1.Ack;
import dev.ordanis.protocol.worker.v1.CompleteTaskRequest;
import dev.ordanis.protocol.worker.v1.FailTaskRequest;
import dev.ordanis.protocol.worker.v1.HeartbeatRequest;
import dev.ordanis.protocol.worker.v1.HeartbeatResponse;
import dev.ordanis.protocol.worker.v1.LeaseTaskRequest;
import dev.ordanis.protocol.worker.v1.LeaseTaskResponse;
import dev.ordanis.protocol.worker.v1.ProgressRequest;
import dev.ordanis.protocol.worker.v1.RegisterWorkerRequest;
import dev.ordanis.protocol.worker.v1.RegisterWorkerResponse;
import dev.ordanis.protocol.worker.v1.WorkerGatewayGrpc;
import dev.ordanis.server.service.TaskExecutionService;
import dev.ordanis.server.service.WorkerService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class WorkerGatewayService extends WorkerGatewayGrpc.WorkerGatewayImplBase {
    private final WorkerService workerService;
    private final TaskExecutionService taskExecutionService;

    public WorkerGatewayService(WorkerService workerService, TaskExecutionService taskExecutionService) {
        this.workerService = workerService;
        this.taskExecutionService = taskExecutionService;
    }

    @Override
    public void registerWorker(RegisterWorkerRequest request, StreamObserver<RegisterWorkerResponse> observer) {
        invoke(observer, () -> {
            UUID requestedId = request.getWorkerId().isBlank() ? null : UUID.fromString(request.getWorkerId());
            var workerId = workerService.register(
                    requestedId, request.getName(), request.getCapabilitiesList(),
                    Math.max(request.getMaxSlots(), 1));
            return RegisterWorkerResponse.newBuilder().setWorkerId(workerId.toString()).build();
        });
    }

    @Override
    public void leaseTask(LeaseTaskRequest request, StreamObserver<LeaseTaskResponse> observer) {
        invoke(observer, () -> taskExecutionService.lease(
                        UUID.fromString(request.getWorkerId()),
                        leaseDuration(request.getLeaseSeconds()))
                .map(lease -> LeaseTaskResponse.newBuilder()
                        .setFound(true)
                        .setTaskRunId(lease.taskRunId().toString())
                        .setWorkflowRunId(lease.workflowRunId().toString())
                        .setTaskKey(lease.taskKey())
                        .setType(lease.type())
                        .setHandler(lease.handler())
                        .setPayloadJson(lease.payloadJson())
                        .setLeaseToken(lease.leaseToken().toString())
                        .setAttempt(lease.attempt())
                        .setTimeoutSeconds(lease.timeoutSeconds())
                        .setLeaseUntilEpochMillis(lease.leaseUntil().toEpochMilli())
                        .build())
                .orElseGet(() -> LeaseTaskResponse.newBuilder().setFound(false).build()));
    }

    @Override
    public void heartbeat(HeartbeatRequest request, StreamObserver<HeartbeatResponse> observer) {
        invoke(observer, () -> taskExecutionService.heartbeat(
                        UUID.fromString(request.getWorkerId()),
                        UUID.fromString(request.getTaskRunId()),
                        UUID.fromString(request.getLeaseToken()),
                        leaseDuration(request.getLeaseSeconds()))
                .map(result -> HeartbeatResponse.newBuilder()
                        .setAccepted(true)
                        .setCancelRequested(result.cancellationRequested())
                        .setLeaseUntilEpochMillis(result.leaseUntil().toEpochMilli())
                        .build())
                .orElseGet(() -> HeartbeatResponse.newBuilder().setAccepted(false).build()));
    }

    @Override
    public void reportProgress(ProgressRequest request, StreamObserver<Ack> observer) {
        invoke(observer, () -> ack(taskExecutionService.progress(
                UUID.fromString(request.getWorkerId()),
                UUID.fromString(request.getTaskRunId()),
                UUID.fromString(request.getLeaseToken()),
                request.getPercent(), request.getMessage()), "progress rejected"));
    }

    @Override
    public void completeTask(CompleteTaskRequest request, StreamObserver<Ack> observer) {
        invoke(observer, () -> {
            taskExecutionService.complete(
                    UUID.fromString(request.getWorkerId()),
                    UUID.fromString(request.getTaskRunId()),
                    UUID.fromString(request.getLeaseToken()),
                    request.getResultJson());
            return ack(true, "");
        });
    }

    @Override
    public void failTask(FailTaskRequest request, StreamObserver<Ack> observer) {
        invoke(observer, () -> {
            taskExecutionService.fail(
                    UUID.fromString(request.getWorkerId()),
                    UUID.fromString(request.getTaskRunId()),
                    UUID.fromString(request.getLeaseToken()),
                    request.getErrorMessage(), request.getRetryable());
            return ack(true, "");
        });
    }

    private Duration leaseDuration(int requestedSeconds) {
        return Duration.ofSeconds(Math.max(5, Math.min(requestedSeconds, 120)));
    }

    private Ack ack(boolean accepted, String message) {
        return Ack.newBuilder().setAccepted(accepted).setMessage(message).build();
    }

    private <T> void invoke(StreamObserver<T> observer, CheckedSupplier<T> supplier) {
        try {
            observer.onNext(supplier.get());
            observer.onCompleted();
        } catch (IllegalArgumentException exception) {
            observer.onError(Status.INVALID_ARGUMENT.withDescription(exception.getMessage()).asRuntimeException());
        } catch (Exception exception) {
            observer.onError(Status.FAILED_PRECONDITION.withDescription(exception.getMessage()).asRuntimeException());
        }
    }

    @FunctionalInterface
    private interface CheckedSupplier<T> {
        T get() throws Exception;
    }
}
