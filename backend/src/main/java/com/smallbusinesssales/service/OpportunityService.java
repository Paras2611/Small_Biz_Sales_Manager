package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.CustomerDtos.CustomerDto;
import com.smallbusinesssales.dto.OpportunityDtos.*;
import com.smallbusinesssales.entity.Customer;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.BusinessConflictException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.CustomerRepository;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.QuotationRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final QuotationRepository quotationRepository;
    private final AuditLogService auditLogService;

    public OpportunityService(
            OpportunityRepository opportunityRepository,
            CustomerRepository customerRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            QuotationRepository quotationRepository,
            AuditLogService auditLogService
    ) {
        this.opportunityRepository = opportunityRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.quotationRepository = quotationRepository;
        this.auditLogService = auditLogService;
    }

    public List<OpportunityDto> listOpportunities(String stage, String status, String ownerId, String search) {
        List<Opportunity> opps = opportunityRepository.findAll();
        return opps.stream()
                .filter(o -> {
                    if (stage != null && !stage.isBlank()) {
                        return stage.equalsIgnoreCase(o.getStage());
                    }
                    return true;
                })
                .filter(o -> {
                    if (status != null && !status.isBlank()) {
                        return status.equalsIgnoreCase(o.getStatus());
                    }
                    return true;
                })
                .filter(o -> {
                    if (ownerId != null && !ownerId.isBlank()) {
                        return o.getOwner() != null && ownerId.equals(o.getOwner().getId());
                    }
                    return true;
                })
                .filter(o -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    boolean matchTitle = o.getTitle() != null && o.getTitle().toLowerCase().contains(s);
                    boolean matchCust = o.getCustomer() != null && (
                            (o.getCustomer().getName() != null && o.getCustomer().getName().toLowerCase().contains(s)) ||
                            (o.getCustomer().getCompany() != null && o.getCustomer().getCompany().toLowerCase().contains(s))
                    );
                    return matchTitle || matchCust;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public OpportunityDto getOpportunity(String id) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));
        return mapToDto(opp);
    }

    @Transactional
    public OpportunityDto createOpportunity(OpportunityCreateRequest payload, User currentUser) {
        Customer customer = customerRepository.findById(payload.customer_id())
                .orElseThrow(() -> new BadRequestException("Customer not found with id: " + payload.customer_id()));

        User owner = currentUser;
        if (payload.owner_id() != null && !payload.owner_id().isBlank()) {
            owner = userRepository.findById(payload.owner_id()).orElse(currentUser);
        }

        Opportunity opp = new Opportunity();
        opp.setCustomer(customer);
        if (payload.lead_id() != null && !payload.lead_id().isBlank()) {
            leadRepository.findById(payload.lead_id()).ifPresent(opp::setLead);
        }
        opp.setOwner(owner);
        opp.setTitle(payload.title());
        opp.setStage(payload.stage() != null && !payload.stage().isBlank() ? payload.stage() : "Prospecting");
        opp.setAmount(payload.amount() != null ? payload.amount() : BigDecimal.ZERO);
        opp.setProbability(payload.probability() > 0 ? payload.probability() : 20);
        opp.setCloseDate(payload.close_date() != null ? payload.close_date() : LocalDate.now().plusMonths(1));
        opp.setStatus("Open");

        Opportunity saved = opportunityRepository.save(opp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "Opportunity", saved.getId(), "Created opportunity " + saved.getTitle(), null);
        return mapToDto(saved);
    }

    @Transactional
    public OpportunityDto updateOpportunity(String id, OpportunityUpdateRequest payload, User currentUser) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        String oldStage = opp.getStage();
        if (payload.title() != null && !payload.title().isBlank()) opp.setTitle(payload.title());
        if (payload.stage() != null && !payload.stage().isBlank()) opp.setStage(payload.stage());
        if (payload.amount() != null) opp.setAmount(payload.amount());
        if (payload.probability() != null) opp.setProbability(payload.probability());
        if (payload.close_date() != null) opp.setCloseDate(payload.close_date());
        if (payload.status() != null && !payload.status().isBlank()) opp.setStatus(payload.status());
        if (payload.lost_reason() != null) opp.setLostReason(payload.lost_reason());
        if (payload.owner_id() != null && !payload.owner_id().isBlank()) {
            userRepository.findById(payload.owner_id()).ifPresent(opp::setOwner);
        }

        if (payload.stage() != null && !payload.stage().equalsIgnoreCase(oldStage)) {
            auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "STAGE_CHANGE", "Opportunity", opp.getId(), "Stage changed from " + oldStage + " to " + payload.stage(), null);
        }

        Opportunity saved = opportunityRepository.save(opp);
        return mapToDto(saved);
    }

    @Transactional
    public OpportunityDto markOpportunityWon(String id, OpportunityMarkWonRequest payload, User currentUser) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        if ("Closed Won".equalsIgnoreCase(opp.getStatus())) {
            throw new BusinessConflictException("Opportunity is already marked as Won");
        }

        Quotation quotation = quotationRepository.findById(payload.quotation_id())
                .orElseThrow(() -> new BadRequestException("Quotation not found with id: " + payload.quotation_id()));

        if (!opp.getId().equals(quotation.getOpportunity().getId())) {
            throw new BadRequestException("Quotation does not belong to this opportunity");
        }

        if (!"Approved".equalsIgnoreCase(quotation.getStatus())) {
            throw new BadRequestException("No approved quotation found for this opportunity");
        }

        opp.setStatus("Closed Won");
        opp.setStage("Closing");
        opp.setAmount(quotation.getGrandTotal());
        opp.setWonAt(Instant.now());

        Opportunity saved = opportunityRepository.save(opp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "MARK_WON", "Opportunity", opp.getId(), "Opportunity marked Closed Won with quotation " + quotation.getNumber(), null);
        return mapToDto(saved);
    }

    @Transactional
    public OpportunityDto markOpportunityLost(String id, OpportunityMarkLostRequest payload, User currentUser) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        opp.setStatus("Closed Lost");
        opp.setLostReason(payload.lost_reason());

        Opportunity saved = opportunityRepository.save(opp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "MARK_LOST", "Opportunity", opp.getId(), "Opportunity marked Closed Lost. Reason: " + payload.lost_reason(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteOpportunity(String id, User currentUser) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));
        opportunityRepository.delete(opp);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "DELETE", "Opportunity", id, "Deleted opportunity " + opp.getTitle(), null);
    }

    public OpportunityDto mapToDto(Opportunity o) {
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
