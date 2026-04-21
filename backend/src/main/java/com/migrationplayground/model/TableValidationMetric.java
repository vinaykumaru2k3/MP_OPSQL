package com.migrationplayground.model;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.*;

@Entity
@Table(name = "table_validation_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableValidationMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "migration_run_id", nullable = false)
    private ValidationResult validationResult;

    @Column(name = "table_name", nullable = false)
    private String tableName;

    @Column(name = "source_row_count")
    private Long sourceRowCount;

    @Column(name = "target_row_count")
    private Long targetRowCount;

    @Column(name = "row_count_match")
    private Boolean rowCountMatch;

    @Column(name = "data_type_match")
    private Boolean dataTypeMatch;

    @Column(name = "null_count_match")
    private Boolean nullCountMatch;
}
