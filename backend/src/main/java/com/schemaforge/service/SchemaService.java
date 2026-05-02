package com.schemaforge.service;

import com.schemaforge.model.MigrationRun;
import com.schemaforge.model.ParsedSchema;
import com.schemaforge.parser.SqlParser;
import com.schemaforge.repository.AnalysisReportRepository;
import com.schemaforge.repository.ConvertedScriptRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.schemaforge.analyzer.CompatibilityAnalyzer;
import com.schemaforge.analyzer.SqlConverter;
import com.schemaforge.dto.AnalysisReportDto;
import com.schemaforge.dto.ConvertedScriptDto;
import com.schemaforge.dto.FullReportDto;
import com.schemaforge.dto.ValidationResultDto;
import com.schemaforge.model.AnalysisReport;
import com.schemaforge.model.ConvertedScript;

@Service
public class SchemaService {
    private static final Logger log = LoggerFactory.getLogger(SchemaService.class);

    private final MigrationRunService migrationRunService;
    private final ReportService reportService;
    private final AnalysisReportRepository analysisReportRepository;
    private final ConvertedScriptRepository convertedScriptRepository;
    private final SqlParser sqlParser;
    private final CompatibilityAnalyzer compatibilityAnalyzer;
    private final SqlConverter sqlConverter;
    private final ValidationService validationService;

    public SchemaService(MigrationRunService migrationRunService,
                        ReportService reportService,
                        AnalysisReportRepository analysisReportRepository,
                        ConvertedScriptRepository convertedScriptRepository,
                        SqlParser sqlParser, 
                        CompatibilityAnalyzer compatibilityAnalyzer, 
                        SqlConverter sqlConverter,
                        ValidationService validationService) {
        this.migrationRunService = migrationRunService;
        this.reportService = reportService;
        this.analysisReportRepository = analysisReportRepository;
        this.convertedScriptRepository = convertedScriptRepository;
        this.sqlParser = sqlParser;
        this.compatibilityAnalyzer = compatibilityAnalyzer;
        this.sqlConverter = sqlConverter;
        this.validationService = validationService;
    }

    public MigrationRun uploadAndParse(MultipartFile file, String fileNameOverride) {
        return migrationRunService.uploadAndParse(file, fileNameOverride);
    }

    public AnalysisReportDto analyze(UUID runId) {
        if (analysisReportRepository.existsById(runId)) {
            return getAnalysis(runId);
        }
        MigrationRun run = migrationRunService.getMigrationRun(runId);

        String rawSql = run.getRawSql();
        ParsedSchema schema = sqlParser.parse(rawSql);

        AnalysisReport report = compatibilityAnalyzer.analyze(schema, rawSql);
        report.setMigrationRunId(runId);

        try {
            report = analysisReportRepository.save(report);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn("Concurrent save detected for analysis {}, returning existing.", runId);
            return getAnalysis(runId);
        }

        AnalysisReportDto dto = AnalysisReportDto.builder()
                .migrationRunId(report.getMigrationRunId())
                .highSeverityCount(report.getHighSeverityCount())
                .mediumSeverityCount(report.getMediumSeverityCount())
                .lowSeverityCount(report.getLowSeverityCount())
                .issues(report.getIssues())
                .build();

        log.info("Analysis completed and persisted for run ID: {}. High: {}, Medium: {}, Low: {}", 
                runId, dto.getHighSeverityCount(), dto.getMediumSeverityCount(), dto.getLowSeverityCount());
        
        return dto;
    }

    public AnalysisReportDto getAnalysis(UUID runId) {
        AnalysisReport report = analysisReportRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis report not found for ID: " + runId));

        return AnalysisReportDto.builder()
                .migrationRunId(report.getMigrationRunId())
                .highSeverityCount(report.getHighSeverityCount())
                .mediumSeverityCount(report.getMediumSeverityCount())
                .lowSeverityCount(report.getLowSeverityCount())
                .issues(report.getIssues())
                .build();
    }

    public ConvertedScriptDto convert(UUID runId) {
        if (convertedScriptRepository.existsById(runId)) {
            return getConvertedScript(runId);
        }
        MigrationRun run = migrationRunService.getMigrationRun(runId);

        String rawSql = run.getRawSql();

        // LIVE_DB runs: re-parse the synthesised DDL through the structured schema-aware
        // converter so the output is properly ordered (Sequences → Tables → Indexes → Views).
        // FILE runs: use the classic string-based converter.
        String convertedSql;
        if ("LIVE_DB".equals(run.getSourceType())) {
            com.schemaforge.model.ParsedSchema schema = sqlParser.parse(rawSql);
            convertedSql = sqlConverter.convertFromSchema(schema);
        } else {
            convertedSql = sqlConverter.convert(rawSql);
        }

        ConvertedScript script = ConvertedScript.builder()
                .migrationRunId(runId)
                .originalSql(rawSql)
                .convertedSql(convertedSql)
                .build();

        try {
            convertedScriptRepository.save(script);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn("Concurrent save detected for conversion {}, returning existing.", runId);
            return getConvertedScript(runId);
        }

        log.info("Conversion completed and persisted for run ID: {} (sourceType={})", runId, run.getSourceType());

        return ConvertedScriptDto.builder()
                .migrationRunId(runId)
                .originalSql(rawSql)
                .convertedSql(convertedSql)
                .build();
    }

    public ConvertedScriptDto getConvertedScript(UUID runId) {
        ConvertedScript script = convertedScriptRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Converted script not found for ID: " + runId));

        return ConvertedScriptDto.builder()
                .migrationRunId(script.getMigrationRunId())
                .originalSql(script.getOriginalSql())
                .convertedSql(script.getConvertedSql())
                .build();
    }

    public FullReportDto getFullReport(UUID id) {
        MigrationRun run = migrationRunService.getMigrationRun(id);

        AnalysisReportDto analysis = null;
        try {
            analysis = getAnalysis(id);
        } catch (Exception e) {
            log.debug("No analysis report found for {}", id);
        }

        ConvertedScriptDto convertedScript = null;
        try {
            convertedScript = getConvertedScript(id);
        } catch (Exception e) {
            log.debug("No converted script found for {}", id);
        }

        ValidationResultDto validationResult = null;
        try {
            validationResult = validationService.getValidationResult(id);
        } catch (Exception e) {
            log.debug("No validation result found for {}", id);
        }

        return FullReportDto.builder()
                .migrationRun(run)
                .analysisReport(analysis)
                .convertedScript(convertedScript)
                .validationResult(validationResult)
                .build();
    }

    public byte[] generatePdfReport(UUID id) {
        FullReportDto report = getFullReport(id);
        return reportService.generatePdfReport(report);
    }

    public java.util.List<MigrationRun> getHistory(String fileName) {
        return migrationRunService.getHistory(fileName);
    }
}

