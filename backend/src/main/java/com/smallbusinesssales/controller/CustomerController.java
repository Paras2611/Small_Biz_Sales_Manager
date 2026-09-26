package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.CustomerDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/customers", "/api/customers"})
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> listCustomers(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.listCustomers(search));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(
            @Valid @RequestBody CustomerCreateDto payload,
            @AuthenticationPrincipal User currentUser
    ) {
        CustomerDto created = customerService.createCustomer(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDto> getCustomer(@PathVariable String id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<CustomerDto> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody CustomerCreateDto payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(customerService.updateCustomer(id, payload, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        customerService.deleteCustomer(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }
}
