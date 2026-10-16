package com.example.todo.repository;

import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

/** Reusable query conditions; combine them with .and(...) for dynamic filtering. */
public final class TaskSpecification {

    private TaskSpecification() {
    }

    public static Specification<Task> hasStatus(TaskStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Task> titleOrDescriptionContains(String text) {
        return (root, query, cb) -> {
            if (text == null || text.isBlank()) {
                return null;
            }
            String like = "%" + text.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like));
        };
    }
}
