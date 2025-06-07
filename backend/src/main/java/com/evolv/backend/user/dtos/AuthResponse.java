package com.evolv.backend.user.dtos;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresInSeconds
) {
}
