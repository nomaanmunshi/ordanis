package dev.ordanis.server.api;

import dev.ordanis.server.service.RunService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RunController {
    private final RunService runService;

    public RunController(RunService runService) {
        this.runService = runService;
    }

    @GetMapping("/runs")
    public List<ApiModels.RunResponse> list() {
        return runService.list();
    }

    @PostMapping("/workflows/{workflowId}/runs")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiModels.RunResponse start(
            @PathVariable UUID workflowId,
            @RequestBody(required = false) ApiModels.StartRunRequest request) {
        return runService.start(workflowId, request);
    }

    @GetMapping("/runs/{runId}")
    public ApiModels.RunResponse get(@PathVariable UUID runId) {
        return runService.get(runId);
    }

    @PostMapping("/runs/{runId}/cancel")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiModels.RunResponse cancel(@PathVariable UUID runId) {
        return runService.cancel(runId);
    }
}
