package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.LeadDtos.*;
import com.smallbusinesssales.dto.OpportunityDtos.OpportunityDto;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/leads", "/api/leads"})
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    public ResponseEntity<List<LeadDto>> listLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(name = "owner_id", required = false) String ownerId
    ) {
        return ResponseEntity.ok(leadService.listLeads(search, status, ownerId));
    }

    @PostMapping
    public ResponseEntity<LeadDto> createLead(
            @Valid @RequestBody LeadCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        LeadDto created = leadService.createLead(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadDto> getLead(@PathVariable String id) {
        return ResponseEntity.ok(leadService.getLead(id));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<LeadDto> updateLead(
            @PathVariable String id,
            @RequestBody LeadUpdateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(leadService.updateLead(id, payload, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteLead(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        leadService.deleteLead(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Lead deleted successfully"));
    }

    @PostMapping("/{id}/qualify")
    public ResponseEntity<LeadDto> qualifyLead(
            @PathVariable String id,
            @Valid @RequestBody LeadQualifyRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(leadService.qualifyLead(id, payload, currentUser));
    }

    @PostMapping("/{id}/convert-opportunity")
    public ResponseEntity<OpportunityDto> convertLeadToOpportunity(
            @PathVariable String id,
            @Valid @RequestBody LeadConvertRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        OpportunityDto opp = leadService.convertLeadToOpportunity(id, payload, currentUser);
        return ResponseEntity.ok(opp);
    }
}
