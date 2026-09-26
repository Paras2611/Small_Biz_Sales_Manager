package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.QuotationDtos.*;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Product;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.repository.AuditLogRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.ProductRepository;
import com.smallbusinesssales.repository.QuotationRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuotationCalculationTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private QuotationService quotationService;
    private User currentUser;
    private Opportunity opportunity;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        AuditLogService auditLogService = new AuditLogService(auditLogRepository, userRepository);
        quotationService = new QuotationService(quotationRepository, opportunityRepository, productRepository, auditLogService);
        currentUser = new User("Arjun Shah", "arjun@demo.com", "hash", "sales_executive");
        opportunity = new Opportunity();

        product1 = new Product("PROD-CRM-01", "CRM Starter", "Software", new BigDecimal("25000.00"), new BigDecimal("18.00"));
        product2 = new Product("PROD-WFL-02", "Workflow Automation", "Add-on", new BigDecimal("40000.00"), new BigDecimal("18.00"));
    }

    @Test
    void testQuotationPricingAndTaxCalculation() {
        when(opportunityRepository.findById(opportunity.getId())).thenReturn(Optional.of(opportunity));
        when(productRepository.findById(product1.getId())).thenReturn(Optional.of(product1));
        when(productRepository.findById(product2.getId())).thenReturn(Optional.of(product2));
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<QuotationLineCreateRequest> lines = List.of(
                new QuotationLineCreateRequest(product1.getId(), "CRM Starter", 2, new BigDecimal("25000.00")),
                new QuotationLineCreateRequest(product2.getId(), "Workflow Automation", 1, new BigDecimal("40000.00"))
        );

        QuotationCreateRequest createReq = new QuotationCreateRequest(
                opportunity.getId(),
                new BigDecimal("10.00"),
                lines
        );

        QuotationDto quote = quotationService.createQuotation(createReq, currentUser);

        assertNotNull(quote);
        assertEquals("Draft", quote.status());
        assertEquals(new BigDecimal("90000.00"), quote.subtotal());
        assertEquals(new BigDecimal("9000.00"), quote.discount_amount());
        assertEquals(new BigDecimal("16200.00"), quote.tax_amount());
        assertEquals(new BigDecimal("97200.00"), quote.grand_total());
        assertEquals(2, quote.lines().size());
    }

    @Test
    void testQuotationApprovalWorkflow() {
        Quotation quotation = new Quotation();
        quotation.setStatus("Pending Approval");
        quotation.setNumber("QT-2026-001");

        when(quotationRepository.findById(quotation.getId())).thenReturn(Optional.of(quotation));
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User manager = new User("Priya Mehta", "priya@demo.com", "hash", "sales_manager");
        QuotationApprovalRequest approvalReq = new QuotationApprovalRequest("Approved by sales manager");

        QuotationDto approved = quotationService.approveQuotation(quotation.getId(), approvalReq, manager);

        assertEquals("Approved", approved.status());
        assertEquals("Approved by sales manager", approved.approval_comment());
        assertNotNull(approved.approved_at());
    }
}
