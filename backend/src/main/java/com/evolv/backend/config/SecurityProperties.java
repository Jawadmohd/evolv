package com.evolv.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "evolv.security.jwt")
public record SecurityProperties(
    String secret,
    Duration accessTokenTtl,
    Duration refreshTokenTtl
) {
}
