package com.migrationplayground.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationResultDto {
    private UUID migrationRunId;
    private String validationStatus;
    private Integer tablesValidatedCount;
    private Integer tablesMatchedCount;
    private Instant validatedAt;
    private List<TableValidationMetricDto> metrics;
}
