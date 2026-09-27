package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.OpportunityDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.OpportunityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/opportunities", "/api/opportunities"})
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    public ResponseEntity<List<OpportunityDto>> listOpportunities(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String status,
            @RequestParam(name = "owner_id", required = false) String ownerId,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(opportunityService.listOpportunities(stage, status, ownerId, search));
    }

    @PostMapping
    public ResponseEntity<OpportunityDto> createOpportunity(
            @Valid @RequestBody OpportunityCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        OpportunityDto opp = opportunityService.createOpportunity(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(opp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpportunityDto> getOpportunity(@PathVariable String id) {
        return ResponseEntity.ok(opportunityService.getOpportunity(id));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<OpportunityDto> updateOpportunity(
            @PathVariable String id,
            @RequestBody OpportunityUpdateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(opportunityService.updateOpportunity(id, payload, currentUser));
    }

    @PostMapping("/{id}/mark-won")
    public ResponseEntity<OpportunityDto> markOpportunityWon(
            @PathVariable String id,
            @Valid @RequestBody OpportunityMarkWonRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(opportunityService.markOpportunityWon(id, payload, currentUser));
    }

    @PostMapping("/{id}/mark-lost")
    public ResponseEntity<OpportunityDto> markOpportunityLost(
            @PathVariable String id,
            @Valid @RequestBody OpportunityMarkLostRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(opportunityService.markOpportunityLost(id, payload, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteOpportunity(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        opportunityService.deleteOpportunity(id, currentUser);
        return ResponseEntity.ok(java.util.Map.of("message", "Opportunity deleted successfully"));
    }
}
