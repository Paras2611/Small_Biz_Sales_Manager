package com.smallbusinesssales.controller;

import com.smallbusinesssales.dto.ProductDtos.*;
import com.smallbusinesssales.entity.User;
import com.smallbusinesssales.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/products", "/api/products"})
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> listProducts(
            @RequestParam(name = "include_inactive", required = false) Boolean includeInactive,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(productService.listProducts(includeInactive, search));
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody ProductCreateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        ProductDto created = productService.createProduct(payload, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable String id,
            @RequestBody ProductUpdateRequest payload,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, payload, currentUser));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ProductDto> deactivateProduct(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(productService.deactivateProduct(id, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        productService.deleteProduct(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }
}
