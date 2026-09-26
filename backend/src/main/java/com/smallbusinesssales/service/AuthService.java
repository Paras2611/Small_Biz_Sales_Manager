package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.UserRepository;
import com.smallbusinesssales.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
    }

    public TokenResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadRequestException("User account is deactivated");
        }

        String token = jwtService.generateToken(user);
        auditLogService.logEvent(user.getId(), "LOGIN", "USER", user.getId(), "User logged in successfully", null);

        return new TokenResponse(token, "bearer", mapToDto(user));
    }

    public UserDto getMe(User user) {
        if (user == null) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        return mapToDto(user);
    }

    @Transactional
    public UserDto createUser(UserCreateRequest request, User currentUser) {
        String email = request.email().toLowerCase().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("User with this email already exists");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role() != null ? request.role() : "sales_rep");
        user.setActive(request.active() != null ? request.active() : true);
        user.setCreatedAt(Instant.now());

        User saved = userRepository.save(user);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE_USER", "USER", saved.getId(), "Created user " + saved.getEmail(), null);
        return mapToDto(saved);
    }

    @Transactional
    public UserDto updateUser(String id, UserUpdateRequest request, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.name() != null) user.setName(request.name().trim());
        if (request.email() != null) user.setEmail(request.email().toLowerCase().trim());
        if (request.role() != null) user.setRole(request.role());
        if (request.active() != null) user.setActive(request.active());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        User saved = userRepository.save(user);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "UPDATE_USER", "USER", saved.getId(), "Updated user " + saved.getEmail(), null);
        return mapToDto(saved);
    }

    public UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt() != null ? user.getCreatedAt() : Instant.now()
        );
    }
}
