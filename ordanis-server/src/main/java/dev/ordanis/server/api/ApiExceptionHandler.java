package dev.ordanis.server.api;

import dev.ordanis.engine.WorkflowValidationException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(WorkflowValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiModels.ErrorResponse workflowValidation(WorkflowValidationException exception) {
        return new ApiModels.ErrorResponse("INVALID_WORKFLOW", exception.getMessage(), exception.errors());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiModels.ErrorResponse requestValidation(MethodArgumentNotValidException exception) {
        var details = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        return new ApiModels.ErrorResponse("INVALID_REQUEST", "request validation failed", details);
    }


    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiModels.ErrorResponse invalidArgument(IllegalArgumentException exception) {
        return new ApiModels.ErrorResponse("INVALID_REQUEST", exception.getMessage(), List.of());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ApiModels.ErrorResponse notFound(EntityNotFoundException exception) {
        return new ApiModels.ErrorResponse("NOT_FOUND", exception.getMessage(), List.of());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    ApiModels.ErrorResponse conflict(IllegalStateException exception) {
        return new ApiModels.ErrorResponse("INVALID_STATE", exception.getMessage(), List.of());
    }
}
