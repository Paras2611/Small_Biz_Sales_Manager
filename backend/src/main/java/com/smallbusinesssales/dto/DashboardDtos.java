package com.smallbusinesssales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class DashboardDtos {

    public record KpisDto(
        long total_leads,
        long qualified_leads,
        long open_opportunities,
        BigDecimal quotation_value,
        BigDecimal won_value,
        double conversion_rate
    ) {}

    public record FunnelStageDto(
        String stage,
        long count,
        BigDecimal value
    ) {}

    public record TopOpportunityDto(
        String id,
        String title,
        String customer_name,
        String company,
        BigDecimal amount,
        String stage,
        int probability,
        String close_date
    ) {}

    public record OverdueFollowUpDto(
        String id,
        String type,
        String linked_name,
        String linked_type,
        String linked_id,
        Instant due_at,
        String owner_name,
        boolean is_overdue
    ) {}

    public record DashboardMetricsDto(
        KpisDto kpis,
        List<TopOpportunityDto> top_opportunities,
        long overdue_count,
        long due_today_count
    ) {}
}
