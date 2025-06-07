package com.evolv.backend.challenge.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.models.Challenge;
import com.evolv.backend.models.ChallengeProgressEntry;
import com.evolv.backend.challenge.dtos.ChallengeProgressEntryDto;
import com.evolv.backend.challenge.dtos.ChallengeResponse;

@Component
public class ChallengeMapper {

    public ChallengeResponse toResponse(Challenge challenge, AuthenticatedUser actor) {
        boolean hasApplauded = actor != null
            && challenge.getApplaudedBy().stream().anyMatch(name -> name.equalsIgnoreCase(actor.username()));

        return new ChallengeResponse(
            challenge.getId(),
            challenge.getUsername(),
            challenge.getChallenge(),
            challenge.getDuration(),
            challenge.getApplause(),
            challenge.isCompleted(),
            challenge.getCreatedAt(),
            challenge.getApplaudedBy() == null ? List.of() : new ArrayList<>(challenge.getApplaudedBy()),
            challenge.getProofImageUrls() == null ? List.of() : new ArrayList<>(challenge.getProofImageUrls()),
            challenge.getProgressEntries() == null ? List.of() : new ArrayList<>(challenge.getProgressEntries()),
            challenge.isPublished(),
            hasApplauded
        );
    }

    public ChallengeProgressEntry toProgressEntry(ChallengeProgressEntryDto dto) {
        return new ChallengeProgressEntry(dto.date(), dto.report());
    }
}
