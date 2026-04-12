package com.migrationplayground.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class AnalysisReport {
    private UUID migrationRunId;
    private int highSeverityCount;
    private int mediumSeverityCount;
    private int lowSeverityCount;
    private List<AnalysisIssue> issues;
}
