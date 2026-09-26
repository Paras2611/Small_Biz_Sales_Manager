package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.CustomerDtos.*;
import com.smallbusinesssales.entity.Customer;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    public CustomerService(CustomerRepository customerRepository, AuditLogService auditLogService) {
        this.customerRepository = customerRepository;
        this.auditLogService = auditLogService;
    }

    public List<CustomerDto> listCustomers(String search) {
        List<Customer> customers = customerRepository.findAll();
        return customers.stream()
                .filter(c -> c.getDeletedAt() == null)
                .filter(c -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    return (c.getName() != null && c.getName().toLowerCase().contains(s)) ||
                            (c.getCompany() != null && c.getCompany().toLowerCase().contains(s)) ||
                            (c.getEmail() != null && c.getEmail().toLowerCase().contains(s)) ||
                            (c.getPhone() != null && c.getPhone().toLowerCase().contains(s));
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CustomerDto getCustomer(String id) {
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return mapToDto(customer);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateDto request, User currentUser) {
        Customer customer = new Customer();
        customer.setName(request.name());
        customer.setCompany(request.company());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.setAddress(request.address());

        Customer saved = customerRepository.save(customer);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "Customer", saved.getId(), "Created customer " + saved.getName(), null);
        return mapToDto(saved);
    }

    @Transactional
    public CustomerDto updateCustomer(String id, CustomerCreateDto request, User currentUser) {
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        if (request.name() != null) customer.setName(request.name());
        if (request.company() != null) customer.setCompany(request.company());
        if (request.email() != null) customer.setEmail(request.email());
        if (request.phone() != null) customer.setPhone(request.phone());
        if (request.address() != null) customer.setAddress(request.address());

        Customer saved = customerRepository.save(customer);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "UPDATE", "Customer", saved.getId(), "Updated customer " + saved.getName(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteCustomer(String id, User currentUser) {
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setDeletedAt(Instant.now());
        customerRepository.save(customer);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "DELETE", "Customer", id, "Soft deleted customer " + customer.getName(), null);
    }

    public CustomerDto mapToDto(Customer c) {
        return new CustomerDto(
                c.getId(),
                c.getName(),
                c.getCompany(),
                c.getEmail(),
                c.getPhone(),
                c.getAddress(),
                c.getCreatedAt()
        );
    }
}
