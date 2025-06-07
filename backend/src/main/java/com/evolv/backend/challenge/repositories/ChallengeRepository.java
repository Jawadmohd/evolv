package com.evolv.backend.challenge.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.evolv.backend.models.Challenge;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Challenge> findForUpdateById(UUID id);

    List<Challenge> findByUsernameIgnoreCase(String username);
    List<Challenge> findByUsernameIgnoreCaseAndCompleted(String username, boolean completed);
}
