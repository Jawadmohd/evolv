package com.evolv.backend.todo.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.evolv.backend.models.Todo;

public interface TodoRepository extends JpaRepository<Todo, UUID> {
    List<Todo> findByUsernameIgnoreCase(String username);
    List<Todo> findByUsernameIgnoreCaseAndCompleted(String username, boolean completed);
}
