package com.evolv.backend.config.security;

import java.time.Instant;
import java.util.UUID;

public record AuthenticatedUser(
    UUID id,
    String email,
    String username,
    String role,
    Instant createdAt
) {
}
