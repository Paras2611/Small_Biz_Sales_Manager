package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.AuthDtos.UserCreateRequest;
import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.AuthDtos.UserUpdateRequest;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(
            @Valid @RequestBody UserCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(payload, currentUser));
    }

    @RequestMapping(value = "/users/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<UserDto> updateUser(
            @PathVariable String id,
            @RequestBody UserUpdateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.updateUser(id, payload, currentUser));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(adminService.getSettings());
    }

    @RequestMapping(value = "/settings", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Map<String, Object>> updateSettings(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.updateSettings(payload, currentUser));
    }
}
