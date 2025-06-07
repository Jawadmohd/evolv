package com.evolv.backend.challenge.dtos;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChallengeProgressEntryDto(
    @NotNull LocalDate date,
    @NotBlank @Size(max = 2000) String report
) {
}
