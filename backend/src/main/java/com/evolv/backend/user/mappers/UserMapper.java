package com.evolv.backend.user.mappers;

import org.springframework.stereotype.Component;

import com.evolv.backend.config.security.AuthenticatedUser;
import com.evolv.backend.models.User;
import com.evolv.backend.user.dtos.CurrentUserResponse;
import com.evolv.backend.user.dtos.UserResponse;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstname(),
            user.getLastname(),
            user.getUsername(),
            user.getProfession(),
            user.getDob(),
            user.getRole().name(),
            user.getCreatedAt()
        );
    }

    public CurrentUserResponse toCurrentUserResponse(User user) {
        return new CurrentUserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstname(),
            user.getLastname(),
            user.getUsername(),
            user.getProfession(),
            user.getDob(),
            user.getRole().name(),
            user.getCreatedAt()
        );
    }

    public AuthenticatedUser toAuthenticatedUser(User user) {
        return new AuthenticatedUser(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.getRole().name(),
            user.getCreatedAt()
        );
    }
}
