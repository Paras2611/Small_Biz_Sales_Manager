package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.DashboardDtos.*;
import com.smallbusinesssales.entity.FollowUp;
import com.smallbusinesssales.entity.Lead;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.repository.FollowUpRepository;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.QuotationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final QuotationRepository quotationRepository;
    private final FollowUpRepository followUpRepository;

    public DashboardService(
            LeadRepository leadRepository,
            OpportunityRepository opportunityRepository,
            QuotationRepository quotationRepository,
            FollowUpRepository followUpRepository
    ) {
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.quotationRepository = quotationRepository;
        this.followUpRepository = followUpRepository;
    }

    public DashboardMetricsDto getMetrics(String ownerId) {
        List<Lead> leads = leadRepository.findAll().stream()
                .filter(l -> l.getDeletedAt() == null)
                .filter(l -> ownerId == null || ownerId.isBlank() || (l.getOwner() != null && ownerId.equals(l.getOwner().getId())))
                .collect(Collectors.toList());

        long totalLeads = leads.size();
        long qualifiedLeads = leads.stream().filter(l -> "Qualified".equalsIgnoreCase(l.getStatus())).count();

        List<Opportunity> opps = opportunityRepository.findAll().stream()
                .filter(o -> ownerId == null || ownerId.isBlank() || (o.getOwner() != null && ownerId.equals(o.getOwner().getId())))
                .collect(Collectors.toList());

        long openOpportunities = opps.stream().filter(o -> "Open".equalsIgnoreCase(o.getStatus())).count();

        BigDecimal wonValue = opps.stream()
                .filter(o -> "Closed Won".equalsIgnoreCase(o.getStatus()))
                .map(Opportunity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long wonCount = opps.stream().filter(o -> "Closed Won".equalsIgnoreCase(o.getStatus())).count();
        double conversionRate = totalLeads > 0
                ? BigDecimal.valueOf((double) wonCount / totalLeads * 100).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        List<Quotation> quotations = quotationRepository.findAll();
        BigDecimal quotationValue = quotations.stream()
                .filter(q -> Arrays.asList("Draft", "Pending Approval", "Approved").contains(q.getStatus()))
                .map(Quotation::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top 5 Open Opportunities
        List<TopOpportunityDto> topOpportunities = opps.stream()
                .filter(o -> "Open".equalsIgnoreCase(o.getStatus()))
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .limit(5)
                .map(o -> new TopOpportunityDto(
                        o.getId(),
                        o.getTitle(),
                        o.getCustomer() != null ? o.getCustomer().getName() : "Unknown",
                        o.getCustomer() != null ? o.getCustomer().getCompany() : "Unknown",
                        o.getAmount(),
                        o.getStage(),
                        o.getProbability(),
                        o.getCloseDate() != null ? o.getCloseDate().toString() : ""
                ))
                .collect(Collectors.toList());

        // Overdue & Due Today followups
        Instant now = Instant.now();
        ZonedDateTime utcNow = now.atZone(ZoneOffset.UTC);
        Instant todayStart = utcNow.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant todayEnd = utcNow.toLocalDate().plusDays(1).atStartOfDay(ZoneOffset.UTC).minusNanos(1000).toInstant();

        List<FollowUp> scheduledFollowUps = followUpRepository.findAll().stream()
                .filter(f -> "Scheduled".equalsIgnoreCase(f.getStatus()))
                .filter(f -> ownerId == null || ownerId.isBlank() || (f.getOwner() != null && ownerId.equals(f.getOwner().getId())))
                .collect(Collectors.toList());

        long overdueCount = scheduledFollowUps.stream()
                .filter(f -> f.getDueAt() != null && f.getDueAt().isBefore(now))
                .count();

        long dueTodayCount = scheduledFollowUps.stream()
                .filter(f -> f.getDueAt() != null && !f.getDueAt().isBefore(todayStart) && !f.getDueAt().isAfter(todayEnd))
                .count();

        KpisDto kpis = new KpisDto(
                totalLeads,
                qualifiedLeads,
                openOpportunities,
                quotationValue,
                wonValue,
                conversionRate
        );

        return new DashboardMetricsDto(
                kpis,
                topOpportunities,
                overdueCount,
                dueTodayCount
        );
    }

    public List<FunnelStageDto> getFunnel(String ownerId) {
        List<FunnelStageDto> funnel = new ArrayList<>();

        List<Lead> leads = leadRepository.findAll().stream()
                .filter(l -> l.getDeletedAt() == null)
                .filter(l -> ownerId == null || ownerId.isBlank() || (l.getOwner() != null && ownerId.equals(l.getOwner().getId())))
                .collect(Collectors.toList());

        for (String stageName : Arrays.asList("New", "Contacted", "Qualified")) {
            List<Lead> matched = leads.stream()
                    .filter(l -> stageName.equalsIgnoreCase(l.getStatus()))
                    .collect(Collectors.toList());
            long count = matched.size();
            BigDecimal value = matched.stream().map(Lead::getEstimatedValue).reduce(BigDecimal.ZERO, BigDecimal::add);
            funnel.add(new FunnelStageDto(stageName, count, value));
        }

        List<Opportunity> opps = opportunityRepository.findAll().stream()
                .filter(o -> ownerId == null || ownerId.isBlank() || (o.getOwner() != null && ownerId.equals(o.getOwner().getId())))
                .collect(Collectors.toList());

        List<Opportunity> openOpps = opps.stream().filter(o -> "Open".equalsIgnoreCase(o.getStatus())).collect(Collectors.toList());
        funnel.add(new FunnelStageDto("Opportunity", openOpps.size(), openOpps.stream().map(Opportunity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)));

        List<Quotation> quotes = quotationRepository.findAll().stream()
                .filter(q -> Arrays.asList("Pending Approval", "Approved").contains(q.getStatus()))
                .collect(Collectors.toList());
        funnel.add(new FunnelStageDto("Quotation", quotes.size(), quotes.stream().map(Quotation::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add)));

        List<Opportunity> wonOpps = opps.stream().filter(o -> "Closed Won".equalsIgnoreCase(o.getStatus())).collect(Collectors.toList());
        funnel.add(new FunnelStageDto("Won", wonOpps.size(), wonOpps.stream().map(Opportunity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)));

        return funnel;
    }

    public List<OverdueFollowUpDto> getOverdueFollowUps() {
        Instant now = Instant.now();
        List<FollowUp> scheduled = followUpRepository.findAll().stream()
                .filter(f -> "Scheduled".equalsIgnoreCase(f.getStatus()))
                .filter(f -> f.getDueAt() != null && f.getDueAt().isBefore(now))
                .sorted((a, b) -> a.getDueAt().compareTo(b.getDueAt()))
                .collect(Collectors.toList());

        List<OverdueFollowUpDto> items = new ArrayList<>();
        for (FollowUp f : scheduled) {
            String linkedName = "Follow-up";
            String linkedType = "Lead";
            String linkedId = f.getId();

            if (f.getLead() != null) {
                linkedType = "Lead";
                linkedId = f.getLead().getId();
                linkedName = f.getLead().getCustomer() != null ? f.getLead().getCustomer().getCompany() : "Lead";
            } else if (f.getOpportunity() != null) {
                linkedType = "Opportunity";
                linkedId = f.getOpportunity().getId();
                linkedName = f.getOpportunity().getTitle();
            }

            String ownerName = f.getOwner() != null ? f.getOwner().getName() : "Unassigned";

            items.add(new OverdueFollowUpDto(
                    f.getId(),
                    f.getType(),
                    linkedName,
                    linkedType,
                    linkedId,
                    f.getDueAt(),
                    ownerName,
                    true
            ));
        }

        return items;
    }
}
