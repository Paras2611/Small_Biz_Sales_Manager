package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.DashboardDtos.*;
import com.smallbusinesssales.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/dashboard", "/api/dashboard"})
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDto> getMetrics(
            @RequestParam(name = "owner_id", required = false) String ownerId
    ) {
        return ResponseEntity.ok(dashboardService.getMetrics(ownerId));
    }

    @GetMapping("/funnel")
    public ResponseEntity<List<FunnelStageDto>> getFunnel(
            @RequestParam(name = "owner_id", required = false) String ownerId
    ) {
        return ResponseEntity.ok(dashboardService.getFunnel(ownerId));
    }

    @GetMapping("/overdue-followups")
    public ResponseEntity<List<OverdueFollowUpDto>> getOverdueFollowUps() {
        return ResponseEntity.ok(dashboardService.getOverdueFollowUps());
    }
}
