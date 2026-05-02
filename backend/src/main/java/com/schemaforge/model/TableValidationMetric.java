package com.schemaforge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@jakarta.persistence.Table(name = "table_validation_metrics")
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
