package com.evolv.backend.user.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.user.dtos.UserCreateRequest;
import com.evolv.backend.user.dtos.UserResponse;
import com.evolv.backend.user.dtos.UserUpdateRequest;
import com.evolv.backend.user.services.UserService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserCreateRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody UserUpdateRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return userService.update(id, request, user);
    }

    @PutMapping("/me/account")
    public UserResponse changeAccount(@Valid @RequestBody AccountSettings request,
                                      @AuthenticationPrincipal AuthenticatedUser user) {
        return userService.changeAccount(user, request.currentPassword(), request.username(), request.password());
    }

    public record AccountSettings(
        @Size(max = 100) String currentPassword,
        @Pattern(regexp = "[A-Za-z0-9_.-]{3,50}") String username,
        @Size(min = 8, max = 72) String password
    ) {}

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        userService.delete(id, user);
    }
}
