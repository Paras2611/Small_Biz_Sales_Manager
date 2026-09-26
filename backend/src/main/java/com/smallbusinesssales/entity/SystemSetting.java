package com.smallbusinesssales.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 80)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT", nullable = false)
    private String value;

    @Column(length = 255)
    private String description;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SystemSetting() {
        this.id = UUID.randomUUID().toString();
    }

    public SystemSetting(String key, String value, String description) {
        this.id = UUID.randomUUID().toString();
        this.key = key;
        this.value = value;
        this.description = description;
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
