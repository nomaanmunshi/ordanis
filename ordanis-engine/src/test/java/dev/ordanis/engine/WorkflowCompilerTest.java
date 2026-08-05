package dev.ordanis.engine;

import dev.ordanis.engine.model.TaskSpec;
import dev.ordanis.engine.model.WorkflowSpec;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorkflowCompilerTest {
    private final WorkflowCompiler compiler = new WorkflowCompiler();

    @Test
    void calculatesParallelExecutionLevels() {
        var workflow = new WorkflowSpec("document", List.of(
                task("upload"),
                task("scan", "upload"),
                task("extract", "upload"),
                task("classify", "extract", "scan"),
                task("notify", "classify")
        ));

        var compiled = compiler.compile(workflow);

        assertThat(compiled.executionLevels()).containsExactly(
                List.of("upload"),
                List.of("scan", "extract"),
                List.of("classify"),
                List.of("notify"));
    }

    @Test
    void rejectsMissingDependency() {
        assertThatThrownBy(() -> compiler.compile(new WorkflowSpec("bad", List.of(task("a", "missing")))))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("missing dependency");
    }

    @Test
    void rejectsCycles() {
        var workflow = new WorkflowSpec("cycle", List.of(task("a", "b"), task("b", "a")));
        assertThatThrownBy(() -> compiler.compile(workflow))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("cycle detected");
    }


    @Test
    void rejectsDuplicateDependencies() {
        assertThatThrownBy(() -> compiler.compile(new WorkflowSpec("duplicate-dependency", List.of(
                task("a"), task("b", "a", "a")))))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("duplicate dependency");
    }

    @Test
    void rejectsDuplicateIds() {
        assertThatThrownBy(() -> compiler.compile(new WorkflowSpec("duplicate", List.of(task("a"), task("a")))))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("duplicate task id");
    }

    private static TaskSpec task(String id, String... dependencies) {
        return new TaskSpec(id, "JAVA", id, List.of(dependencies), 0, 3, 30, Map.of());
    }
}
