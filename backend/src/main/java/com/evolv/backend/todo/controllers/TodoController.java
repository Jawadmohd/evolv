package com.evolv.backend.todo.controllers;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.todo.dtos.TodoRequest;
import com.evolv.backend.todo.dtos.TodoResponse;
import com.evolv.backend.todo.services.TodoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @GetMapping
    public List<TodoResponse> findAll(
        @RequestParam(required = false) String username,
        @RequestParam(required = false) Boolean completed,
        @RequestParam(required = false) String tag,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return todoService.findAll(username, completed, tag, user);
    }

    @GetMapping("/{id}")
    public TodoResponse findById(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        return todoService.findById(id, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoResponse create(@Valid @RequestBody TodoRequest request, @AuthenticationPrincipal AuthenticatedUser user) {
        return todoService.create(request, user);
    }

    @PutMapping("/{id}")
    public TodoResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody TodoRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return todoService.update(id, request, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        todoService.delete(id, user);
    }
}
