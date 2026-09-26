package com.smallbusinesssales.config;

import com.smallbusinesssales.entity.*;
import com.smallbusinesssales.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final FollowUpRepository followUpRepository;
    private final QuotationRepository quotationRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            LeadRepository leadRepository,
            OpportunityRepository opportunityRepository,
            FollowUpRepository followUpRepository,
            QuotationRepository quotationRepository,
            SystemSettingRepository systemSettingRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.followUpRepository = followUpRepository;
        this.quotationRepository = quotationRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Always guarantee updated demo accounts exist with active credentials
        User exec = ensureDemoUser("Arjun Shah", "arjun.shah@salescrm.demo", "Exec@2026", "sales_executive", "arjun.shah@thinqloud.demo");
        User manager = ensureDemoUser("Priya Mehta", "priya.mehta@salescrm.demo", "Manager@2026", "sales_manager", "priya.mehta@thinqloud.demo");
        User admin = ensureDemoUser("Admin User", "admin@salescrm.demo", "Admin@2026", "administrator", "admin@thinqloud.demo");

        if (customerRepository.count() > 0) {
            log.info("Database customers already exist. Skipping complete dataset re-seed.");
            return;
        }

        log.info("Seeding initial CRM demo data...");

        // 2. Customers
        Customer c1 = new Customer("Rajesh Kumar", "ABC Manufacturing", "contact@abcmfg.demo", "9876543210", "Plot 42, Industrial Area, Pune");
        Customer c2 = new Customer("Ananya Sharma", "Sunrise Retail", "purchase@sunriseretail.demo", "9876543211", "MG Road, Bengaluru");
        Customer c3 = new Customer("Vikram Patel", "GreenLeaf Foods", "procurement@greenleaf.demo", "9876543212", "Sector 18, Gurugram");
        Customer c4 = new Customer("Sneha Reddy", "TechBridge Solutions", "info@techbridge.demo", "9876543213", "HITEC City, Hyderabad");

        customerRepository.saveAll(List.of(c1, c2, c3, c4));

        // 3. Products
        Product p1 = new Product("PROD-CRM-01", "CRM Starter", "Core Software", new BigDecimal("25000.00"), new BigDecimal("18.00"));
        Product p2 = new Product("PROD-WFL-02", "Workflow Automation", "Add-on Module", new BigDecimal("40000.00"), new BigDecimal("18.00"));
        Product p3 = new Product("PROD-ANL-03", "Analytics Pack", "Analytics", new BigDecimal("30000.00"), new BigDecimal("18.00"));
        Product p4 = new Product("PROD-INT-04", "Integration Add-on", "Integration", new BigDecimal("15000.00"), new BigDecimal("18.00"));

        productRepository.saveAll(List.of(p1, p2, p3, p4));

        // 4. System Settings
        SystemSetting s1 = new SystemSetting("pipeline_stages", "[\"Prospecting\",\"Qualification\",\"Proposal\",\"Negotiation\",\"Closing\"]", "Pipeline stages");
        SystemSetting s2 = new SystemSetting("lead_sources", "[\"Website\",\"Referral\",\"Trade Show\",\"Social Media\",\"Outbound Campaign\"]", "Lead sources");
        SystemSetting s3 = new SystemSetting("tax_rules", "[{\"class\":\"Standard GST\",\"rate\":18.0},{\"class\":\"Reduced GST\",\"rate\":12.0}]", "Tax rules");
        systemSettingRepository.saveAll(List.of(s1, s2, s3));

        // 5. Leads
        Lead l1 = new Lead();
        l1.setCustomer(c1);
        l1.setOwner(exec);
        l1.setSource("Website");
        l1.setStatus("New");
        l1.setScore(45);
        l1.setEstimatedValue(new BigDecimal("500000.00"));

        Lead l2 = new Lead();
        l2.setCustomer(c2);
        l2.setOwner(exec);
        l2.setSource("Referral");
        l2.setStatus("Contacted");
        l2.setScore(60);
        l2.setEstimatedValue(new BigDecimal("150000.00"));

        Lead l3 = new Lead();
        l3.setCustomer(c3);
        l3.setOwner(exec);
        l3.setSource("Trade Show");
        l3.setStatus("Qualified");
        l3.setScore(85);
        l3.setEstimatedValue(new BigDecimal("250000.00"));
        l3.setQualificationNotes("Budget confirmed and decision maker identified.");

        Lead l4 = new Lead();
        l4.setCustomer(c4);
        l4.setOwner(exec);
        l4.setSource("Website");
        l4.setStatus("Disqualified");
        l4.setScore(20);
        l4.setEstimatedValue(new BigDecimal("50000.00"));

        leadRepository.saveAll(List.of(l1, l2, l3, l4));

        // 6. Opportunities
        Opportunity opp1 = new Opportunity();
        opp1.setCustomer(c1);
        opp1.setLead(l1);
        opp1.setOwner(exec);
        opp1.setTitle("ABC CRM Implementation");
        opp1.setStage("Proposal");
        opp1.setAmount(new BigDecimal("120000.00"));
        opp1.setProbability(60);
        opp1.setCloseDate(LocalDate.now().plusDays(15));
        opp1.setStatus("Open");

        Opportunity opp2 = new Opportunity();
        opp2.setCustomer(c2);
        opp2.setLead(l2);
        opp2.setOwner(exec);
        opp2.setTitle("Sunrise Workflow Upgrade");
        opp2.setStage("Negotiation");
        opp2.setAmount(new BigDecimal("80000.00"));
        opp2.setProbability(75);
        opp2.setCloseDate(LocalDate.now().plusDays(10));
        opp2.setStatus("Open");

        opportunityRepository.saveAll(List.of(opp1, opp2));

        // 7. Follow-ups
        FollowUp f1 = new FollowUp();
        f1.setLead(l1);
        f1.setOwner(exec);
        f1.setType("Call");
        f1.setDueAt(Instant.now().minus(2, ChronoUnit.DAYS)); // Overdue
        f1.setNotes("Introductory scoping call with engineering team");
        f1.setStatus("Scheduled");

        FollowUp f2 = new FollowUp();
        f2.setOpportunity(opp1);
        f2.setOwner(exec);
        f2.setType("Meeting");
        f2.setDueAt(Instant.now().plus(4, ChronoUnit.HOURS)); // Due today
        f2.setNotes("Review revised line items with CFO");
        f2.setStatus("Scheduled");

        FollowUp f3 = new FollowUp();
        f3.setOpportunity(opp2);
        f3.setOwner(exec);
        f3.setType("Demo");
        f3.setDueAt(Instant.now().plus(3, ChronoUnit.DAYS)); // Upcoming
        f3.setNotes("Product walk-through for store managers");
        f3.setStatus("Scheduled");

        followUpRepository.saveAll(List.of(f1, f2, f3));

        // 8. Quotations
        Quotation q1 = new Quotation();
        q1.setOpportunity(opp1);
        q1.setNumber("QT-2026-001");
        q1.setStatus("Pending Approval");
        q1.setDiscountPct(new BigDecimal("10.00"));

        QuotationLine ql1 = new QuotationLine(p1, "CRM Starter core platform", 2, p1.getUnitPrice(), p1.getTaxRate(), new BigDecimal("59000.00"));
        ql1.setQuotation(q1);
        QuotationLine ql2 = new QuotationLine(p2, "Workflow Automation add-on", 1, p2.getUnitPrice(), p2.getTaxRate(), new BigDecimal("47200.00"));
        ql2.setQuotation(q1);

        q1.setLines(new ArrayList<>(List.of(ql1, ql2)));
        q1.setSubtotal(new BigDecimal("90000.00"));
        q1.setDiscountAmount(new BigDecimal("9000.00"));
        q1.setTaxAmount(new BigDecimal("14580.00"));
        q1.setGrandTotal(new BigDecimal("95580.00"));

        quotationRepository.save(q1);

        log.info("Demo data seeding completed successfully.");
    }

    private User ensureDemoUser(String name, String email, String password, String role, String oldEmail) {
        // If user already exists by updated email, ensure password and role are active
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            u.setPasswordHash(passwordEncoder.encode(password));
            u.setActive(true);
            return userRepository.save(u);
        }

        // If user exists with old email, migrate them to updated email
        if (oldEmail != null) {
            Optional<User> oldUser = userRepository.findByEmail(oldEmail);
            if (oldUser.isPresent()) {
                User u = oldUser.get();
                u.setEmail(email);
                u.setName(name);
                u.setPasswordHash(passwordEncoder.encode(password));
                u.setActive(true);
                log.info("Migrated existing demo account {} -> {}", oldEmail, email);
                return userRepository.save(u);
            }
        }

        // Otherwise create brand new user
        User newUser = new User(name, email, passwordEncoder.encode(password), role);
        newUser.setActive(true);
        User saved = userRepository.save(newUser);
        log.info("Created demo account: {}", email);
        return saved;
    }
}
