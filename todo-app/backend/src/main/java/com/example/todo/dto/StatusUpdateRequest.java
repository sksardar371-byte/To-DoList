package com.example.todo.dto;

import com.example.todo.model.TaskStatus;
import jakarta.validation.constraints.NotNull;

/** Body of PATCH /api/tasks/{id}/status. */
public record StatusUpdateRequest(
        @NotNull(message = "Status is required (PENDING or COMPLETED)") TaskStatus status) {
}
