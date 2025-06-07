package com.evolv.backend.learning;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.Semaphore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/learning/chat")
class ChatController {
    private final Semaphore slots = new Semaphore(4);
    private final RestClient ollama;
    private final String model;

    ChatController(@Value("${evolv.ollama.url:http://localhost:11434}") String url,
                   @Value("${evolv.ollama.model:llama3.2}") String model) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(45));
        this.ollama = RestClient.builder().requestFactory(factory).baseUrl(url).build();
        this.model = model;
    }

    @PostMapping
    Reply answer(@Valid @RequestBody Message message) {
        acquire();
        try {
            return ollama.post().uri("/api/generate").contentType(MediaType.APPLICATION_JSON)
                .body(request(message, false)).retrieve().body(Reply.class);
        } catch (RestClientException ex) {
            throw unavailable();
        } finally {
            slots.release();
        }
    }

    @PostMapping(value = "/stream", produces = "application/x-ndjson")
    void stream(@Valid @RequestBody Message message, HttpServletResponse response) {
        acquire();
        try {
            ollama.post().uri("/api/generate").contentType(MediaType.APPLICATION_JSON)
                .body(request(message, true)).exchange((request, upstream) -> {
                    if (!upstream.getStatusCode().is2xxSuccessful()) {
                        throw unavailable();
                    }
                    response.setContentType("application/x-ndjson");
                    response.setHeader("Cache-Control", "no-store");
                    response.setHeader("X-Accel-Buffering", "no");
                    var output = response.getOutputStream();
                    byte[] buffer = new byte[4096];
                    try (var input = upstream.getBody()) {
                        for (int length; (length = input.read(buffer)) != -1;) {
                            output.write(buffer, 0, length);
                            output.flush();
                        }
                    } catch (IOException ex) {
                        if (!response.isCommitted()) throw ex;
                    }
                    return null;
                });
        } catch (RestClientException ex) {
            if (!response.isCommitted()) throw unavailable();
        } finally {
            slots.release();
        }
    }

    private Map<String, Object> request(Message message, boolean stream) {
        return Map.of("model", model, "prompt", message.message().strip(), "stream", stream,
            "system", "You are EVOLV's learning assistant. Give practical, concise study guidance.",
            "options", Map.of("num_predict", 512));
    }

    private void acquire() {
        if (!slots.tryAcquire()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Chat is busy. Try again in a moment.");
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The learning assistant is temporarily unavailable");
    }

    record Message(@NotBlank @Size(max = 2000) String message) {}
    record Reply(String response) {}
}
