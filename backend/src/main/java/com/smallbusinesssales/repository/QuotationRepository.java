package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, String> {
    Optional<Quotation> findByNumber(String number);
    List<Quotation> findAllByOrderByCreatedAtDesc();
    List<Quotation> findByOpportunityIdOrderByCreatedAtDesc(String opportunityId);
    List<Quotation> findByStatusOrderByCreatedAtDesc(String status);
    List<Quotation> findByOpportunityIdAndStatus(String opportunityId, String status);
    long countByNumberStartingWith(String prefix);

    @Query("SELECT COALESCE(SUM(q.grandTotal), 0) FROM Quotation q WHERE q.status IN ('Draft', 'Pending Approval', 'Approved')")
    BigDecimal sumOpenQuotationValues();

    @Query("SELECT q.status, COUNT(q), COALESCE(SUM(q.grandTotal), 0) FROM Quotation q GROUP BY q.status")
    List<Object[]> getQuotationStatusSummary();

    @Query("SELECT q FROM Quotation q WHERE " +
           "(:opportunityId IS NULL OR q.opportunity.id = :opportunityId) AND " +
           "(:status IS NULL OR q.status = :status) " +
           "ORDER BY q.createdAt DESC")
    List<Quotation> filterQuotations(@Param("opportunityId") String opportunityId, @Param("status") String status);
}
