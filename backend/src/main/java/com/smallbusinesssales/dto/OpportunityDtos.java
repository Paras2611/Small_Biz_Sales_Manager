package com.smallbusinesssales.dto;

import com.smallbusinesssales.dto.CustomerDtos.CustomerDto;
import com.smallbusinesssales.dto.AuthDtos.UserDto;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class OpportunityDtos {

    public record OpportunityCreateRequest(
        @NotBlank String customer_id,
        String lead_id,
        String owner_id,
        @NotBlank String title,
        String stage,
        BigDecimal amount,
        int probability,
        LocalDate close_date
    ) {}

    public record OpportunityUpdateRequest(
        String title,
        String stage,
        BigDecimal amount,
        Integer probability,
        LocalDate close_date,
        String owner_id,
        String status,
        String lost_reason
    ) {}

    public record OpportunityMarkWonRequest(
        @NotBlank String quotation_id
    ) {}

    public record OpportunityMarkLostRequest(
        @NotBlank String lost_reason
    ) {}

    public record OpportunityDto(
        String id,
        String customer_id,
        CustomerDto customer,
        String lead_id,
        String owner_id,
        UserDto owner,
        String title,
        String stage,
        BigDecimal amount,
        int probability,
        LocalDate close_date,
        String status,
        String lost_reason,
        Instant won_at,
        Instant created_at,
        Instant updated_at
    ) {}
}
