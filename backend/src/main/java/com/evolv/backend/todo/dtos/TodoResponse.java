package com.evolv.backend.todo.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TodoResponse(
    UUID id,
    String username,
    String title,
    String period,
    List<String> tags,
    Instant deadline,
    boolean completed,
    Instant completedAt
) {
}
