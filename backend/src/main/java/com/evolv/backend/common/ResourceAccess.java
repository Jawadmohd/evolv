package com.evolv.backend.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.config.security.AuthenticatedUser;

public final class ResourceAccess {

    private ResourceAccess() {
    }

    public static void assertOwnerOrAdmin(String resourceUsername, AuthenticatedUser actor) {
        boolean isOwner = resourceUsername.equalsIgnoreCase(actor.username());
        boolean isAdmin = "ADMIN".equals(actor.role());
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access this resource");
        }
    }

    public static String resolveUsernameFilter(String requestedUsername, AuthenticatedUser actor) {
        if (requestedUsername == null || requestedUsername.isBlank()) {
            return actor.username();
        }
        if (!requestedUsername.equalsIgnoreCase(actor.username()) && !"ADMIN".equals(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view resources for another user");
        }
        return requestedUsername;
    }
}
