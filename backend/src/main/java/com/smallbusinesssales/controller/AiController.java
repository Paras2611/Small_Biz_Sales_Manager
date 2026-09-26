package com.smallbusinesssales.controller;

import com.smallbusinesssales.ai.AiSalesAssistantService;
import com.smallbusinesssales.dto.AiDtos.*;
import com.smallbusinesssales.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/ai", "/api/ai"})
public class AiController {

    private final AiSalesAssistantService aiSalesAssistantService;

    public AiController(AiSalesAssistantService aiSalesAssistantService) {
        this.aiSalesAssistantService = aiSalesAssistantService;
    }

    @PostMapping("/lead-priority")
    public ResponseEntity<LeadPriorityResponse> assessLeadPriority(
            @Valid @RequestBody LeadPriorityRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiSalesAssistantService.assessLeadPriority(payload, currentUser));
    }

    @PostMapping("/lead-summary")
    public ResponseEntity<SummaryResponse> generateSummary(
            @Valid @RequestBody SummaryRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiSalesAssistantService.generateSummary(payload, currentUser));
    }

    @PostMapping("/next-action")
    public ResponseEntity<NextActionResponse> getNextAction(
            @Valid @RequestBody NextActionRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiSalesAssistantService.getNextAction(payload, currentUser));
    }
}
