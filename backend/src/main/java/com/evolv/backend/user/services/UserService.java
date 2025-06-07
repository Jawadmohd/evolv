package com.evolv.backend.user.services;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.models.AuthProvider;
import com.evolv.backend.models.User;
import com.evolv.backend.models.UserRole;
import com.evolv.backend.user.dtos.UserCreateRequest;
import com.evolv.backend.user.dtos.UserResponse;
import com.evolv.backend.user.dtos.UserUpdateRequest;
import com.evolv.backend.user.mappers.UserMapper;
import com.evolv.backend.user.repositories.RefreshTokenRepository;
import com.evolv.backend.user.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JdbcClient jdbc;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userMapper.toResponse(getUser(id));
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setUsername(request.username().trim());
        user.setFirstname(request.firstname());
        user.setLastname(request.lastname());
        user.setProfession(request.profession());
        user.setDob(request.dob());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(UserRole.USER);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request, AuthenticatedUser actor) {
        User user = getUser(id);
        assertOwnerOrAdmin(user, actor);

        if (request.firstname() != null) {
            user.setFirstname(request.firstname());
        }
        if (request.lastname() != null) {
            user.setLastname(request.lastname());
        }
        if (request.profession() != null) {
            user.setProfession(request.profession());
        }
        if (request.dob() != null) {
            user.setDob(request.dob());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse changeAccount(AuthenticatedUser actor, String currentPassword, String username, String password) {
        jdbc.sql("select id from users where id = :id for update").param("id", actor.id()).query(UUID.class).single();
        User user = getUser(actor.id());
        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
        } else if (password != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Manage your password through Google");
        }
        if (username != null && !username.equals(user.getUsername())) {
            String old = user.getUsername();
            if (!username.equalsIgnoreCase(old) && userRepository.existsByUsernameIgnoreCase(username)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
            }
            jdbc.sql("update todos set username = :name where upper(username) = upper(:old)")
                .param("name", username).param("old", old).update();
            jdbc.sql("update challenges set username = :name where upper(username) = upper(:old)")
                .param("name", username).param("old", old).update();
            jdbc.sql("update challenge_applauded_by set username = :name where upper(username) = upper(:old)")
                .param("name", username).param("old", old).update();
            user.setUsername(username);
        }
        if (password != null) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }
        return userMapper.toResponse(user);
    }

    @Transactional
    public void delete(UUID id, AuthenticatedUser actor) {
        User user = getUser(id);
        assertOwnerOrAdmin(user, actor);
        refreshTokenRepository.deleteAllByUser(user);
        userRepository.delete(user);
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void assertOwnerOrAdmin(User user, AuthenticatedUser actor) {
        boolean isOwner = user.getId().equals(actor.id());
        boolean isAdmin = "ADMIN".equals(actor.role());
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to modify this user");
        }
    }
}
