package com.smallbusinesssales.service;

import com.smallbusinesssales.dto.ProductDtos.*;
import com.smallbusinesssales.entity.Product;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.exception.BadRequestException;
import com.smallbusinesssales.exception.ResourceNotFoundException;
import com.smallbusinesssales.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;

    public ProductService(ProductRepository productRepository, AuditLogService auditLogService) {
        this.productRepository = productRepository;
        this.auditLogService = auditLogService;
    }

    public List<ProductDto> listProducts(Boolean includeInactive, String search) {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> {
                    if (includeInactive != null && includeInactive) return true;
                    return p.isActive();
                })
                .filter(p -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    return (p.getName() != null && p.getName().toLowerCase().contains(s)) ||
                            (p.getSku() != null && p.getSku().toLowerCase().contains(s)) ||
                            (p.getCategory() != null && p.getCategory().toLowerCase().contains(s));
                })
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto getProduct(String id) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductCreateRequest request, User currentUser) {
        if (productRepository.findBySku(request.sku().trim()).isPresent()) {
            throw new BadRequestException("Product with SKU '" + request.sku() + "' already exists");
        }

        Product product = new Product();
        product.setSku(request.sku().trim());
        product.setName(request.name().trim());
        product.setCategory(request.category() != null ? request.category().trim() : "Software");
        product.setUnitPrice(request.unit_price());
        product.setTaxRate(request.tax_rate() != null ? request.tax_rate() : new BigDecimal("18.00"));
        product.setActive(request.active() != null ? request.active() : true);

        Product saved = productRepository.save(product);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "CREATE", "Product", saved.getId(), "Created product " + saved.getName(), null);
        return mapToDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(String id, ProductUpdateRequest request, User currentUser) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (request.sku() != null && !request.sku().isBlank()) {
            product.setSku(request.sku().trim());
        }
        if (request.name() != null && !request.name().isBlank()) {
            product.setName(request.name().trim());
        }
        if (request.category() != null) product.setCategory(request.category().trim());
        if (request.unit_price() != null) product.setUnitPrice(request.unit_price());
        if (request.tax_rate() != null) product.setTaxRate(request.tax_rate());
        if (request.active() != null) product.setActive(request.active());

        Product saved = productRepository.save(product);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "UPDATE", "Product", saved.getId(), "Updated product " + saved.getName(), null);
        return mapToDto(saved);
    }

    @Transactional
    public ProductDto deactivateProduct(String id, User currentUser) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setActive(false);
        Product saved = productRepository.save(product);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "DEACTIVATE", "Product", saved.getId(), "Deactivated product " + saved.getName(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteProduct(String id, User currentUser) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setDeletedAt(Instant.now());
        product.setActive(false);
        productRepository.save(product);
        auditLogService.logEvent(currentUser != null ? currentUser.getId() : null, "DELETE", "Product", id, "Soft deleted product " + product.getName(), null);
    }

    public ProductDto mapToDto(Product p) {
        return new ProductDto(
                p.getId(),
                p.getSku(),
                p.getName(),
                p.getCategory(),
                p.getUnitPrice(),
                p.getTaxRate(),
                p.isActive(),
                p.getCreatedAt()
        );
    }
}
