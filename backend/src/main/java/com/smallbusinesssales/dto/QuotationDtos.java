package com.smallbusinesssales.dto;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.ProductDtos.ProductDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class QuotationDtos {

    public record QuotationLineCreateRequest(
        @NotBlank String product_id,
        String description,
        int qty,
        BigDecimal unit_price
    ) {}

    public record QuotationCreateRequest(
        @NotBlank String opportunity_id,
        BigDecimal discount_pct,
        @NotEmpty List<QuotationLineCreateRequest> lines
    ) {}

    public record QuotationApprovalRequest(
        String comment
    ) {}

    public record QuotationLineDto(
        String id,
        String quotation_id,
        String product_id,
        ProductDto product,
        String description,
        int qty,
        BigDecimal unit_price,
        BigDecimal tax_rate,
        BigDecimal line_total
    ) {}

    public record QuotationDto(
        String id,
        String opportunity_id,
        String number,
        String status,
        BigDecimal subtotal,
        BigDecimal discount_pct,
        BigDecimal discount_amount,
        BigDecimal tax_amount,
        BigDecimal grand_total,
        String approved_by,
        UserDto approver,
        Instant approved_at,
        String approval_comment,
        Instant created_at,
        List<QuotationLineDto> lines
    ) {}
}
