package dev.ordanis.engine;

import dev.ordanis.engine.model.CompiledTask;
import dev.ordanis.engine.model.CompiledWorkflow;
import dev.ordanis.engine.model.TaskSpec;
import dev.ordanis.engine.model.WorkflowSpec;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class WorkflowCompiler {

    public CompiledWorkflow compile(WorkflowSpec workflow) {
        var errors = validateBasics(workflow);
        if (!errors.isEmpty()) throw new WorkflowValidationException(errors);

        var tasks = new LinkedHashMap<String, TaskSpec>();
        workflow.tasks().forEach(task -> tasks.put(task.id(), task));

        var indegree = new LinkedHashMap<String, Integer>();
        var dependents = new LinkedHashMap<String, List<String>>();
        tasks.keySet().forEach(id -> {
            indegree.put(id, 0);
            dependents.put(id, new ArrayList<>());
        });

        for (var task : tasks.values()) {
            for (var dependency : task.dependsOn()) {
                indegree.merge(task.id(), 1, Integer::sum);
                dependents.get(dependency).add(task.id());
            }
        }

        var queue = new ArrayDeque<String>();
        indegree.forEach((id, degree) -> { if (degree == 0) queue.add(id); });

        var levels = new ArrayList<List<String>>();
        var levelByTask = new HashMap<String, Integer>();
        int processed = 0;

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            var level = new ArrayList<String>(levelSize);
            int levelIndex = levels.size();

            for (int i = 0; i < levelSize; i++) {
                var id = queue.remove();
                level.add(id);
                levelByTask.put(id, levelIndex);
                processed++;

                for (var child : dependents.get(id)) {
                    if (indegree.merge(child, -1, Integer::sum) == 0) queue.add(child);
                }
            }
            levels.add(List.copyOf(level));
        }

        if (processed != tasks.size()) {
            var cyclic = indegree.entrySet().stream()
                    .filter(entry -> entry.getValue() > 0)
                    .map(Map.Entry::getKey)
                    .sorted()
                    .toList();
            throw new WorkflowValidationException(List.of("cycle detected among tasks: " + cyclic));
        }

        var compiledTasks = tasks.values().stream()
                .map(task -> new CompiledTask(
                        task.id(), task.type(), task.handler(), task.dependsOn(),
                        levelByTask.get(task.id()), task.priority(), task.maxAttempts(),
                        task.timeoutSeconds(), task.payload()))
                .toList();

        var immutableDependents = new LinkedHashMap<String, List<String>>();
        dependents.forEach((id, children) -> immutableDependents.put(id, List.copyOf(children)));

        return new CompiledWorkflow(
                workflow.name(),
                List.copyOf(compiledTasks),
                List.copyOf(levels),
                java.util.Collections.unmodifiableMap(immutableDependents));
    }

    private List<String> validateBasics(WorkflowSpec workflow) {
        if (workflow == null) return List.of("workflow is required");

        var errors = new ArrayList<String>();
        if (workflow.name() == null || workflow.name().isBlank()) errors.add("workflow name is required");
        if (workflow.tasks().isEmpty()) errors.add("workflow must contain at least one task");

        var ids = new HashSet<String>();
        for (var task : workflow.tasks()) {
            if (task == null) {
                errors.add("task is required");
                continue;
            }
            if (task.id() == null || task.id().isBlank()) errors.add("task id is required");
            else if (!ids.add(task.id())) errors.add("duplicate task id: " + task.id());
            if (task.type() == null || task.type().isBlank()) errors.add("task type is required for " + task.id());
            if (task.handler() == null || task.handler().isBlank()) errors.add("task handler is required for " + task.id());
        }

        for (var task : workflow.tasks()) {
            if (task == null) continue;
            var seenDependencies = new HashSet<String>();
            for (var dependency : task.dependsOn()) {
                if (dependency == null || dependency.isBlank()) {
                    errors.add("dependency id is required for task " + task.id());
                } else if (!seenDependencies.add(dependency)) {
                    errors.add("duplicate dependency " + dependency + " for task " + task.id());
                } else if (dependency.equals(task.id())) {
                    errors.add("task cannot depend on itself: " + task.id());
                } else if (!ids.contains(dependency)) {
                    errors.add("missing dependency " + dependency + " for task " + task.id());
                }
            }
        }
        return errors;
    }

}
