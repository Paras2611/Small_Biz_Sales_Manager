package com.smallbusinesssales.dto;

import java.util.List;

public class AiDtos {

    public record LeadPriorityRequest(
        String lead_id
    ) {}

    public record LeadPriorityResponse(
        String priority,
        List<String> evidence,
        String next_action,
        boolean is_ai_generated
    ) {}

    public record SummaryRequest(
        String lead_id,
        String opportunity_id
    ) {}

    public record SummaryResponse(
        String summary,
        List<String> points,
        boolean is_ai_generated
    ) {}

    public record NextActionRequest(
        String lead_id,
        String opportunity_id
    ) {}

    public record NextActionResponse(
        String recommended_action,
        String rationale,
        String suggested_message,
        boolean is_ai_generated
    ) {}
}
