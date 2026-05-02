package com.schemaforge.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "analysis_reports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisReport {
    @jakarta.persistence.Id
    private UUID migrationRunId;

    @jakarta.persistence.Column(name = "high_severity_count")
    private int highSeverityCount;
    @jakarta.persistence.Column(name = "medium_severity_count")
    private int mediumSeverityCount;
    @jakarta.persistence.Column(name = "low_severity_count")
    private int lowSeverityCount;

    @ElementCollection
    @CollectionTable(name = "analysis_issues", joinColumns = @JoinColumn(name = "report_id"))
    private List<AnalysisIssue> issues;
}
