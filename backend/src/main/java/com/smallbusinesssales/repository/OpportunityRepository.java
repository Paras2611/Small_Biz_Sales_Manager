package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, String> {
    List<Opportunity> findAllByOrderByCreatedAtDesc();
    Optional<Opportunity> findByLeadId(String leadId);
    List<Opportunity> findByStatus(String status);
    List<Opportunity> findByOwnerId(String ownerId);
    List<Opportunity> findByStage(String stage);
    long countByStatus(String status);
    long countByOwnerIdAndStatus(String ownerId, String status);

    List<Opportunity> findTop5ByStatusOrderByAmountDesc(String status);

    @Query("SELECT o FROM Opportunity o WHERE o.status = :status AND (:ownerId IS NULL OR o.owner.id = :ownerId) ORDER BY o.amount DESC LIMIT 5")
    List<Opportunity> findTop5OpenByOwner(@Param("status") String status, @Param("ownerId") String ownerId);

    @Query("SELECT o FROM Opportunity o JOIN o.customer c WHERE " +
           "(:stage IS NULL OR o.stage = :stage) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:ownerId IS NULL OR o.owner.id = :ownerId) AND " +
           "(:search IS NULL OR LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.company) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY o.createdAt DESC")
    List<Opportunity> searchOpportunities(@Param("stage") String stage, @Param("status") String status, @Param("ownerId") String ownerId, @Param("search") String search);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE o.status = :status AND (:ownerId IS NULL OR o.owner.id = :ownerId)")
    BigDecimal sumAmountByStatusAndOwner(@Param("status") String status, @Param("ownerId") String ownerId);

    @Query("SELECT o.stage, COUNT(o), COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE o.status = 'Open' GROUP BY o.stage")
    List<Object[]> getPipelineByStage();
}
