package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.FollowUpDtos.*;
import com.smallbusinesssales.entity.FollowUp;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.FollowUpRepository;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public FollowUpService(
            FollowUpRepository followUpRepository,
            LeadRepository leadRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.followUpRepository = followUpRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public List<FollowUpDto> listFollowUps(String status, String leadId, String opportunityId, String ownerId, String timeframe) {
        List<FollowUp> followUps = followUpRepository.findAll();

        Instant now = Instant.now();
        ZonedDateTime utcNow = now.atZone(ZoneOffset.UTC);
        Instant todayStart = utcNow.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant todayEnd = utcNow.toLocalDate().plusDays(1).atStartOfDay(ZoneOffset.UTC).minusNanos(1000).toInstant();

        return followUps.stream()
                .filter(f -> {
                    if (status != null && !status.isBlank()) {
                        return status.equalsIgnoreCase(f.getStatus());
                    }
                    return true;
                })
                .filter(f -> {
                    if (leadId != null && !leadId.isBlank()) {
                        return f.getLead() != null && leadId.equals(f.getLead().getId());
                    }
                    return true;
                })
                .filter(f -> {
                    if (opportunityId != null && !opportunityId.isBlank()) {
                        return f.getOpportunity() != null && opportunityId.equals(f.getOpportunity().getId());
                    }
                    return true;
                })
                .filter(f -> {
                    if (ownerId != null && !ownerId.isBlank()) {
                        return f.getOwner() != null && ownerId.equals(f.getOwner().getId());
                    }
                    return true;
                })
                .filter(f -> {
                    if (timeframe == null || timeframe.isBlank()) return true;
                    if ("overdue".equalsIgnoreCase(timeframe)) {
                        return "Scheduled".equalsIgnoreCase(f.getStatus()) && f.getDueAt() != null && f.getDueAt().isBefore(now);
                    } else if ("due_today".equalsIgnoreCase(timeframe)) {
                        return "Scheduled".equalsIgnoreCase(f.getStatus()) && f.getDueAt() != null &&
                                !f.getDueAt().isBefore(todayStart) && !f.getDueAt().isAfter(todayEnd);
                    } else if ("upcoming".equalsIgnoreCase(timeframe)) {
                        return "Scheduled".equalsIgnoreCase(f.getStatus()) && f.getDueAt() != null && f.getDueAt().isAfter(now);
                    }
                    return true;
                })
                .sorted((a, b) -> a.getDueAt().compareTo(b.getDueAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public FollowUpDto getFollowUp(String id) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found with id: " + id));
        return mapToDto(followUp);
    }

    @Transactional
    public FollowUpDto createFollowUp(FollowUpCreateRequest payload, User currentUser) {
        FollowUp followUp = new FollowUp();
        if (payload.lead_id() != null && !payload.lead_id().isBlank()) {
            leadRepository.findById(payload.lead_id()).ifPresent(followUp::setLead);
        }
        if (payload.opportunity_id() != null && !payload.opportunity_id().isBlank()) {
            opportunityRepository.findById(payload.opportunity_id()).ifPresent(followUp::setOpportunity);
        }

        User owner = currentUser;
        if (payload.owner_id() != null && !payload.owner_id().isBlank()) {
            owner = userRepository.findById(payload.owner_id()).orElse(currentUser);
        }
        followUp.setOwner(owner);
        followUp.setType(payload.type() != null ? payload.type() : "Call");
        followUp.setDueAt(payload.due_at() != null ? payload.due_at() : Instant.now().plusSeconds(86400));
        followUp.setNotes(payload.notes());
        followUp.setStatus("Scheduled");

        FollowUp saved = followUpRepository.save(followUp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "FollowUp", saved.getId(), "Created follow-up due " + saved.getDueAt(), null);
        return mapToDto(saved);
    }

    @Transactional
    public FollowUpDto updateFollowUp(String id, FollowUpUpdateRequest payload, User currentUser) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found with id: " + id));

        if (payload.type() != null) followUp.setType(payload.type());
        if (payload.due_at() != null) followUp.setDueAt(payload.due_at());
        if (payload.notes() != null) followUp.setNotes(payload.notes());
        if (payload.outcome() != null) followUp.setOutcome(payload.outcome());
        if (payload.status() != null) followUp.setStatus(payload.status());

        FollowUp saved = followUpRepository.save(followUp);
        return mapToDto(saved);
    }

    @Transactional
    public FollowUpDto completeFollowUp(String id, FollowUpCompleteRequest payload, User currentUser) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found with id: " + id));

        followUp.setStatus("Completed");
        followUp.setOutcome(payload.outcome());

        FollowUp saved = followUpRepository.save(followUp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "COMPLETE", "FollowUp", saved.getId(), "Completed follow-up: " + payload.outcome(), null);
        return mapToDto(saved);
    }

    public FollowUpDto mapToDto(FollowUp f) {
        UserDto ownerDto = null;
        if (f.getOwner() != null) {
            ownerDto = new UserDto(
                    f.getOwner().getId(),
                    f.getOwner().getName(),
                    f.getOwner().getEmail(),
                    f.getOwner().getRole(),
                    f.getOwner().isActive(),
                    f.getOwner().getCreatedAt()
            );
        }

        return new FollowUpDto(
                f.getId(),
                f.getLead() != null ? f.getLead().getId() : null,
                f.getOpportunity() != null ? f.getOpportunity().getId() : null,
                f.getOwner() != null ? f.getOwner().getId() : null,
                ownerDto,
                f.getType(),
                f.getDueAt(),
                f.getNotes(),
                f.getOutcome(),
                f.getStatus(),
                f.isOverdue(),
                f.getCreatedAt()
        );
    }
}
