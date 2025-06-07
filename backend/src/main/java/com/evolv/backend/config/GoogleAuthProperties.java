package com.evolv.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "evolv.security.google")
public record GoogleAuthProperties(
    String clientIds
) {
    public List<String> parsedClientIds() {
        if (clientIds == null || clientIds.isBlank()) {
            return List.of();
        }

        return Arrays.stream(clientIds.split(","))
            .map(String::trim)
            .filter(id -> !id.isBlank())
            .toList();
    }
}
