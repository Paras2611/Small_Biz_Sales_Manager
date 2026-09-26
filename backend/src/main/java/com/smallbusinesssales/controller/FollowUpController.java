package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.FollowUpDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.FollowUpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/followups", "/api/followups"})
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    public ResponseEntity<List<FollowUpDto>> listFollowUps(
            @RequestParam(required = false) String status,
            @RequestParam(name = "lead_id", required = false) String leadId,
            @RequestParam(name = "opportunity_id", required = false) String opportunityId,
            @RequestParam(name = "owner_id", required = false) String ownerId,
            @RequestParam(required = false) String timeframe
    ) {
        return ResponseEntity.ok(followUpService.listFollowUps(status, leadId, opportunityId, ownerId, timeframe));
    }

    @PostMapping
    public ResponseEntity<FollowUpDto> createFollowUp(
            @Valid @RequestBody FollowUpCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        FollowUpDto created = followUpService.createFollowUp(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FollowUpDto> getFollowUp(@PathVariable String id) {
        return ResponseEntity.ok(followUpService.getFollowUp(id));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<FollowUpDto> updateFollowUp(
            @PathVariable String id,
            @RequestBody FollowUpUpdateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(followUpService.updateFollowUp(id, payload, currentUser));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<FollowUpDto> completeFollowUp(
            @PathVariable String id,
            @Valid @RequestBody FollowUpCompleteRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(followUpService.completeFollowUp(id, payload, currentUser));
    }
}
