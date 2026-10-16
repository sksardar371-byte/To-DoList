package com.example.todo.dto;

import java.time.LocalDateTime;

/** Standard error body: {"status":400,"message":"...","timestamp":"..."} */
public record ErrorResponse(int status, String message, LocalDateTime timestamp) {
    public ErrorResponse(int status, String message) {
        this(status, message, LocalDateTime.now());
    }
}
