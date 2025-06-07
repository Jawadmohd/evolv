package com.evolv.backend.learning;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class QuizService {
    private static final Map<String, List<Question>> CATALOG = Map.of(
        "Software Engineer", List.of(
            new Question("Which structure serves the earliest inserted item first?",
                List.of("Stack", "Queue", "Set"), 1, "A queue uses first-in, first-out ordering."),
            new Question("Which SQL operation groups rows for aggregation?",
                List.of("ORDER BY", "GROUP BY", "LIMIT"), 1, "GROUP BY creates groups for functions such as COUNT.")),
        "Doctor", List.of(
            new Question("Which organ pumps blood around the body?",
                List.of("Liver", "Kidney", "Heart"), 2, "The heart pumps blood through the circulatory system."),
            new Question("What does a thermometer measure?",
                List.of("Temperature", "Pressure", "Pulse"), 0, "A thermometer measures temperature.")),
        "Teacher", List.of(
            new Question("Which activity checks understanding during a lesson?",
                List.of("Taking attendance", "An exit ticket", "Assigning seats"), 1,
                "An exit ticket gives the teacher timely evidence of understanding."),
            new Question("Which objective can be assessed most directly?",
                List.of("Know about fractions", "Enjoy maths", "Compare two fractions"), 2,
                "Comparing fractions is an observable task.")));

    private final JdbcClient jdbc;

    List<String> professions() {
        return CATALOG.keySet().stream().sorted().toList();
    }

    List<Prompt> prompts(String profession) {
        return questions(profession).stream().map(q -> new Prompt(q.text(), q.options())).toList();
    }

    Result submit(String profession, UUID userId, List<Integer> answers) {
        List<Question> questions = questions(profession);
        if (answers.size() != questions.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer every question");
        }
        var feedback = new ArrayList<Feedback>();
        int correct = 0;
        for (int index = 0; index < questions.size(); index++) {
            Question question = questions.get(index);
            int selected = answers.get(index);
            if (selected < 0 || selected >= question.options().size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid answer choice");
            }
            if (selected == question.answer()) {
                correct++;
            }
            feedback.add(new Feedback(question.answer(), question.explanation()));
        }
        int score = Math.round(correct * 100f / questions.size());
        jdbc.sql("""
            insert into quiz_scores (profession, user_id, score) values (:profession, :userId, :score)
            on conflict (profession, user_id) do update set score = greatest(quiz_scores.score, excluded.score)
            """).param("profession", profession).param("userId", userId).param("score", score).update();
        return new Result(score, feedback);
    }

    List<Rank> leaderboard(String profession) {
        questions(profession);
        return jdbc.sql("""
            select u.username, s.score from quiz_scores s join users u on s.user_id = u.id
            where s.profession = :profession order by s.score desc, s.user_id limit 50
            """).param("profession", profession)
            .query((rs, row) -> new Rank(rs.getString("username"), rs.getInt("score"))).list();
    }

    private List<Question> questions(String profession) {
        List<Question> questions = CATALOG.get(profession);
        if (questions == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
        return questions;
    }

    private record Question(String text, List<String> options, int answer, String explanation) {}
    record Prompt(String text, List<String> options) {}
    record Feedback(int correctOption, String explanation) {}
    record Result(int score, List<Feedback> feedback) {}
    record Rank(String username, int score) {}
}
