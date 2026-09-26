package com.smallbusinesssales.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class AuthDtos {

    public record LoginRequest(
        @NotBlank(message = "Email is required") @Email(message = "Invalid email format") String email,
        @NotBlank(message = "Password is required") String password
    ) {}

    public record TokenResponse(
        String access_token,
        String token_type,
        UserDto user
    ) {
        public TokenResponse(String token, UserDto user) {
            this(token, "bearer", user);
        }
    }

    public record UserDto(
        String id,
        String name,
        String email,
        String role,
        boolean active,
        Instant created_at
    ) {}

    public record UserCreateRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String password,
        String role,
        Boolean active
    ) {}

    public record UserUpdateRequest(
        String name,
        String email,
        String password,
        String role,
        Boolean active
    ) {}
}
