package com.evolv.backend.challenge.dtos;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChallengeRequest(
    @NotBlank @Size(max = 500) String challenge,
    @NotBlank @Size(max = 50) String duration,
    Boolean completed,
    List<@Size(max = 50) String> applaudedBy,
    List<String> proofImageUrls,
    List<ChallengeProgressEntryDto> progressEntries,
    Boolean published,
    @Valid ChallengeProgressEntryDto appendProgressEntry
) {
}
