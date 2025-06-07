package com.evolv.backend.challenge.dtos;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.evolv.backend.models.ChallengeProgressEntry;

public record ChallengeResponse(
    UUID id,
    String username,
    String challenge,
    String duration,
    int applause,
    boolean completed,
    LocalDateTime createdAt,
    List<String> applaudedBy,
    List<String> proofImageUrls,
    List<ChallengeProgressEntry> progressEntries,
    boolean published,
    boolean hasApplauded
) {
}
