package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.AuthDtos.UserDto;
import com.smallbusinesssales.dto.ProductDtos.ProductDto;
import com.smallbusinesssales.dto.QuotationDtos.*;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Product;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.entity.QuotationLine;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.BusinessConflictException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.ProductRepository;
import com.smallbusinesssales.repository.QuotationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final OpportunityRepository opportunityRepository;
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;

    public QuotationService(
            QuotationRepository quotationRepository,
            OpportunityRepository opportunityRepository,
            ProductRepository productRepository,
            AuditLogService auditLogService
    ) {
        this.quotationRepository = quotationRepository;
        this.opportunityRepository = opportunityRepository;
        this.productRepository = productRepository;
        this.auditLogService = auditLogService;
    }

    public List<QuotationDto> listQuotations(String opportunityId, String status) {
        List<Quotation> quotations = quotationRepository.findAll();
        return quotations.stream()
                .filter(q -> {
                    if (opportunityId != null && !opportunityId.isBlank()) {
                        return q.getOpportunity() != null && opportunityId.equals(q.getOpportunity().getId());
                    }
                    return true;
                })
                .filter(q -> {
                    if (status != null && !status.isBlank()) {
                        return status.equalsIgnoreCase(q.getStatus());
                    }
                    return true;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public QuotationDto getQuotation(String id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));
        return mapToDto(quotation);
    }

    @Transactional
    public QuotationDto createQuotation(QuotationCreateRequest payload, User currentUser) {
        Opportunity opp = opportunityRepository.findById(payload.opportunity_id())
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + payload.opportunity_id()));

        BigDecimal discountPct = payload.discount_pct() != null ? payload.discount_pct() : BigDecimal.ZERO;
        String quotationNumber = generateQuotationNumber();

        Quotation quotation = new Quotation();
        quotation.setOpportunity(opp);
        quotation.setNumber(quotationNumber);
        quotation.setStatus("Draft");
        quotation.setDiscountPct(discountPct);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        List<QuotationLine> lines = new ArrayList<>();

        for (QuotationLineCreateRequest lineReq : payload.lines()) {
            Product product = productRepository.findById(lineReq.product_id())
                    .orElseThrow(() -> new BadRequestException("Active product " + lineReq.product_id() + " not found"));

            if (!product.isActive()) {
                throw new BadRequestException("Product " + product.getName() + " is inactive");
            }

            BigDecimal unitPrice = lineReq.unit_price() != null ? lineReq.unit_price() : product.getUnitPrice();
            int qty = lineReq.qty() > 0 ? lineReq.qty() : 1;
            BigDecimal lineBase = unitPrice.multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTax = lineBase.multiply(product.getTaxRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal lineTotal = lineBase.add(lineTax).setScale(2, RoundingMode.HALF_UP);

            QuotationLine line = new QuotationLine();
            line.setQuotation(quotation);
            line.setProduct(product);
            line.setDescription(lineReq.description() != null ? lineReq.description() : product.getName());
            line.setQty(qty);
            line.setUnitPrice(unitPrice.setScale(2, RoundingMode.HALF_UP));
            line.setTaxRate(product.getTaxRate().setScale(2, RoundingMode.HALF_UP));
            line.setLineTotal(lineTotal);

            lines.add(line);
            subtotal = subtotal.add(lineBase);
            taxAmount = taxAmount.add(lineTax);
        }

        BigDecimal discountAmount = subtotal.multiply(discountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxableSubtotal = subtotal.subtract(discountAmount);
        BigDecimal grandTotal = taxableSubtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        quotation.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        quotation.setDiscountAmount(discountAmount);
        quotation.setTaxAmount(taxAmount.setScale(2, RoundingMode.HALF_UP));
        quotation.setGrandTotal(grandTotal);
        quotation.setLines(lines);

        Quotation saved = quotationRepository.save(quotation);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "Quotation", saved.getId(), "Created quotation " + saved.getNumber(), null);
        return mapToDto(saved);
    }

    @Transactional
    public QuotationDto submitQuotation(String id, User currentUser) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));

        if (!"Draft".equalsIgnoreCase(quotation.getStatus())) {
            throw new BadRequestException("Only Draft quotations can be submitted");
        }
        if (quotation.getLines() == null || quotation.getLines().isEmpty()) {
            throw new BadRequestException("Quotation has no line items");
        }

        quotation.setStatus("Pending Approval");
        Quotation saved = quotationRepository.save(quotation);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "SUBMIT_APPROVAL", "Quotation", saved.getId(), "Submitted quotation for approval", null);
        return mapToDto(saved);
    }

    @Transactional
    public QuotationDto approveQuotation(String id, QuotationApprovalRequest request, User currentUser) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));

        if (!"Pending Approval".equalsIgnoreCase(quotation.getStatus()) && !"Draft".equalsIgnoreCase(quotation.getStatus())) {
            throw new BusinessConflictException("Quotation cannot be approved from status: " + quotation.getStatus());
        }

        quotation.setStatus("Approved");
        quotation.setApprover(currentUser);
        quotation.setApprovedAt(Instant.now());
        quotation.setApprovalComment(request != null && request.comment() != null ? request.comment() : "Approved by manager");

        Quotation saved = quotationRepository.save(quotation);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "APPROVE", "Quotation", saved.getId(), "Approved quotation " + saved.getNumber(), null);
        return mapToDto(saved);
    }

    @Transactional
    public QuotationDto rejectQuotation(String id, QuotationApprovalRequest request, User currentUser) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));

        quotation.setStatus("Rejected");
        quotation.setApprover(currentUser);
        quotation.setApprovedAt(Instant.now());
        quotation.setApprovalComment(request != null && request.comment() != null ? request.comment() : "Rejected");

        Quotation saved = quotationRepository.save(quotation);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "REJECT", "Quotation", saved.getId(), "Rejected quotation " + saved.getNumber(), null);
        return mapToDto(saved);
    }

    private synchronized String generateQuotationNumber() {
        int year = LocalDate.now().getYear();
        long count = quotationRepository.count() + 1;
        return String.format("QT-%d-%03d", year, count);
    }

    public QuotationDto mapToDto(Quotation q) {
        List<QuotationLineDto> lines = q.getLines() != null
                ? q.getLines().stream().map(l -> new QuotationLineDto(
                        l.getId(),
                        q.getId(),
                        l.getProduct().getId(),
                        new ProductDto(
                                l.getProduct().getId(),
                                l.getProduct().getSku(),
                                l.getProduct().getName(),
                                l.getProduct().getCategory(),
                                l.getProduct().getUnitPrice(),
                                l.getProduct().getTaxRate(),
                                l.getProduct().isActive(),
                                l.getProduct().getCreatedAt()
                        ),
                        l.getDescription(),
                        l.getQty(),
                        l.getUnitPrice(),
                        l.getTaxRate(),
                        l.getLineTotal()
                )).collect(Collectors.toList())
                : List.of();

        UserDto approverDto = null;
        if (q.getApprover() != null) {
            approverDto = new UserDto(
                    q.getApprover().getId(),
                    q.getApprover().getName(),
                    q.getApprover().getEmail(),
                    q.getApprover().getRole(),
                    q.getApprover().isActive(),
                    q.getApprover().getCreatedAt()
            );
        }

        return new QuotationDto(
                q.getId(),
                q.getOpportunity() != null ? q.getOpportunity().getId() : null,
                q.getNumber(),
                q.getStatus(),
                q.getSubtotal(),
                q.getDiscountPct(),
                q.getDiscountAmount(),
                q.getTaxAmount(),
                q.getGrandTotal(),
                q.getApprover() != null ? q.getApprover().getId() : null,
                approverDto,
                q.getApprovedAt(),
                q.getApprovalComment(),
                q.getCreatedAt(),
                lines
        );
    }
}
