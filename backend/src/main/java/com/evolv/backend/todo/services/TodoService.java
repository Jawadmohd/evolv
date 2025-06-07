package com.evolv.backend.todo.services;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.common.ResourceAccess;
import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.models.Todo;
import com.evolv.backend.todo.dtos.TodoRequest;
import com.evolv.backend.todo.dtos.TodoResponse;
import com.evolv.backend.todo.mappers.TodoMapper;
import com.evolv.backend.todo.repositories.TodoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoRepository todoRepository;
    private final TodoMapper todoMapper;

    @Transactional(readOnly = true)
    public List<TodoResponse> findAll(String username, Boolean completed, String tag, AuthenticatedUser actor) {
        String owner = ResourceAccess.resolveUsernameFilter(username, actor);
        List<Todo> todos = completed == null
            ? todoRepository.findByUsernameIgnoreCase(owner)
            : todoRepository.findByUsernameIgnoreCaseAndCompleted(owner, completed);

        if (tag != null && !tag.isBlank()) {
            String normalizedTag = tag.trim().toLowerCase();
            todos = todos.stream()
                .filter(todo -> todo.getTags().stream().anyMatch(t -> t.equalsIgnoreCase(normalizedTag)))
                .toList();
        }

        return todos.stream().map(todoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TodoResponse findById(UUID id, AuthenticatedUser actor) {
        Todo todo = getTodo(id);
        ResourceAccess.assertOwnerOrAdmin(todo.getUsername(), actor);
        return todoMapper.toResponse(todo);
    }

    @Transactional
    public TodoResponse create(TodoRequest request, AuthenticatedUser actor) {
        Todo todo = new Todo();
        todo.setUsername(actor.username());
        applyRequest(todo, request);
        return todoMapper.toResponse(todoRepository.save(todo));
    }

    @Transactional
    public TodoResponse update(UUID id, TodoRequest request, AuthenticatedUser actor) {
        Todo todo = getTodo(id);
        ResourceAccess.assertOwnerOrAdmin(todo.getUsername(), actor);
        applyRequest(todo, request);
        return todoMapper.toResponse(todoRepository.save(todo));
    }

    @Transactional
    public void delete(UUID id, AuthenticatedUser actor) {
        Todo todo = getTodo(id);
        ResourceAccess.assertOwnerOrAdmin(todo.getUsername(), actor);
        todoRepository.delete(todo);
    }

    private Todo getTodo(UUID id) {
        return todoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
    }

    private void applyRequest(Todo todo, TodoRequest request) {
        todo.setTitle(request.title().trim());
        todo.setPeriod(request.period().trim());
        todo.setTags(request.tags() == null ? List.of() : request.tags());
        todo.setDeadline(request.deadline());

        if (request.completed() != null && request.completed() != todo.isCompleted()) {
            todo.setCompleted(request.completed());
            todo.setCompletedAt(request.completed() ? Instant.now() : null);
        }
    }
}
