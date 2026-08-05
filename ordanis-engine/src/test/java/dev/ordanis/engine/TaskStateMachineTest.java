package dev.ordanis.engine;

import dev.ordanis.engine.state.TaskStateMachine;
import dev.ordanis.engine.state.TaskStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskStateMachineTest {
    @Test
    void acceptsValidTransition() {
        assertThatCode(() -> TaskStateMachine.require(TaskStatus.RUNNING, TaskStatus.RETRY_WAIT))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsTerminalTransition() {
        assertThatThrownBy(() -> TaskStateMachine.require(TaskStatus.SUCCEEDED, TaskStatus.RUNNING))
                .isInstanceOf(IllegalStateException.class);
    }
}
