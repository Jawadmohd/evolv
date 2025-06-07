package com.evolv.backend.user;

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
class AuthFlowIntegrationTest {

    @LocalServerPort
    private int port;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void authLifecycleWorksEndToEnd() throws Exception {
        String email = "user+" + System.nanoTime() + "@example.com";
        String username = "user_" + System.nanoTime();

        HttpResponse<String> registerResponse = sendJson(
            "/auth/register",
            """
                {
                  "email": "%s",
                  "username": "%s",
                  "password": "password123"
                }
                """.formatted(email, username)
        );

        assertThat(registerResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        JsonNode registerJson = objectMapper.readTree(registerResponse.body());
        String accessToken = registerJson.get("accessToken").asText();
        String refreshToken = registerJson.get("refreshToken").asText();

        HttpResponse<String> meResponse = httpClient.send(
            HttpRequest.newBuilder(URI.create(url("/auth/me")))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );

        assertThat(meResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        JsonNode meJson = objectMapper.readTree(meResponse.body());
        assertThat(meJson.get("email").asText()).isEqualTo(email);
        assertThat(meJson.get("username").asText()).isEqualTo(username);

        HttpResponse<String> refreshResponse = sendJson(
            "/auth/refresh",
            """
                {
                  "refreshToken": "%s"
                }
                """.formatted(refreshToken)
        );

        assertThat(refreshResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        String newRefreshToken = objectMapper.readTree(refreshResponse.body()).get("refreshToken").asText();

        HttpResponse<String> logoutResponse = sendJson(
            "/auth/logout",
            """
                {
                  "refreshToken": "%s"
                }
                """.formatted(newRefreshToken)
        );

        assertThat(logoutResponse.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());

        HttpResponse<String> revokedRefreshResponse = sendJson(
            "/auth/refresh",
            """
                {
                  "refreshToken": "%s"
                }
                """.formatted(newRefreshToken)
        );

        assertThat(revokedRefreshResponse.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
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
}
