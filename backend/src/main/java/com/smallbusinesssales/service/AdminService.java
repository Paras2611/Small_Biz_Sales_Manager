package com.smallbusinesssales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smallbusinesssales.dto.AuthDtos.UserCreateRequest;
import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.AuthDtos.UserUpdateRequest;
import com.smallbusinesssales.entity.SystemSetting;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.repository.SystemSettingRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AdminService(
            UserRepository userRepository,
            SystemSettingRepository systemSettingRepository,
            AuthService authService,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public List<UserDto> listUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getName))
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    public UserDto createUser(UserCreateRequest request, User currentUser) {
        return authService.createUser(request, currentUser);
    }

    public UserDto updateUser(String id, UserUpdateRequest request, User currentUser) {
        return authService.updateUser(id, request, currentUser);
    }

    public Map<String, Object> getSettings() {
        Map<String, Object> defaultMap = new HashMap<>();
        defaultMap.put("pipeline_stages", Arrays.asList("Prospecting", "Qualification", "Proposal", "Negotiation", "Closing"));
        defaultMap.put("lead_sources", Arrays.asList("Website", "Referral", "Trade Show", "Social Media", "Outbound Campaign"));
        defaultMap.put("tax_rules", Arrays.asList(
                Map.of("class", "Standard GST", "rate", 18.0),
                Map.of("class", "Reduced GST", "rate", 12.0)
        ));

        List<SystemSetting> settings = systemSettingRepository.findAll();
        for (SystemSetting s : settings) {
            try {
                Object parsed = objectMapper.readValue(s.getValue(), Object.class);
                defaultMap.put(s.getKey(), parsed);
            } catch (Exception e) {
                defaultMap.put(s.getKey(), s.getValue());
            }
        }
        return defaultMap;
    }

    @Transactional
    public Map<String, Object> updateSettings(Map<String, Object> payload, User currentUser) {
        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            String key = entry.getKey();
            String jsonVal;
            try {
                jsonVal = objectMapper.writeValueAsString(entry.getValue());
            } catch (Exception e) {
                jsonVal = String.valueOf(entry.getValue());
            }

            Optional<SystemSetting> existing = systemSettingRepository.findByKey(key);
            if (existing.isPresent()) {
                SystemSetting s = existing.get();
                s.setValue(jsonVal);
                s.setUpdatedAt(Instant.now());
                systemSettingRepository.save(s);
            } else {
                SystemSetting s = new SystemSetting(key, jsonVal, "System setting " + key);
                systemSettingRepository.save(s);
            }
        }

        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "UPDATE_SETTINGS", "SystemSetting", null, "Updated system settings", null);
        return Map.of("message", "Settings updated successfully", "updated_keys", new ArrayList<>(payload.keySet()));
    }
}
