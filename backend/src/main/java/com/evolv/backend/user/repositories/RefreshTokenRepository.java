package com.evolv.backend.user.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.evolv.backend.models.RefreshToken;
import com.evolv.backend.models.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);
    void deleteAllByUser(User user);
}
