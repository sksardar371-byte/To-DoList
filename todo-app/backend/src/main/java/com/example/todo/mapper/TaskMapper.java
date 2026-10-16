package com.example.todo.mapper;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.model.Priority;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import java.time.LocalDate;

/** Converts between entity and DTOs so the entity is never exposed directly. */
public final class TaskMapper {

    private TaskMapper() {
    }

    public static Task toEntity(TaskRequest request) {
        Task task = new Task();
        updateEntity(task, request);
        return task;
    }

    public static void updateEntity(Task task, TaskRequest request) {
        task.setTitle(request.title().trim());
        task.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        task.setDeadline(request.deadline());
        task.setPriority(request.priority() != null ? request.priority() : Priority.MEDIUM);
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.createdBy() != null && !request.createdBy().isBlank()) {
            task.setCreatedBy(request.createdBy().trim());
        } else if (task.getCreatedBy() == null) {
            task.setCreatedBy("Me");
        }
    }

    public static TaskResponse toResponse(Task task) {
        boolean overdue = task.getStatus() == TaskStatus.PENDING
                && task.getDeadline() != null
                && task.getDeadline().isBefore(LocalDate.now());
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.getDeadline(),
                task.getStatus(), task.getPriority(), task.getCreatedDate(),
                task.getCreatedBy() != null ? task.getCreatedBy() : "Me", overdue);
    }
}
