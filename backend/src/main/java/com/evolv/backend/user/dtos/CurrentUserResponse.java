package com.evolv.backend.user.dtos;

import java.time.Instant;
import java.util.UUID;

public record CurrentUserResponse(
    UUID id,
    String email,
    String firstname,
    String lastname,
    String username,
    String profession,
    String dob,
    String role,
    Instant createdAt
) {
}
