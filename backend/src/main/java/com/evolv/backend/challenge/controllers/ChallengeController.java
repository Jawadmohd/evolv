package com.evolv.backend.challenge.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.evolv.backend.challenge.dtos.ChallengeRequest;
import com.evolv.backend.challenge.dtos.ChallengeResponse;
import com.evolv.backend.challenge.services.ChallengeService;
import com.evolv.backend.config.security.AuthenticatedUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping("/feed")
    public ChallengeService.FeedPage feed(
        @RequestParam(defaultValue = "0") @Min(0) @Max(10000) int page,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.feed(page, user);
    }

    @PutMapping("/{id}/applause")
    public ChallengeService.FeedItem applause(
        @PathVariable UUID id, @Valid @RequestBody Applause request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.setApplause(id, request.applauded(), user);
    }

    @PostMapping("/{id}/proof")
    public ChallengeResponse proof(
        @PathVariable UUID id, @Valid @RequestBody Proof request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.addProof(id, request.imageUrl(), user);
    }

    public record Applause(boolean applauded) {}
    public record Proof(@NotBlank @Size(max = 2048) String imageUrl) {}

    @GetMapping
    public List<ChallengeResponse> findAll(
        @RequestParam(required = false) String username,
        @RequestParam(required = false) Boolean completed,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.findAll(username, completed, user);
    }

    @GetMapping("/{id}")
    public ChallengeResponse findById(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        return challengeService.findById(id, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChallengeResponse create(
        @Valid @RequestBody ChallengeRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.create(request, user);
    }

    @PutMapping("/{id}")
    public ChallengeResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody ChallengeRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return challengeService.update(id, request, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        challengeService.delete(id, user);
    }
}
