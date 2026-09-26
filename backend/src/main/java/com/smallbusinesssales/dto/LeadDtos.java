package com.smallbusinesssales.dto;

import com.smallbusinesssales.dto.CustomerDtos.CustomerCreateDto;
import com.smallbusinesssales.dto.CustomerDtos.CustomerDto;
import com.smallbusinesssales.dto.AuthDtos.UserDto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;

public class LeadDtos {

    public record LeadCreateRequest(
        String customer_id,
        CustomerCreateDto customer,
        String source,
        String owner_id,
        BigDecimal estimated_value,
        String qualification_notes,
        String notes
    ) {}

    public record LeadUpdateRequest(
        String source,
        String status,
        String owner_id,
        Integer score,
        String qualification_notes,
        BigDecimal estimated_value
    ) {}

    public record LeadQualifyRequest(
        boolean budget_confirmed,
        boolean decision_maker_identified,
        @Min(1) int timeline_months,
        @NotBlank String notes
    ) {}

    public record LeadConvertRequest(
        @NotBlank String title,
        BigDecimal amount,
        String close_date,
        int probability,
        String stage
    ) {}

    public record LeadDto(
        String id,
        String customer_id,
        CustomerDto customer,
        String owner_id,
        UserDto owner,
        String source,
        String status,
        int score,
        String qualification_notes,
        BigDecimal estimated_value,
        Instant created_at,
        Instant updated_at
    ) {}
}
