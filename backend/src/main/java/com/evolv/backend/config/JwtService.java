package com.evolv.backend.config;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.evolv.backend.models.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final SecurityProperties securityProperties;

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(securityProperties.accessTokenTtl());

        return Jwts.builder()
            .subject(user.getId().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .claims(Map.of(
                "email", user.getEmail(),
                "username", user.getUsername(),
                "role", user.getRole().name()
            ))
            .signWith(signingKey())
            .compact();
    }

    public long getAccessTokenTtlSeconds() {
        return securityProperties.accessTokenTtl().toSeconds();
    }

    public UUID extractUserId(String token) throws JwtException {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(securityProperties.secret().getBytes(StandardCharsets.UTF_8));
    }
}
