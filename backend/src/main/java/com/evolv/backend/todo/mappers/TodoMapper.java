package com.evolv.backend.todo.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.evolv.backend.models.Todo;
import com.evolv.backend.todo.dtos.TodoResponse;

@Component
public class TodoMapper {

    public TodoResponse toResponse(Todo todo) {
        return new TodoResponse(
            todo.getId(),
            todo.getUsername(),
            todo.getTitle(),
            todo.getPeriod(),
            todo.getTags() == null ? List.of() : new ArrayList<>(todo.getTags()),
            todo.getDeadline(),
            todo.isCompleted(),
            todo.getCompletedAt()
        );
    }
}
