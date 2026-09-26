package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, String> {
    List<Lead> findByDeletedAtIsNullOrderByCreatedAtDesc();
    Optional<Lead> findByIdAndDeletedAtIsNull(String id);
    List<Lead> findByStatusAndDeletedAtIsNull(String status);
    List<Lead> findByOwnerIdAndDeletedAtIsNull(String ownerId);
    long countByDeletedAtIsNull();
    long countByStatusAndDeletedAtIsNull(String status);
    long countByOwnerIdAndDeletedAtIsNull(String ownerId);
    long countByOwnerIdAndStatusAndDeletedAtIsNull(String ownerId, String status);

    @Query("SELECT l FROM Lead l JOIN l.customer c WHERE l.deletedAt IS NULL AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:ownerId IS NULL OR l.owner.id = :ownerId) AND " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.company) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.source) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY l.createdAt DESC")
    List<Lead> searchLeads(@Param("search") String search, @Param("status") String status, @Param("ownerId") String ownerId);

    @Query("SELECT COALESCE(SUM(l.estimatedValue), 0) FROM Lead l WHERE l.deletedAt IS NULL AND l.status = :status AND (:ownerId IS NULL OR l.owner.id = :ownerId)")
    BigDecimal sumEstimatedValueByStatusAndOwner(@Param("status") String status, @Param("ownerId") String ownerId);
}
