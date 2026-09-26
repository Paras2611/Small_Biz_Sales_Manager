package com.smallbusinesssales.controller;

import com.smallbusinesssales.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/reports", "/api/reports"})
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/pipeline")
    public ResponseEntity<List<Map<String, Object>>> getPipelineByStage() {
        return ResponseEntity.ok(reportService.getPipelineByStage());
    }

    @GetMapping("/conversion-funnel")
    public ResponseEntity<List<Map<String, Object>>> getConversionFunnel() {
        return ResponseEntity.ok(reportService.getConversionFunnel());
    }

    @GetMapping("/quotation-status")
    public ResponseEntity<List<Map<String, Object>>> getQuotationStatus() {
        return ResponseEntity.ok(reportService.getQuotationStatus());
    }

    @GetMapping("/owner-performance")
    public ResponseEntity<List<Map<String, Object>>> getOwnerPerformance() {
        return ResponseEntity.ok(reportService.getOwnerPerformance());
    }
}
