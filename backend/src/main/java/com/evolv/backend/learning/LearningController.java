package com.evolv.backend.learning;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.config.security.AuthenticatedUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/learning")
@RequiredArgsConstructor
class LearningController {
    private final JdbcClient jdbc;
    private final QuizService quizService;
    private final VideoService videoService;

    @GetMapping("/interests")
    List<String> interests(@AuthenticationPrincipal AuthenticatedUser user) {
        return topics(user.id());
    }

    @PutMapping("/interests")
    @Transactional
    List<String> replaceInterests(@Valid @RequestBody Interests request,
                                  @AuthenticationPrincipal AuthenticatedUser user) {
        List<String> topics = request.topics().stream()
            .map(topic -> topic.strip().toLowerCase(Locale.ROOT)).distinct().toList();
        jdbc.sql("select id from users where id = :id for update").param("id", user.id()).query(UUID.class).single();
        jdbc.sql("delete from video_interests where user_id = :id").param("id", user.id()).update();
        for (String topic : topics) {
            jdbc.sql("insert into video_interests (user_id, topic) values (:id, :topic)")
                .param("id", user.id()).param("topic", topic).update();
        }
        return topics(user.id());
    }

    @GetMapping("/videos")
    List<VideoService.Video> videos(@AuthenticationPrincipal AuthenticatedUser user) {
        return videoService.recommendations(topics(user.id()));
    }

    @GetMapping("/quizzes")
    List<String> professions() {
        return quizService.professions();
    }

    @GetMapping("/quizzes/{profession}")
    List<QuizService.Prompt> quiz(@PathVariable String profession) {
        return quizService.prompts(profession);
    }

    @PostMapping("/quizzes/{profession}/attempts")
    QuizService.Result submit(@PathVariable String profession, @Valid @RequestBody Attempt request,
                              @AuthenticationPrincipal AuthenticatedUser user) {
        return quizService.submit(profession, user.id(), request.answers());
    }

    @GetMapping("/quizzes/{profession}/leaderboard")
    List<QuizService.Rank> leaderboard(@PathVariable String profession) {
        return quizService.leaderboard(profession);
    }

    @GetMapping("/quotes")
    List<String> quotes() {
        return List.of("Start with what you can do today.",
            "A short practice session still counts.", "Observe your progress before planning your next step.");
    }

    private List<String> topics(UUID userId) {
        return jdbc.sql("select topic from video_interests where user_id = :id order by topic")
            .param("id", userId).query(String.class).list();
    }

    record Interests(@NotNull @Size(max = 5) List<@NotBlank @Size(max = 80) String> topics) {}
    record Attempt(@NotNull @Size(max = 50) List<@NotNull Integer> answers) {}
}
