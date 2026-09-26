package com.smallbusinesssales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class ProductDtos {

    public record ProductCreateRequest(
        @NotBlank String sku,
        @NotBlank String name,
        String category,
        @NotNull BigDecimal unit_price,
        BigDecimal tax_rate,
        Boolean active
    ) {}

    public record ProductUpdateRequest(
        String sku,
        String name,
        String category,
        BigDecimal unit_price,
        BigDecimal tax_rate,
        Boolean active
    ) {}

    public record ProductDto(
        String id,
        String sku,
        String name,
        String category,
        BigDecimal unit_price,
        BigDecimal tax_rate,
        boolean active,
        Instant created_at
    ) {}
}
