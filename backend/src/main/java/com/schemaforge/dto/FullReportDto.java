package com.schemaforge.dto;

import com.schemaforge.model.MigrationRun;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FullReportDto {
    private MigrationRun migrationRun;
    private AnalysisReportDto analysisReport;
    private ConvertedScriptDto convertedScript;
    private ValidationResultDto validationResult;
}
