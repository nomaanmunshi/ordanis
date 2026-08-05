package dev.ordanis.worker;

@FunctionalInterface
public interface TaskHandler {
    String execute(TaskContext context, String payloadJson) throws Exception;
}
