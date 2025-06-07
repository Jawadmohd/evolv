package com.evolv.backend.user.dtos;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank String idToken
) {
}
