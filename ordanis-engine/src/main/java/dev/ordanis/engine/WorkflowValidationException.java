package dev.ordanis.engine;

import java.util.List;

public final class WorkflowValidationException extends RuntimeException {
    private final List<String> errors;

    public WorkflowValidationException(List<String> errors) {
        super(String.join("; ", errors));
        this.errors = List.copyOf(errors);
    }

    public List<String> errors() {
        return errors;
    }
}
