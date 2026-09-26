package com.smallbusinesssales.service;

import com.smallbusinesssales.entity.AuditLog;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.repository.AuditLogRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public void logEvent(String userId, String action, String entityType, String entityId, String details, String ipAddress) {
        try {
            User user = null;
            if (userId != null && !userId.isBlank()) {
                user = userRepository.findById(userId).orElse(null);
            }

            AuditLog auditLog = new AuditLog();
            auditLog.setUser(user);
            auditLog.setAction(action != null ? action : "UNKNOWN");
            auditLog.setEntityType(entityType != null ? entityType : "System");
            auditLog.setEntityId(entityId != null ? entityId : "global");
            auditLog.setDetails(details != null ? details : "");
            auditLog.setCreatedAt(Instant.now());

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to record audit log: {}", e.getMessage());
        }
    }
}
