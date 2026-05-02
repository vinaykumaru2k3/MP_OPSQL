package com.schemaforge.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableValidationMetricDto {
    private String tableName;
    private Long sourceRowCount;
    private Long targetRowCount;
    private Boolean rowCountMatch;
    private Boolean dataTypeMatch;
    private Boolean nullCountMatch;
}
