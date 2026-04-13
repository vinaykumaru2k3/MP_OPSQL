package com.migrationplayground.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "migration_runs")
@lombok.Getter
@lombok.Setter
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
@lombok.Builder
public class MigrationRun {
    
    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    private UUID id;
    
    @jakarta.persistence.Column(name = "file_name", nullable = false)
    private String fileName;
    
    @jakarta.persistence.Column(nullable = false)
    private String status;
    
    @jakarta.persistence.Column(name = "table_count")
    private Integer tableCount;
    
    @jakarta.persistence.Column(name = "column_count")
    private Integer columnCount;
    
    @jakarta.persistence.Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @jakarta.persistence.Column(name = "raw_sql", columnDefinition = "TEXT")
    private String rawSql;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}
