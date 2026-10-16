package com.example.todo.service;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.model.TaskStatus;
import java.util.List;

public interface TaskService {

    List<TaskResponse> getTasks(TaskStatus status, String search);

    TaskResponse getTask(Long id);

    TaskResponse createTask(TaskRequest request);

    TaskResponse updateTask(Long id, TaskRequest request);

    TaskResponse updateStatus(Long id, TaskStatus status);

    void deleteTask(Long id);
}
