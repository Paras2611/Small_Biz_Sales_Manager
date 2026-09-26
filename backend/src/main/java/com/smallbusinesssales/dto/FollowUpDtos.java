package com.smallbusinesssales.dto;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class FollowUpDtos {

    public record FollowUpCreateRequest(
        String lead_id,
        String opportunity_id,
        String owner_id,
        String type,
        Instant due_at,
        String notes
    ) {}

    public record FollowUpUpdateRequest(
        String type,
        Instant due_at,
        String notes,
        String outcome,
        String status
    ) {}

    public record FollowUpCompleteRequest(
        @NotBlank String outcome,
        String next_action_notes
    ) {}

    public record FollowUpDto(
        String id,
        String lead_id,
        String opportunity_id,
        String owner_id,
        UserDto owner,
        String type,
        Instant due_at,
        String notes,
        String outcome,
        String status,
        boolean is_overdue,
        Instant created_at
    ) {}
}
