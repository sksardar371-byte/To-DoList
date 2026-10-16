package com.example.todo.dto;

import com.example.todo.model.Priority;
import com.example.todo.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Body of POST /api/tasks and PUT /api/tasks/{id}. */
public record TaskRequest(
        @NotBlank(message = "Title cannot be empty")
        @Size(max = 150, message = "Title is too long (max 150 characters)")
        String title,

        @Size(max = 1000, message = "Description is too long (max 1000 characters)")
        String description,

        LocalDate deadline,
        Priority priority,
        TaskStatus status,

        @Size(max = 100, message = "Created by is too long (max 100 characters)")
        String createdBy) {
}
