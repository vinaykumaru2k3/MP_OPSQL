package com.migrationplayground.service;

import com.migrationplayground.model.MigrationRun;
import com.migrationplayground.model.ParsedSchema;
import com.migrationplayground.parser.SqlParser;
import com.migrationplayground.repository.MigrationRunRepository;
import java.nio.charset.StandardCharsets;
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
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SchemaService {
    private static final Logger log = LoggerFactory.getLogger(SchemaService.class);

    private final MigrationRunRepository migrationRunRepository;
    private final SqlParser sqlParser;
    private final CompatibilityAnalyzer compatibilityAnalyzer;
    private final SqlConverter sqlConverter;

    // TODO [Sprint 4 Technical Debt]: Remove these in-memory caches and persist to PostgreSQL/File System
    private final Map<UUID, String> rawSqlCache = new ConcurrentHashMap<>();
    private final Map<UUID, ParsedSchema> schemaCache = new ConcurrentHashMap<>();
    private final Map<UUID, AnalysisReportDto> reportCache = new ConcurrentHashMap<>();
    private final Map<UUID, ConvertedScriptDto> conversionCache = new ConcurrentHashMap<>();
    
    public SchemaService(MigrationRunRepository migrationRunRepository, SqlParser sqlParser, 
                        CompatibilityAnalyzer compatibilityAnalyzer, SqlConverter sqlConverter) {
        this.migrationRunRepository = migrationRunRepository;
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
            
            MigrationRun run = new MigrationRun();
            run.setFileName(fileName);
            run.setStatus("PARSED");
            run.setTableCount(tableCount);
            run.setColumnCount(colCount);
                
            run = migrationRunRepository.save(run);
            
            // Temporary Sprint 2 Cache
            rawSqlCache.put(run.getId(), content);
            schemaCache.put(run.getId(), schema);
            
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
        if (!rawSqlCache.containsKey(runId) || !schemaCache.containsKey(runId)) {
            throw new IllegalArgumentException("Migration run data not found in cache for ID: " + runId);
        }

        String rawSql = rawSqlCache.get(runId);
        ParsedSchema schema = schemaCache.get(runId);

        AnalysisReport report = compatibilityAnalyzer.analyze(schema, rawSql);
        report.setMigrationRunId(runId);

        AnalysisReportDto dto = AnalysisReportDto.builder()
                .migrationRunId(report.getMigrationRunId())
                .highSeverityCount(report.getHighSeverityCount())
                .mediumSeverityCount(report.getMediumSeverityCount())
                .lowSeverityCount(report.getLowSeverityCount())
                .issues(report.getIssues())
                .build();

        reportCache.put(runId, dto);
        log.info("Analysis completed for run ID: {}. High: {}, Medium: {}, Low: {}", runId, dto.getHighSeverityCount(), dto.getMediumSeverityCount(), dto.getLowSeverityCount());
        
        return dto;
    }

    public AnalysisReportDto getAnalysis(UUID runId) {
        if (!reportCache.containsKey(runId)) {
            throw new IllegalArgumentException("Analysis report not found for ID: " + runId);
        }
        return reportCache.get(runId);
    }

    public ConvertedScriptDto convert(UUID runId) {
        if (!rawSqlCache.containsKey(runId)) {
            throw new IllegalArgumentException("Migration run data not found in cache for ID: " + runId);
        }

        String rawSql = rawSqlCache.get(runId);
        String convertedSql = sqlConverter.convert(rawSql);

        ConvertedScriptDto dto = ConvertedScriptDto.builder()
                .migrationRunId(runId)
                .convertedSql(convertedSql)
                .build();

        conversionCache.put(runId, dto);
        log.info("Conversion completed for run ID: {}", runId);

        return dto;
    }

    public ConvertedScriptDto getConvertedScript(UUID runId) {
        if (!conversionCache.containsKey(runId)) {
            throw new IllegalArgumentException("Converted script not found for ID: " + runId);
        }
        return conversionCache.get(runId);
    }
}

