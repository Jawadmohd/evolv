package com.evolv.backend.user.dtos;

import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
    String firstname,
    String lastname,
    String profession,
    String dob,
    @Size(min = 8, max = 100) String password
) {
}
