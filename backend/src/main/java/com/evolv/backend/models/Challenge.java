package com.evolv.backend.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "challenges")
public class Challenge {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "challenge_text", nullable = false, length = 500)
    private String challenge;

    @Column(nullable = false, length = 50)
    private String duration;

    @Column(nullable = false)
    private int applause;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean published;

    private LocalDateTime expiresAt;

    @ElementCollection
    @BatchSize(size = 32)
    @CollectionTable(name = "challenge_applauded_by", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "username", length = 50)
    private List<String> applaudedBy = new ArrayList<>();

    @ElementCollection
    @BatchSize(size = 32)
    @CollectionTable(name = "challenge_proof_images", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "image_url")
    private List<String> proofImageUrls = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<ChallengeProgressEntry> progressEntries = new ArrayList<>();

    @Transient
    private boolean hasApplauded;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
