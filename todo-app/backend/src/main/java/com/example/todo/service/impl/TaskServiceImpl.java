package com.example.todo.service.impl;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.mapper.TaskMapper;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import com.example.todo.repository.TaskRepository;
import com.example.todo.repository.TaskSpecification;
import com.example.todo.service.TaskService;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;

    public TaskServiceImpl(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(TaskStatus status, String search) {
        Specification<Task> spec = Specification
                .where(TaskSpecification.hasStatus(status))
                .and(TaskSpecification.titleOrDescriptionContains(search));

        return taskRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(TaskMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) {
        return TaskMapper.toResponse(findById(id));
    }

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        Task saved = taskRepository.save(TaskMapper.toEntity(request));
        return TaskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = findById(id);
        TaskMapper.updateEntity(task, request);
        return TaskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse updateStatus(Long id, TaskStatus status) {
        Task task = findById(id);
        task.setStatus(status);
        return TaskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        taskRepository.delete(findById(id));
    }

    private Task findById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id " + id));
    }
}
