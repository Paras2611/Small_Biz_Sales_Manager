package com.smallbusinesssales.ai;

import com.smallbusinesssales.dto.AiDtos.*;
import com.smallbusinesssales.entity.Lead;
import com.smallbusinesssales.entity.Opportunity;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.LeadRepository;
import com.smallbusinesssales.repository.OpportunityRepository;
import com.smallbusinesssales.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiSalesAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiSalesAssistantService.class);

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${ai.model:gemini-1.5-flash}")
    private String aiModel;

    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final AuditLogService auditLogService;

    public AiSalesAssistantService(
            LeadRepository leadRepository,
            OpportunityRepository opportunityRepository,
            AuditLogService auditLogService
    ) {
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.auditLogService = auditLogService;
    }

    public LeadPriorityResponse assessLeadPriority(LeadPriorityRequest payload, User currentUser) {
        Lead lead = leadRepository.findById(payload.lead_id())
                .filter(l -> l.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + payload.lead_id()));

        double val = lead.getEstimatedValue() != null ? lead.getEstimatedValue().doubleValue() : 0.0;
        int score = lead.getScore();
        String source = lead.getSource() != null ? lead.getSource() : "Inbound";

        String priority;
        List<String> evidence = new ArrayList<>();
        String nextAction;

        if (val >= 100000 || score >= 75) {
            priority = "High";
            evidence.add(String.format("Significant commercial value of ₹%,.2f", val));
            evidence.add(String.format("High qualification score of %d/100", score));
            evidence.add("Qualified source channel: " + source);
            nextAction = "Schedule executive solution demo and proposal presentation.";
        } else if (val >= 40000 || score >= 50) {
            priority = "Medium";
            evidence.add(String.format("Moderate budget allocation of ₹%,.2f", val));
            evidence.add(String.format("Moderate engagement score of %d/100", score));
            evidence.add("Originating channel: " + source);
            nextAction = "Conduct technical scoping call to clarify feature requirements.";
        } else {
            priority = "Low";
            evidence.add(String.format("Entry-level estimated deal size of ₹%,.2f", val));
            evidence.add(String.format("Initial interest stage with score %d/100", score));
            evidence.add("Inbound inquiry via " + source);
            nextAction = "Send product catalog overview and follow up in 5 business days.";
        }

        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "AI_LEAD_PRIORITY", "Lead", lead.getId(), "Assessed priority: " + priority, null);
        return new LeadPriorityResponse(priority, evidence, nextAction, false);
    }

    public SummaryResponse generateSummary(SummaryRequest payload, User currentUser) {
        String stage = "not available";
        String val = "₹0.00";
        String latestInteraction = "not available";
        String blocker = "No blocker documented";
        String nextAction = "Follow-up scheduling pending";

        if (payload.opportunity_id() != null && !payload.opportunity_id().isBlank()) {
            Opportunity opp = opportunityRepository.findById(payload.opportunity_id())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + payload.opportunity_id()));
            stage = opp.getStage();
            val = String.format("₹%,.2f", opp.getAmount() != null ? opp.getAmount().doubleValue() : 0.0);
            latestInteraction = "Open".equalsIgnoreCase(opp.getStatus()) ? "Quotation submitted" : "Deal closed";
            blocker = opp.getLostReason() != null ? opp.getLostReason() : "No blocker documented";
            nextAction = "Review contract with client";
        } else if (payload.lead_id() != null && !payload.lead_id().isBlank()) {
            Lead lead = leadRepository.findById(payload.lead_id())
                    .filter(l -> l.getDeletedAt() == null)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + payload.lead_id()));
            stage = lead.getStatus();
            val = String.format("₹%,.2f", lead.getEstimatedValue() != null ? lead.getEstimatedValue().doubleValue() : 0.0);
            latestInteraction = "Initial lead discovery";
            nextAction = "Complete qualification review";
        } else {
            throw new BadRequestException("Must provide lead_id or opportunity_id");
        }

        List<String> points = new ArrayList<>();
        points.add("1. Current Pipeline Stage: " + stage);
        points.add("2. Commercial Value: " + val);
        points.add("3. Most Recent Interaction: " + latestInteraction);
        points.add("4. Documented Blocker: " + blocker);
        points.add("5. Next Scheduled Action: " + nextAction);

        String summary = String.join("\n", points);
        return new SummaryResponse(summary, points, false);
    }

    public NextActionResponse getNextAction(NextActionRequest payload, User currentUser) {
        String stage = "Prospecting";
        String customerName = "Valued Client";

        if (payload.opportunity_id() != null && !payload.opportunity_id().isBlank()) {
            Opportunity opp = opportunityRepository.findById(payload.opportunity_id()).orElse(null);
            if (opp != null) {
                stage = opp.getStage();
                if (opp.getCustomer() != null && opp.getCustomer().getName() != null) {
                    customerName = opp.getCustomer().getName();
                }
            }
        } else if (payload.lead_id() != null && !payload.lead_id().isBlank()) {
            Lead lead = leadRepository.findById(payload.lead_id()).orElse(null);
            if (lead != null && lead.getCustomer() != null && lead.getCustomer().getName() != null) {
                customerName = lead.getCustomer().getName();
            }
        }

        String rec;
        String rationale;
        String msg;

        if ("Proposal".equalsIgnoreCase(stage) || "Negotiation".equalsIgnoreCase(stage)) {
            rec = "Send quotation follow-up and schedule executive closing call.";
            rationale = "Deal is in commercial discussion; rapid response prevents decision stalling.";
            msg = String.format("Hi %s, following up on our proposal. Do you have any questions regarding the pricing or deployment timeline? We'd be glad to arrange a quick walkthrough.", customerName);
        } else {
            rec = "Confirm technical fit and business decision timeline.";
            rationale = "Establishing clear budget and timeline criteria accelerates qualification.";
            msg = String.format("Hi %s, thank you for your continued interest. Could we connect briefly this week to review your target implementation timeline?", customerName);
        }

        return new NextActionResponse(rec, rationale, msg, false);
    }
}
