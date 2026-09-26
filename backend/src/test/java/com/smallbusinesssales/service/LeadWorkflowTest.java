package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.LeadDtos.*;
import com.smallbusinesssales.dto.OpportunityDtos.OpportunityDto;
import com.smallbusinesssales.entity.Customer;
import com.smallbusinesssales.entity.Lead;
import com.smallbusinesssales.entity.Opportunity;
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
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadWorkflowTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    private LeadService leadService;
    private User currentUser;
    private Customer customer;

    @BeforeEach
    void setUp() {
        AuditLogService auditLogService = new AuditLogService(auditLogRepository, userRepository);
        leadService = new LeadService(leadRepository, customerRepository, opportunityRepository, userRepository, auditLogService);
        currentUser = new User("Arjun Shah", "arjun@demo.com", "hash", "sales_executive");
        customer = new Customer("Rajesh Kumar", "ABC Manufacturing", "rajesh@abc.com", "9876543210", "Pune");
    }

    @Test
    void testLeadCreation() {
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeadCreateRequest request = new LeadCreateRequest(
                customer.getId(),
                null,
                "Website",
                null,
                new BigDecimal("500000.00"),
                null,
                "Initial inquiry"
        );

        LeadDto result = leadService.createLead(request, currentUser);

        assertNotNull(result);
        assertEquals("New", result.status());
        assertEquals(20, result.score());
        assertEquals("Website", result.source());
        verify(leadRepository).save(any(Lead.class));
    }

    @Test
    void testLeadQualification() {
        Lead lead = new Lead();
        lead.setCustomer(customer);
        lead.setStatus("New");
        lead.setScore(30);

        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeadQualifyRequest qualifyReq = new LeadQualifyRequest(true, true, 3, "Confirmed budget and timeline");

        LeadDto qualified = leadService.qualifyLead(lead.getId(), qualifyReq, currentUser);

        assertEquals("Qualified", qualified.status());
        assertEquals(80, qualified.score()); // 30 + 50
        assertTrue(qualified.qualification_notes().contains("Budget: true"));
    }

    @Test
    void testLeadConversionToOpportunity() {
        Lead lead = new Lead();
        lead.setCustomer(customer);
        lead.setStatus("Qualified");
        lead.setEstimatedValue(new BigDecimal("250000.00"));

        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));
        when(opportunityRepository.findAll()).thenReturn(Collections.emptyList());
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeadConvertRequest convertReq = new LeadConvertRequest(
                "ABC Implementation Deal",
                new BigDecimal("250000.00"),
                LocalDate.now().plusDays(30).toString(),
                50,
                "Proposal"
        );

        OpportunityDto opp = leadService.convertLeadToOpportunity(lead.getId(), convertReq, currentUser);

        assertNotNull(opp);
        assertEquals("ABC Implementation Deal", opp.title());
        assertEquals("Proposal", opp.stage());
        assertEquals("Open", opp.status());
    }

    @Test
    void testUnqualifiedLeadCannotBeConverted() {
        Lead lead = new Lead();
        lead.setCustomer(customer);
        lead.setStatus("New"); // Not qualified!

        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));

        LeadConvertRequest convertReq = new LeadConvertRequest(
                "Deal",
                new BigDecimal("100000.00"),
                LocalDate.now().plusDays(30).toString(),
                20,
                "Prospecting"
        );

        assertThrows(BadRequestException.class, () ->
                leadService.convertLeadToOpportunity(lead.getId(), convertReq, currentUser)
        );
    }

    @Test
    void testDuplicateLeadConversionThrows409Conflict() {
        Lead lead = new Lead();
        lead.setCustomer(customer);
        lead.setStatus("Qualified");

        Opportunity existingOpp = new Opportunity();
        existingOpp.setLead(lead);

        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));
        when(opportunityRepository.findAll()).thenReturn(List.of(existingOpp));

        LeadConvertRequest convertReq = new LeadConvertRequest(
                "Duplicate Deal",
                new BigDecimal("100000.00"),
                LocalDate.now().plusDays(30).toString(),
                20,
                "Prospecting"
        );

        assertThrows(BusinessConflictException.class, () ->
                leadService.convertLeadToOpportunity(lead.getId(), convertReq, currentUser)
        );
    }
}
