package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, String> {
    List<FollowUp> findAllByOrderByDueAtAsc();
    List<FollowUp> findByLeadIdOrderByDueAtAsc(String leadId);
    List<FollowUp> findByOpportunityIdOrderByDueAtAsc(String opportunityId);
    List<FollowUp> findByStatus(String status);
    List<FollowUp> findByOwnerId(String ownerId);

    @Query("SELECT f FROM FollowUp f WHERE " +
           "(:leadId IS NULL OR f.lead.id = :leadId) AND " +
           "(:opportunityId IS NULL OR f.opportunity.id = :opportunityId) AND " +
           "(:ownerId IS NULL OR f.owner.id = :ownerId) AND " +
           "(:status IS NULL OR f.status = :status) " +
           "ORDER BY f.dueAt ASC")
    List<FollowUp> filterFollowups(@Param("leadId") String leadId, @Param("opportunityId") String opportunityId, @Param("ownerId") String ownerId, @Param("status") String status);
}
