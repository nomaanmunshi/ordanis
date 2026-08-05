package dev.ordanis.server.config;

import dev.ordanis.server.grpc.WorkerGatewayService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class GrpcServerLifecycle implements SmartLifecycle {
    private final int port;
    private final WorkerGatewayService workerGatewayService;
    private volatile boolean running;
    private Server server;

    public GrpcServerLifecycle(
            @Value("${ordanis.grpc-port:9090}") int port,
            WorkerGatewayService workerGatewayService) {
        this.port = port;
        this.workerGatewayService = workerGatewayService;
    }

    @Override
    public void start() {
        try {
            server = ServerBuilder.forPort(port)
                    .addService(workerGatewayService)
                    .build()
                    .start();
            running = true;
        } catch (IOException exception) {
            throw new IllegalStateException("failed to start gRPC server on port " + port, exception);
        }
    }

    @Override
    public void stop() {
        running = false;
        if (server == null) return;
        server.shutdown();
        try {
            if (!server.awaitTermination(5, TimeUnit.SECONDS)) server.shutdownNow();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            server.shutdownNow();
        }
    }

    @Override
    public boolean isRunning() {
        return running;
    }
}
