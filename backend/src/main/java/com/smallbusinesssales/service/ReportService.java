package com.smallbusinesssales.service;

import com.smallbusinesssales.entity.Lead;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.Quotation;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.repository.QuotationRepository;
import com.smallbusinesssales.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final OpportunityRepository opportunityRepository;
    private final LeadRepository leadRepository;
    private final QuotationRepository quotationRepository;
    private final UserRepository userRepository;

    public ReportService(
            OpportunityRepository opportunityRepository,
            LeadRepository leadRepository,
            QuotationRepository quotationRepository,
            UserRepository userRepository
    ) {
        this.opportunityRepository = opportunityRepository;
        this.leadRepository = leadRepository;
        this.quotationRepository = quotationRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getPipelineByStage() {
        List<Opportunity> openOpps = opportunityRepository.findAll().stream()
                .filter(o -> "Open".equalsIgnoreCase(o.getStatus()))
                .collect(Collectors.toList());

        Map<String, List<Opportunity>> grouped = openOpps.stream()
                .collect(Collectors.groupingBy(Opportunity::getStage));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Opportunity>> entry : grouped.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("stage", entry.getKey());
            item.put("count", (long) entry.getValue().size());
            BigDecimal totalVal = entry.getValue().stream().map(Opportunity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            item.put("value", totalVal.doubleValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getConversionFunnel() {
        long totalLeads = leadRepository.findAll().stream().filter(l -> l.getDeletedAt() == null).count();
        long qualifiedLeads = leadRepository.findAll().stream().filter(l -> l.getDeletedAt() == null && "Qualified".equalsIgnoreCase(l.getStatus())).count();
        long totalOpps = opportunityRepository.count();
        long totalQuotes = quotationRepository.count();
        long wonDeals = opportunityRepository.findAll().stream().filter(o -> "Closed Won".equalsIgnoreCase(o.getStatus())).count();

        List<Map<String, Object>> funnel = new ArrayList<>();
        funnel.add(Map.of("stage", "Leads", "count", totalLeads));
        funnel.add(Map.of("stage", "Qualified", "count", qualifiedLeads));
        funnel.add(Map.of("stage", "Opportunities", "count", totalOpps));
        funnel.add(Map.of("stage", "Quotations", "count", totalQuotes));
        funnel.add(Map.of("stage", "Won Deals", "count", wonDeals));
        return funnel;
    }

    public List<Map<String, Object>> getQuotationStatus() {
        List<Quotation> quotes = quotationRepository.findAll();
        Map<String, List<Quotation>> grouped = quotes.stream()
                .collect(Collectors.groupingBy(Quotation::getStatus));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Quotation>> entry : grouped.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("status", entry.getKey());
            item.put("count", (long) entry.getValue().size());
            BigDecimal totalVal = entry.getValue().stream().map(Quotation::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            item.put("total_value", totalVal.doubleValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getOwnerPerformance() {
        List<User> users = userRepository.findAll().stream()
                .filter(User::isActive)
                .collect(Collectors.toList());

        List<Map<String, Object>> performance = new ArrayList<>();
        for (User u : users) {
            long leadsOwned = leadRepository.findAll().stream()
                    .filter(l -> l.getDeletedAt() == null && l.getOwner() != null && u.getId().equals(l.getOwner().getId()))
                    .count();

            List<Opportunity> wonOpps = opportunityRepository.findAll().stream()
                    .filter(o -> "Closed Won".equalsIgnoreCase(o.getStatus()) && o.getOwner() != null && u.getId().equals(o.getOwner().getId()))
                    .collect(Collectors.toList());

            long dealsWon = wonOpps.size();
            BigDecimal wonRevenue = wonOpps.stream().map(Opportunity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> item = new HashMap<>();
            item.put("user_id", u.getId());
            item.put("name", u.getName());
            item.put("role", u.getRole());
            item.put("leads_owned", leadsOwned);
            item.put("deals_won", dealsWon);
            item.put("won_revenue", wonRevenue.doubleValue());
            performance.add(item);
        }
        return performance;
    }
}
