package com.migrationplayground.model;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class AnalysisIssue {
    private String construct;
    private String severity; // HIGH, MEDIUM, LOW
    private String description;
}
