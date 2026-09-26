package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.LoginRequest;
import com.smallbusinesssales.dto.AuthDtos.TokenResponse;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.repository.AuditLogRepository;
import com.smallbusinesssales.repository.UserRepository;
import com.smallbusinesssales.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuthService authService;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "test-secret-key-must-be-at-least-256-bits-long-for-hmac-sha256-thinqloud");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);

        AuditLogService auditLogService = new AuditLogService(auditLogRepository, userRepository);
        authService = new AuthService(userRepository, passwordEncoder, jwtService, auditLogService);
    }

    @Test
    void testSuccessfulLogin() {
        User user = new User("Arjun Shah", "arjun.shah@thinqloud.demo", "hashedPassword", "sales_executive");
        when(userRepository.findByEmail("arjun.shah@thinqloud.demo")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Exec@2026", "hashedPassword")).thenReturn(true);

        TokenResponse response = authService.login(new LoginRequest("arjun.shah@thinqloud.demo", "Exec@2026"));

        assertNotNull(response);
        assertNotNull(response.access_token());
        assertEquals("bearer", response.token_type());
        assertEquals("arjun.shah@thinqloud.demo", response.user().email());
        assertEquals("sales_executive", response.user().role());
    }

    @Test
    void testLoginInvalidPasswordThrowsException() {
        User user = new User("Arjun Shah", "arjun.shah@thinqloud.demo", "hashedPassword", "sales_executive");
        when(userRepository.findByEmail("arjun.shah@thinqloud.demo")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass", "hashedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () ->
                authService.login(new LoginRequest("arjun.shah@thinqloud.demo", "WrongPass"))
        );
    }

    @Test
    void testLoginInactiveUserThrowsException() {
        User user = new User("Arjun Shah", "arjun.shah@thinqloud.demo", "hashedPassword", "sales_executive");
        user.setActive(false);
        when(userRepository.findByEmail("arjun.shah@thinqloud.demo")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Exec@2026", "hashedPassword")).thenReturn(true);

        assertThrows(BadRequestException.class, () ->
                authService.login(new LoginRequest("arjun.shah@thinqloud.demo", "Exec@2026"))
        );
    }
}
