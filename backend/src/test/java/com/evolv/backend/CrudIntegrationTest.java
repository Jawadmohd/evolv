package com.evolv.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CrudIntegrationTest {

    @LocalServerPort
    private int port;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void userTodoAndChallengeCrudWorksEndToEnd() throws Exception {
        String email = "crud+" + System.nanoTime() + "@example.com";
        String username = "crud_" + System.nanoTime();

        JsonNode auth = objectMapper.readTree(sendJson(
            "/auth/register",
            """
                {
                  "email": "%s",
                  "username": "%s",
                  "password": "password123",
                  "firstname": "Crud",
                  "lastname": "User"
                }
                """.formatted(email, username)
        ).body());

        String accessToken = auth.get("accessToken").asText();

        HttpResponse<String> createUserResponse = sendJsonWithAuth(
            accessToken,
            "POST",
            "/users",
            """
                {
                  "email": "other+%s@example.com",
                  "username": "other_%s",
                  "password": "password123"
                }
                """.formatted(System.nanoTime(), System.nanoTime())
        );
        assertThat(createUserResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());

        HttpResponse<String> usersResponse = sendWithAuth(accessToken, "GET", "/users");
        assertThat(usersResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(usersResponse.body()).size()).isGreaterThanOrEqualTo(2);

        HttpResponse<String> createTodoResponse = sendJsonWithAuth(
            accessToken,
            "POST",
            "/todos",
            """
                {
                  "title": "Read a book",
                  "period": "daily",
                  "tags": ["growth"],
                  "completed": false
                }
                """
        );
        assertThat(createTodoResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        JsonNode todo = objectMapper.readTree(createTodoResponse.body());
        String todoId = todo.get("id").asText();
        assertThat(todo.get("username").asText()).isEqualTo(username);

        HttpResponse<String> updateTodoResponse = sendJsonWithAuth(
            accessToken,
            "PUT",
            "/todos/" + todoId,
            """
                {
                  "title": "Read two books",
                  "period": "daily",
                  "tags": ["growth", "reading"],
                  "completed": true
                }
                """
        );
        assertThat(updateTodoResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(updateTodoResponse.body()).get("completed").asBoolean()).isTrue();

        HttpResponse<String> todosResponse = sendWithAuth(accessToken, "GET", "/todos?completed=true");
        assertThat(todosResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(todosResponse.body()).size()).isEqualTo(1);

        HttpResponse<String> createChallengeResponse = sendJsonWithAuth(
            accessToken,
            "POST",
            "/challenges",
            """
                {
                  "challenge": "30-day meditation",
                  "duration": "30 days",
                  "completed": false,
                  "progressEntries": [
                    {
                      "date": "2026-07-16",
                      "report": "Day 1 complete"
                    }
                  ]
                }
                """
        );
        assertThat(createChallengeResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        JsonNode challenge = objectMapper.readTree(createChallengeResponse.body());
        String challengeId = challenge.get("id").asText();
        assertThat(challenge.get("progressEntries").size()).isEqualTo(1);

        HttpResponse<String> updateChallengeResponse = sendJsonWithAuth(
            accessToken,
            "PUT",
            "/challenges/" + challengeId,
            """
                {
                  "challenge": "30-day meditation",
                  "duration": "30 days",
                  "completed": true,
                  "applaudedBy": ["%s"],
                  "proofImageUrls": ["https://example.com/proof.jpg"],
                  "progressEntries": [
                    {
                      "date": "2026-07-16",
                      "report": "Finished"
                    }
                  ]
                }
                """.formatted(username)
        );
        assertThat(updateChallengeResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        JsonNode updatedChallenge = objectMapper.readTree(updateChallengeResponse.body());
        assertThat(updatedChallenge.get("completed").asBoolean()).isTrue();
        assertThat(updatedChallenge.get("hasApplauded").asBoolean()).isTrue();

        HttpResponse<String> deleteTodoResponse = sendWithAuth(accessToken, "DELETE", "/todos/" + todoId);
        assertThat(deleteTodoResponse.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());

        HttpResponse<String> deleteChallengeResponse = sendWithAuth(accessToken, "DELETE", "/challenges/" + challengeId);
        assertThat(deleteChallengeResponse.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());
    }

    private String url(String path) {
        return "http://localhost:" + port + "/api/v1" + path;
    }

    private HttpResponse<String> sendJson(String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url(path)))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> sendWithAuth(String accessToken, String method, String path) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url(path)))
            .header("Authorization", "Bearer " + accessToken);

        HttpRequest request = switch (method) {
            case "GET" -> builder.GET().build();
            case "DELETE" -> builder.DELETE().build();
            default -> throw new IllegalArgumentException("Unsupported method: " + method);
        };

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> sendJsonWithAuth(
        String accessToken,
        String method,
        String path,
        String body
    ) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url(path)))
            .header("Authorization", "Bearer " + accessToken)
            .header("Content-Type", "application/json");

        HttpRequest request = switch (method) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body)).build();
            default -> throw new IllegalArgumentException("Unsupported method: " + method);
        };

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
