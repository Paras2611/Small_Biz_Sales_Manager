package com.smallbusinesssales.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDateTime;

public class CustomerDtos {

    public record CustomerCreateDto(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Company is required") String company,
        String email,
        String phone,
        String address
    ) {}

    public record CustomerDto(
        String id,
        String name,
        String company,
        String email,
        String phone,
        String address,
        Instant created_at
    ) {}

    public record CustomerCreateRequest(
        @NotBlank(message = "Name is required") String name,
        String company_name,
        String email,
        String phone,
        String address,
        String city,
        String state,
        String pincode,
        String gstin
    ) {}

    public record CustomerUpdateRequest(
        String name,
        String company_name,
        String email,
        String phone,
        String address,
        String city,
        String state,
        String pincode,
        String gstin,
        String status
    ) {}

    public record CustomerResponse(
        String id,
        String name,
        String company_name,
        String email,
        String phone,
        String address,
        String city,
        String state,
        String pincode,
        String gstin,
        String status,
        LocalDateTime created_at,
        LocalDateTime updated_at
    ) {}
}
