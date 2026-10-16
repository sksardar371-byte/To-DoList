package com.example.todo.dto;

import com.example.todo.model.Priority;
import com.example.todo.model.TaskStatus;
import java.time.LocalDate;

/** What the API returns to the client. */
public record TaskResponse(
        Long id,
        String title,
        String description,
        LocalDate deadline,
        TaskStatus status,
        Priority priority,
        LocalDate createdDate,
        String createdBy,
        boolean overdue) {
}
