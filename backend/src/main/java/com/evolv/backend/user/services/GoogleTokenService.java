package com.evolv.backend.user.services;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.evolv.backend.config.GoogleAuthProperties;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleTokenService {

    private final List<String> clientIds;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenService(GoogleAuthProperties googleAuthProperties) {
        this.clientIds = googleAuthProperties.parsedClientIds();

        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
            )
            .setAudience(this.clientIds)
            .build();
    }

    public GoogleIdToken.Payload verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token is required");
        }

        if (clientIds.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Google sign-in is not configured on the server"
            );
        }

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = token.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
            }

            return payload;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (GeneralSecurityException | IOException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unable to verify Google ID token");
        }
    }
}
