package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    List<Product> findByDeletedAtIsNullOrderByNameAsc();
    List<Product> findByActiveTrueAndDeletedAtIsNullOrderByNameAsc();

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND " +
           "(:activeOnly = false OR p.active = true) AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.name ASC")
    List<Product> searchProducts(@Param("category") String category, @Param("search") String search, @Param("activeOnly") boolean activeOnly);
}
