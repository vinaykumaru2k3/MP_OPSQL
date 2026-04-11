package com.migrationplayground.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "migration_runs")
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
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTableCount() { return tableCount; }
    public void setTableCount(Integer tableCount) { this.tableCount = tableCount; }
    public Integer getColumnCount() { return columnCount; }
    public void setColumnCount(Integer columnCount) { this.columnCount = columnCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
