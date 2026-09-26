package com.smallbusinesssales.repository;

import com.smallbusinesssales.entity.QuotationLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationLineRepository extends JpaRepository<QuotationLine, String> {
    List<QuotationLine> findByQuotationId(String quotationId);
}
