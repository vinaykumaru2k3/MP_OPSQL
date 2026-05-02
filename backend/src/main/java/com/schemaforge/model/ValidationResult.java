package com.schemaforge.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@jakarta.persistence.Table(name = "validation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationResult {

    @Id
    @Column(name = "migration_run_id")
    private UUID migrationRunId;

    @Column(name = "validation_status", nullable = false)
    private String validationStatus;

    @Column(name = "tables_validated_count", nullable = false)
    private Integer tablesValidatedCount;

    @Column(name = "tables_matched_count", nullable = false)
    private Integer tablesMatchedCount;

    @Column(name = "validated_at", nullable = false)
    private Instant validatedAt;

    @OneToMany(mappedBy = "validationResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableValidationMetric> metrics;
}
