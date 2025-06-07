package com.evolv.backend.challenge.services;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.challenge.dtos.ChallengeRequest;
import com.evolv.backend.challenge.dtos.ChallengeResponse;
import com.evolv.backend.challenge.mappers.ChallengeMapper;
import com.evolv.backend.challenge.repositories.ChallengeRepository;
import com.evolv.backend.common.ResourceAccess;
import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.models.Challenge;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private static final Pattern DURATION = Pattern.compile("(\\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(day|week|month|year)s?");
    private static final List<String> NUMBER_WORDS = List.of(
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten");

    private final ChallengeRepository challengeRepository;
    private final ChallengeMapper challengeMapper;
    private final JdbcClient jdbc;

    @Transactional(readOnly = true)
    public FeedPage feed(int page, AuthenticatedUser actor) {
        int size = 20;
        var items = jdbc.sql("""
            select c.id, c.username, c.challenge_text, c.duration, c.applause, c.completed,
                c.created_at,
                exists (select 1 from challenge_applauded_by a
                    where a.challenge_id = c.id and upper(a.username) = upper(:viewer)) as applauded
            from challenges c
            where c.published and (c.expires_at is null or c.expires_at > (current_timestamp at time zone 'UTC'))
            order by c.created_at desc, c.id desc limit :limit offset :offset
            """).param("viewer", actor.username()).param("limit", size + 1).param("offset", page * size)
            .query((rs, row) -> new FeedItem(
                rs.getObject("id", UUID.class), rs.getString("username"), rs.getString("challenge_text"),
                rs.getString("duration"), rs.getInt("applause"), rs.getBoolean("applauded"),
                rs.getBoolean("completed"), rs.getObject("created_at", LocalDateTime.class)
            )).list();
        return new FeedPage(items.size() > size ? List.copyOf(items.subList(0, size)) : items, items.size() > size);
    }

    @Transactional
    public FeedItem setApplause(UUID id, boolean applauded, AuthenticatedUser actor) {
        Challenge challenge = lockedChallenge(id);
        if (!challenge.isPublished() || (challenge.getExpiresAt() != null
            && !challenge.getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC)))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge is not on the feed");
        }
        var names = new ArrayList<>(challenge.getApplaudedBy());
        boolean alreadyApplauded = names.stream().anyMatch(actor.username()::equalsIgnoreCase);
        if (applauded != alreadyApplauded) {
            if (applauded) {
                names.add(actor.username());
            } else {
                names.removeIf(actor.username()::equalsIgnoreCase);
            }
            challenge.setApplaudedBy(names);
            challenge.setApplause(names.size());
        }
        return summary(challenge, actor);
    }

    @Transactional
    public ChallengeResponse addProof(UUID id, String imageUrl, AuthenticatedUser actor) {
        Challenge challenge = lockedChallenge(id);
        ResourceAccess.assertOwnerOrAdmin(challenge.getUsername(), actor);
        URI uri;
        try {
            uri = URI.create(imageUrl.strip());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid HTTPS image URL");
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid HTTPS image URL");
        }
        var links = challenge.getProofImageUrls();
        if (!links.contains(uri.toString())) {
            if (links.size() >= 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A challenge can have up to 20 proof links");
            }
            links.add(uri.toString());
        }
        return challengeMapper.toResponse(challenge, actor);
    }

    private FeedItem summary(Challenge challenge, AuthenticatedUser actor) {
        boolean applauded = challenge.getApplaudedBy().stream().anyMatch(actor.username()::equalsIgnoreCase);
        return new FeedItem(challenge.getId(), challenge.getUsername(), challenge.getChallenge(),
            challenge.getDuration(), challenge.getApplause(), applauded, challenge.isCompleted(), challenge.getCreatedAt());
    }

    public record FeedPage(List<FeedItem> items, boolean hasNext) {}
    public record FeedItem(UUID id, String username, String challenge, String duration,
                           int applause, boolean hasApplauded, boolean completed, LocalDateTime createdAt) {}

    @Transactional(readOnly = true)
    public List<ChallengeResponse> findAll(String username, Boolean completed, AuthenticatedUser actor) {
        String owner = ResourceAccess.resolveUsernameFilter(username, actor);
        List<Challenge> challenges = completed == null
            ? challengeRepository.findByUsernameIgnoreCase(owner)
            : challengeRepository.findByUsernameIgnoreCaseAndCompleted(owner, completed);

        return challenges.stream().map(challenge -> challengeMapper.toResponse(challenge, actor)).toList();
    }

    @Transactional(readOnly = true)
    public ChallengeResponse findById(UUID id, AuthenticatedUser actor) {
        Challenge challenge = getChallenge(id);
        ResourceAccess.assertOwnerOrAdmin(challenge.getUsername(), actor);
        return challengeMapper.toResponse(challenge, actor);
    }

    @Transactional
    public ChallengeResponse create(ChallengeRequest request, AuthenticatedUser actor) {
        Challenge challenge = new Challenge();
        challenge.setUsername(actor.username());
        challenge.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        applyRequest(challenge, request);
        return challengeMapper.toResponse(challengeRepository.save(challenge), actor);
    }

    @Transactional
    public ChallengeResponse update(UUID id, ChallengeRequest request, AuthenticatedUser actor) {
        Challenge challenge = lockedChallenge(id);
        ResourceAccess.assertOwnerOrAdmin(challenge.getUsername(), actor);
        applyRequest(challenge, request);
        return challengeMapper.toResponse(challengeRepository.save(challenge), actor);
    }

    @Transactional
    public void delete(UUID id, AuthenticatedUser actor) {
        Challenge challenge = getChallenge(id);
        ResourceAccess.assertOwnerOrAdmin(challenge.getUsername(), actor);
        challengeRepository.delete(challenge);
    }

    private Challenge lockedChallenge(UUID id) {
        return challengeRepository.findForUpdateById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));
    }

    private Challenge getChallenge(UUID id) {
        return challengeRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));
    }

    private void applyRequest(Challenge challenge, ChallengeRequest request) {
        challenge.setChallenge(request.challenge().trim());
        challenge.setDuration(request.duration().trim());
        if (request.published() != null) {
            challenge.setPublished(request.published());
        }
        challenge.setExpiresAt(expiration(challenge.getCreatedAt(), challenge.getDuration()));

        if (request.completed() != null) {
            challenge.setCompleted(request.completed());
        }

        if (request.applaudedBy() != null) {
            challenge.setApplaudedBy(new ArrayList<>(request.applaudedBy()));
            challenge.setApplause(request.applaudedBy().size());
        }

        if (request.proofImageUrls() != null) {
            challenge.setProofImageUrls(new ArrayList<>(request.proofImageUrls()));
        }

        if (request.progressEntries() != null) {
            challenge.setProgressEntries(
                request.progressEntries().stream().map(challengeMapper::toProgressEntry).toList()
            );
        }

        if (request.appendProgressEntry() != null) {
            var entries = new ArrayList<>(challenge.getProgressEntries());
            entries.add(challengeMapper.toProgressEntry(request.appendProgressEntry()));
            challenge.setProgressEntries(entries);
        }
    }

    private LocalDateTime expiration(LocalDateTime createdAt, String duration) {
        var match = DURATION.matcher(duration.toLowerCase(Locale.ROOT));
        if (!match.matches()) {
            return null;
        }
        String token = match.group(1);
        int count = Character.isDigit(token.charAt(0)) ? Integer.parseInt(token) : NUMBER_WORDS.indexOf(token);
        return switch (match.group(2)) {
            case "day" -> createdAt.plusDays(count);
            case "week" -> createdAt.plusWeeks(count);
            case "month" -> createdAt.plusMonths(count);
            default -> createdAt.plusYears(count);
        };
    }

}
