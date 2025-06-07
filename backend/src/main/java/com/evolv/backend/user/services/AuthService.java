package com.evolv.backend.user.services;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.config.JwtService;
import com.evolv.backend.config.SecurityProperties;
import com.evolv.backend.models.AuthProvider;
import com.evolv.backend.models.RefreshToken;
import com.evolv.backend.models.User;
import com.evolv.backend.models.UserRole;
import com.evolv.backend.user.dtos.AuthResponse;
import com.evolv.backend.user.dtos.CurrentUserResponse;
import com.evolv.backend.user.dtos.LoginRequest;
import com.evolv.backend.user.dtos.RefreshTokenRequest;
import com.evolv.backend.user.dtos.RegisterRequest;
import com.evolv.backend.user.mappers.UserMapper;
import com.evolv.backend.user.repositories.RefreshTokenRepository;
import com.evolv.backend.user.repositories.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SecurityProperties securityProperties;
    private final GoogleTokenService googleTokenService;
    private final UserMapper userMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setUsername(request.username().trim());
        user.setFirstname(request.firstname());
        user.setLastname(request.lastname());
        user.setProfession(request.profession());
        user.setDob(request.dob());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(UserRole.USER);

        return issueTokens(userRepository.save(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "This account uses Google sign-in. Continue with Google instead."
            );
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdToken.Payload payload = googleTokenService.verify(idToken);
        String googleSub = payload.getSubject();
        String email = payload.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByGoogleSub(googleSub)
            .or(() -> userRepository.findByEmailIgnoreCase(email))
            .orElseGet(() -> createGoogleUser(payload, email, googleSub));

        if (user.getGoogleSub() == null) {
            user.setGoogleSub(googleSub);
        } else if (!user.getGoogleSub().equals(googleSub)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is linked to a different Google account");
        }

        if (user.getFirstname() == null || user.getFirstname().isBlank()) {
            Object givenName = payload.get("given_name");
            if (givenName instanceof String value && !value.isBlank()) {
                user.setFirstname(value);
            }
        }

        if (user.getLastname() == null || user.getLastname().isBlank()) {
            Object familyName = payload.get("family_name");
            if (familyName instanceof String value && !value.isBlank()) {
                user.setLastname(value);
            }
        }

        return issueTokens(userRepository.save(user));
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        refreshToken.setRevoked(true);
        return issueTokens(refreshToken.getUser());
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse me(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return userMapper.toCurrentUserResponse(user);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.deleteAllByUser(token.getUser());
            });
    }

    private User createGoogleUser(GoogleIdToken.Payload payload, String email, String googleSub) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(generateUniqueUsername(email));
        Object givenName = payload.get("given_name");
        Object familyName = payload.get("family_name");
        if (givenName instanceof String value) {
            user.setFirstname(value);
        }
        if (familyName instanceof String value) {
            user.setLastname(value);
        }
        user.setGoogleSub(googleSub);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setRole(UserRole.USER);
        return userRepository.save(user);
    }

    private String generateUniqueUsername(String email) {
        String localPart = email.split("@")[0]
            .replaceAll("[^a-zA-Z0-9._-]", "")
            .toLowerCase(Locale.ROOT);

        if (localPart.length() < 3) {
            localPart = "user" + localPart;
        }

        String base = localPart.length() > 40 ? localPart.substring(0, 40) : localPart;
        String candidate = base;
        int suffix = 0;

        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            suffix++;
            String suffixText = String.valueOf(suffix);
            int maxBaseLength = Math.max(3, 50 - suffixText.length());
            String truncated = base.length() > maxBaseLength ? base.substring(0, maxBaseLength) : base;
            candidate = truncated + suffixText;
        }

        return candidate;
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = generateRefreshTokenValue();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setRevoked(false);
        refreshToken.setExpiresAt(Instant.now().plus(securityProperties.refreshTokenTtl()));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
            accessToken,
            refreshTokenValue,
            "Bearer",
            jwtService.getAccessTokenTtlSeconds()
        );
    }

    private String generateRefreshTokenValue() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
