package com.evolv.backend.todo.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TodoRequest(
    @NotBlank @Size(max = 255) String title,
    @NotBlank @Size(max = 20) String period,
    List<@Size(max = 50) String> tags,
    Instant deadline,
    Boolean completed
) {
}
