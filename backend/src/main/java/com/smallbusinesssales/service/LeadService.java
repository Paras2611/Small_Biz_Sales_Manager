package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.CustomerDtos.CustomerDto;
import com.smallbusinesssales.dto.LeadDtos.*;
import com.smallbusinesssales.dto.OpportunityDtos.OpportunityDto;
import com.smallbusinesssales.entity.Customer;
import com.smallbusinesssales.entity.Lead;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.BusinessConflictException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.CustomerRepository;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public LeadService(
            LeadRepository leadRepository,
            CustomerRepository customerRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public List<LeadDto> listLeads(String search, String status, String ownerId) {
        List<Lead> leads = leadRepository.findAll();
        return leads.stream()
                .filter(l -> l.getDeletedAt() == null)
                .filter(l -> {
                    if (status != null && !status.isBlank()) {
                        return status.equalsIgnoreCase(l.getStatus());
                    }
                    return true;
                })
                .filter(l -> {
                    if (ownerId != null && !ownerId.isBlank()) {
                        return l.getOwner() != null && ownerId.equals(l.getOwner().getId());
                    }
                    return true;
                })
                .filter(l -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    boolean matchCust = l.getCustomer() != null && (
                            (l.getCustomer().getName() != null && l.getCustomer().getName().toLowerCase().contains(s)) ||
                            (l.getCustomer().getCompany() != null && l.getCustomer().getCompany().toLowerCase().contains(s)) ||
                            (l.getCustomer().getEmail() != null && l.getCustomer().getEmail().toLowerCase().contains(s))
                    );
                    boolean matchSource = l.getSource() != null && l.getSource().toLowerCase().contains(s);
                    return matchCust || matchSource;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LeadDto getLead(String id) {
        Lead lead = leadRepository.findById(id)
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
        return mapToDto(lead);
    }

    @Transactional
    public LeadDto createLead(LeadCreateRequest payload, User currentUser) {
        Customer customer;
        if (payload.customer_id() != null && !payload.customer_id().isBlank()) {
            customer = customerRepository.findById(payload.customer_id())
                    .orElseThrow(() -> new BadRequestException("Customer not found with id: " + payload.customer_id()));
        } else if (payload.customer() != null) {
            customer = new Customer();
            customer.setName(payload.customer().name());
            customer.setCompany(payload.customer().company());
            customer.setEmail(payload.customer().email());
            customer.setPhone(payload.customer().phone());
            customer.setAddress(payload.customer().address());
            customer = customerRepository.save(customer);
        } else {
            throw new BadRequestException("Customer information or customer_id is required");
        }

        User owner = currentUser;
        if (payload.owner_id() != null && !payload.owner_id().isBlank()) {
            owner = userRepository.findById(payload.owner_id()).orElse(currentUser);
        }

        Lead lead = new Lead();
        lead.setCustomer(customer);
        lead.setOwner(owner);
        lead.setSource(payload.source() != null && !payload.source().isBlank() ? payload.source() : "Website");
        lead.setStatus("New");
        lead.setScore(20);
        lead.setEstimatedValue(payload.estimated_value() != null ? payload.estimated_value() : BigDecimal.ZERO);
        lead.setQualificationNotes(payload.notes() != null ? payload.notes() : payload.qualification_notes());

        Lead saved = leadRepository.save(lead);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "Lead", saved.getId(), "Created lead from " + saved.getSource(), null);
        return mapToDto(saved);
    }

    @Transactional
    public LeadDto updateLead(String id, LeadUpdateRequest payload, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        String oldStatus = lead.getStatus();
        if (payload.source() != null) lead.setSource(payload.source());
        if (payload.status() != null) lead.setStatus(payload.status());
        if (payload.score() != null) lead.setScore(payload.score());
        if (payload.qualification_notes() != null) lead.setQualificationNotes(payload.qualification_notes());
        if (payload.estimated_value() != null) lead.setEstimatedValue(payload.estimated_value());
        if (payload.owner_id() != null && !payload.owner_id().isBlank()) {
            userRepository.findById(payload.owner_id()).ifPresent(lead::setOwner);
        }

        if (payload.status() != null && !payload.status().equalsIgnoreCase(oldStatus)) {
            auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "STATUS_CHANGE", "Lead", lead.getId(), "Status changed from " + oldStatus + " to " + payload.status(), null);
        }

        Lead saved = leadRepository.save(lead);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteLead(String id, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        lead.setDeletedAt(Instant.now());
        leadRepository.save(lead);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "SOFT_DELETE", "Lead", id, "Soft deleted lead", null);
    }

    @Transactional
    public LeadDto qualifyLead(String id, LeadQualifyRequest payload, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        lead.setStatus("Qualified");
        lead.setScore(Math.min(100, lead.getScore() + 50));
        lead.setQualificationNotes(
                "Budget: " + payload.budget_confirmed() + " | Decision Maker: " + payload.decision_maker_identified() +
                " | Timeline: " + payload.timeline_months() + "m | Notes: " + payload.notes()
        );

        Lead saved = leadRepository.save(lead);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "QUALIFY", "Lead", saved.getId(), "Lead qualified with score " + saved.getScore(), null);
        return mapToDto(saved);
    }

    @Transactional
    public OpportunityDto convertLeadToOpportunity(String id, LeadConvertRequest payload, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        if (!"Qualified".equalsIgnoreCase(lead.getStatus())) {
            throw new BadRequestException("Only qualified leads can be converted to an opportunity");
        }

        // Check if opportunity already exists for this lead
        List<Opportunity> existing = opportunityRepository.findAll().stream()
                .filter(o -> o.getLead() != null && id.equals(o.getLead().getId()))
                .collect(Collectors.toList());
        if (!existing.isEmpty()) {
            throw new BusinessConflictException("An opportunity has already been created from this lead");
        }

        LocalDate closeDate;
        try {
            closeDate = LocalDate.parse(payload.close_date());
        } catch (Exception e) {
            closeDate = LocalDate.now().plusMonths(1);
        }

        Opportunity opp = new Opportunity();
        opp.setCustomer(lead.getCustomer());
        opp.setLead(lead);
        opp.setOwner(lead.getOwner() != null ? lead.getOwner() : currentUser);
        opp.setTitle(payload.title());
        opp.setStage(payload.stage() != null && !payload.stage().isBlank() ? payload.stage() : "Prospecting");
        opp.setAmount(payload.amount() != null ? payload.amount() : lead.getEstimatedValue());
        opp.setProbability(payload.probability() > 0 ? payload.probability() : 20);
        opp.setCloseDate(closeDate);
        opp.setStatus("Open");

        Opportunity savedOpp = opportunityRepository.save(opp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CONVERT_TO_OPPORTUNITY", "Lead", lead.getId(), "Converted to opportunity " + savedOpp.getTitle(), null);

        return mapOpportunityToDto(savedOpp);
    }

    public LeadDto mapToDto(Lead l) {
        CustomerDto customerDto = null;
        if (l.getCustomer() != null) {
            customerDto = new CustomerDto(
                    l.getCustomer().getId(),
                    l.getCustomer().getName(),
                    l.getCustomer().getCompany(),
                    l.getCustomer().getEmail(),
                    l.getCustomer().getPhone(),
                    l.getCustomer().getAddress(),
                    l.getCustomer().getCreatedAt()
            );
        }

        UserDto ownerDto = null;
        if (l.getOwner() != null) {
            ownerDto = new UserDto(
                    l.getOwner().getId(),
                    l.getOwner().getName(),
                    l.getOwner().getEmail(),
                    l.getOwner().getRole(),
                    l.getOwner().isActive(),
                    l.getOwner().getCreatedAt()
            );
        }

        return new LeadDto(
                l.getId(),
                l.getCustomer() != null ? l.getCustomer().getId() : null,
                customerDto,
                l.getOwner() != null ? l.getOwner().getId() : null,
                ownerDto,
                l.getSource(),
                l.getStatus(),
                l.getScore(),
                l.getQualificationNotes(),
                l.getEstimatedValue(),
                l.getCreatedAt(),
                l.getUpdatedAt()
        );
    }

    private OpportunityDto mapOpportunityToDto(Opportunity o) {
        CustomerDto customerDto = null;
        if (o.getCustomer() != null) {
            customerDto = new CustomerDto(
                    o.getCustomer().getId(),
                    o.getCustomer().getName(),
                    o.getCustomer().getCompany(),
                    o.getCustomer().getEmail(),
                    o.getCustomer().getPhone(),
                    o.getCustomer().getAddress(),
                    o.getCustomer().getCreatedAt()
            );
        }

        UserDto ownerDto = null;
        if (o.getOwner() != null) {
            ownerDto = new UserDto(
                    o.getOwner().getId(),
                    o.getOwner().getName(),
                    o.getOwner().getEmail(),
                    o.getOwner().getRole(),
                    o.getOwner().isActive(),
                    o.getOwner().getCreatedAt()
            );
        }

        return new OpportunityDto(
                o.getId(),
                o.getCustomer() != null ? o.getCustomer().getId() : null,
                customerDto,
                o.getLead() != null ? o.getLead().getId() : null,
                o.getOwner() != null ? o.getOwner().getId() : null,
                ownerDto,
                o.getTitle(),
                o.getStage(),
                o.getAmount(),
                o.getProbability(),
                o.getCloseDate(),
                o.getStatus(),
                o.getLostReason(),
                o.getWonAt(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
