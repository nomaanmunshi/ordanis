package dev.ordanis.server.api;

import dev.ordanis.server.service.WorkflowService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/workflows")
public class WorkflowController {
    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<ApiModels.WorkflowSummaryResponse> list() {
        return workflowService.list();
    }

    @GetMapping("/{workflowId}")
    public ApiModels.WorkflowDetailResponse get(@PathVariable UUID workflowId) {
        return workflowService.get(workflowId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiModels.WorkflowResponse create(@Valid @RequestBody ApiModels.CreateWorkflowRequest request) {
        return workflowService.create(request);
    }
}
