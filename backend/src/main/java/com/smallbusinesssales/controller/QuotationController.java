package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.QuotationDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.QuotationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/quotations", "/api/quotations"})
public class QuotationController {

    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    @GetMapping
    public ResponseEntity<List<QuotationDto>> listQuotations(
            @RequestParam(name = "opportunity_id", required = false) String opportunityId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(quotationService.listQuotations(opportunityId, status));
    }

    @PostMapping
    public ResponseEntity<QuotationDto> createQuotation(
            @Valid @RequestBody QuotationCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        QuotationDto created = quotationService.createQuotation(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationDto> getQuotation(@PathVariable String id) {
        return ResponseEntity.ok(quotationService.getQuotation(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuotationDto> submitQuotation(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(quotationService.submitQuotation(id, currentUser));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<QuotationDto> approveQuotation(
            @PathVariable String id,
            @RequestBody(required = false) QuotationApprovalRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(quotationService.approveQuotation(id, payload, currentUser));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<QuotationDto> rejectQuotation(
            @PathVariable String id,
            @RequestBody(required = false) QuotationApprovalRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(quotationService.rejectQuotation(id, payload, currentUser));
    }
}
