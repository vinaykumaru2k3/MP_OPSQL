package com.migrationplayground.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "validation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationResult {

    @Id
    @Column(name = "migration_run_id")
    private UUID migrationRunId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "migration_run_id")
    private MigrationRun migrationRun;

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
