package com.migrationplayground.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AnalysisIssue {
    private String construct;
    private String severity; // HIGH, MEDIUM, LOW
    private String description;
}
