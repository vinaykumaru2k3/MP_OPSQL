package com.migrationplayground.service;

import com.migrationplayground.model.MigrationRun;
import com.migrationplayground.model.ParsedSchema;
import com.migrationplayground.parser.SqlParser;
import com.migrationplayground.repository.AnalysisReportRepository;
import com.migrationplayground.repository.ConvertedScriptRepository;
import com.migrationplayground.repository.MigrationRunRepository;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import com.migrationplayground.analyzer.CompatibilityAnalyzer;
import com.migrationplayground.analyzer.SqlConverter;
import com.migrationplayground.dto.AnalysisReportDto;
import com.migrationplayground.dto.ConvertedScriptDto;
import com.migrationplayground.model.AnalysisReport;
import com.migrationplayground.model.ConvertedScript;
import com.migrationplayground.model.ParsedSchema;
import java.util.UUID;

@Service
public class SchemaService {
    private static final Logger log = LoggerFactory.getLogger(SchemaService.class);

    private final MigrationRunRepository migrationRunRepository;
    private final AnalysisReportRepository analysisReportRepository;
    private final ConvertedScriptRepository convertedScriptRepository;
    private final SqlParser sqlParser;
    private final CompatibilityAnalyzer compatibilityAnalyzer;
    private final SqlConverter sqlConverter;

    public SchemaService(MigrationRunRepository migrationRunRepository, 
                        AnalysisReportRepository analysisReportRepository,
                        ConvertedScriptRepository convertedScriptRepository,
                        SqlParser sqlParser, 
                        CompatibilityAnalyzer compatibilityAnalyzer, 
                        SqlConverter sqlConverter) {
        this.migrationRunRepository = migrationRunRepository;
        this.analysisReportRepository = analysisReportRepository;
        this.convertedScriptRepository = convertedScriptRepository;
        this.sqlParser = sqlParser;
        this.compatibilityAnalyzer = compatibilityAnalyzer;
        this.sqlConverter = sqlConverter;
    }


    public MigrationRun uploadAndParse(MultipartFile file, String fileNameOverride) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.toLowerCase().endsWith(".sql")) {
             throw new IllegalArgumentException("Uploaded file is not a valid SQL file.");
        }
        
        String fileName = (fileNameOverride != null && !fileNameOverride.isEmpty()) ? fileNameOverride : originalFilename;
        
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            
            // Parse schema
            ParsedSchema schema = sqlParser.parse(content);
            
            int tableCount = schema.getTables().size();
            int colCount = schema.getTables().stream()
                .mapToInt(t -> t.getColumns().size())
                .sum();
            
            MigrationRun run = MigrationRun.builder()
                .fileName(fileName)
                .status("PARSED")
                .tableCount(tableCount)
                .columnCount(colCount)
                .rawSql(content)
                .build();
                
            run = migrationRunRepository.save(run);
            
            log.info("Successfully parsed file {}. Created run ID: {}", fileName, run.getId());
            return run;
        } catch (IllegalArgumentException e) {
             throw e;
        } catch (Exception e) {
            log.error("Failed to parse SQL file", e);
            throw new IllegalArgumentException("Failed to parse SQL file: " + e.getMessage());
        }
    }

    public AnalysisReportDto analyze(UUID runId) {
        MigrationRun run = migrationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Migration run not found for ID: " + runId));

        String rawSql = run.getRawSql();
        ParsedSchema schema = sqlParser.parse(rawSql);

        AnalysisReport report = compatibilityAnalyzer.analyze(schema, rawSql);
        report.setMigrationRunId(runId);

        report = analysisReportRepository.save(report);

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
        MigrationRun run = migrationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Migration run not found for ID: " + runId));

        String rawSql = run.getRawSql();
        String convertedSql = sqlConverter.convert(rawSql);

        ConvertedScript script = ConvertedScript.builder()
                .migrationRunId(runId)
                .originalSql(rawSql)
                .convertedSql(convertedSql)
                .build();

        convertedScriptRepository.save(script);

        log.info("Conversion completed and persisted for run ID: {}", runId);

        return ConvertedScriptDto.builder()
                .migrationRunId(runId)
                .convertedSql(convertedSql)
                .build();
    }

    public ConvertedScriptDto getConvertedScript(UUID runId) {
        ConvertedScript script = convertedScriptRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Converted script not found for ID: " + runId));

        return ConvertedScriptDto.builder()
                .migrationRunId(script.getMigrationRunId())
                .convertedSql(script.getConvertedSql())
                .build();
    }
}

