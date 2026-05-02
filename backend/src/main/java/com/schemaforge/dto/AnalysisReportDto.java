package com.schemaforge.dto;

import com.schemaforge.model.AnalysisIssue;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class AnalysisReportDto {
    private UUID migrationRunId;
    private int highSeverityCount;
    private int mediumSeverityCount;
    private int lowSeverityCount;
    private List<AnalysisIssue> issues;
}
