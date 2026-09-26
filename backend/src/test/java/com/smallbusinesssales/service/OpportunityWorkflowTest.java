package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.OpportunityDtos.*;
import com.smallbusinesssales.entity.Customer;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.BusinessConflictException;
import com.smallbusinesssales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpportunityWorkflowTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    private OpportunityService opportunityService;
    private User currentUser;
    private Opportunity opportunity;

    @BeforeEach
    void setUp() {
        AuditLogService auditLogService = new AuditLogService(auditLogRepository, userRepository);
        opportunityService = new OpportunityService(
                opportunityRepository,
                customerRepository,
                leadRepository,
                userRepository,
                quotationRepository,
                auditLogService
        );
        currentUser = new User("Arjun Shah", "arjun@demo.com", "hash", "sales_executive");
        opportunity = new Opportunity();
        opportunity.setStatus("Open");
        opportunity.setStage("Proposal");
        opportunity.setAmount(new BigDecimal("100000.00"));
    }

    @Test
    void testMarkOpportunityWonWithApprovedQuotation() {
        Quotation quotation = new Quotation();
        quotation.setOpportunity(opportunity);
        quotation.setStatus("Approved");
        quotation.setGrandTotal(new BigDecimal("95580.00"));

        when(opportunityRepository.findById(opportunity.getId())).thenReturn(Optional.of(opportunity));
        when(quotationRepository.findById(quotation.getId())).thenReturn(Optional.of(quotation));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpportunityMarkWonRequest wonReq = new OpportunityMarkWonRequest(quotation.getId());
        OpportunityDto won = opportunityService.markOpportunityWon(opportunity.getId(), wonReq, currentUser);

        assertEquals("Closed Won", won.status());
        assertEquals("Closing", won.stage());
        assertEquals(new BigDecimal("95580.00"), won.amount());
        assertNotNull(won.won_at());
    }

    @Test
    void testMarkOpportunityWonWithUnapprovedQuotationFails() {
        Quotation quotation = new Quotation();
        quotation.setOpportunity(opportunity);
        quotation.setStatus("Draft"); // Not approved!

        when(opportunityRepository.findById(opportunity.getId())).thenReturn(Optional.of(opportunity));
        when(quotationRepository.findById(quotation.getId())).thenReturn(Optional.of(quotation));

        OpportunityMarkWonRequest wonReq = new OpportunityMarkWonRequest(quotation.getId());

        assertThrows(BadRequestException.class, () ->
                opportunityService.markOpportunityWon(opportunity.getId(), wonReq, currentUser)
        );
    }

    @Test
    void testAlreadyWonOpportunityThrows409Conflict() {
        opportunity.setStatus("Closed Won");

        when(opportunityRepository.findById(opportunity.getId())).thenReturn(Optional.of(opportunity));

        OpportunityMarkWonRequest wonReq = new OpportunityMarkWonRequest("quote-id");

        assertThrows(BusinessConflictException.class, () ->
                opportunityService.markOpportunityWon(opportunity.getId(), wonReq, currentUser)
        );
    }
}
