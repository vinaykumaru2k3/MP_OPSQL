package com.migrationplayground.service;

import com.migrationplayground.dto.TableValidationMetricDto;
import com.migrationplayground.dto.ValidationResultDto;
import com.migrationplayground.model.*;
import com.migrationplayground.parser.SqlParser;
import com.migrationplayground.repository.MigrationRunRepository;
import com.migrationplayground.repository.ValidationResultRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ValidationService {
    private static final Logger log = LoggerFactory.getLogger(ValidationService.class);

    private final MigrationRunRepository migrationRunRepository;
    private final ValidationResultRepository validationResultRepository;
    private final SqlParser sqlParser;
    
    // In a real scenario, we would have multiple JdbcTemplates or DataSources configured.
    // For this playground, we'll use a single JdbcTemplate and mock the "source" behavior in tests.
    // If the project doesn't have an Oracle DB to connect to, this serves as a template.
    private final JdbcTemplate jdbcTemplate;

    public ValidationResultDto validateMigration(UUID migrationId) {
        if (validationResultRepository.existsById(migrationId)) {
            return getValidationResult(migrationId);
        }
        log.info("Starting validation for migration ID: {}", migrationId);
        
        MigrationRun run = migrationRunRepository.findById(migrationId)
                .orElseThrow(() -> new IllegalArgumentException("Migration run not found: " + migrationId));
        
        ParsedSchema schema = sqlParser.parse(run.getRawSql());
        List<Table> tables = schema.getTables();
        
        List<TableValidationMetric> metrics = new ArrayList<>();
        int matchedCount = 0;
        
        for (Table table : tables) {
            String tableName = table.getName();
            
            // In a real multi-DB setup, we'd query source (Oracle) and target (Postgres)
            Long sourceCount = getSourceRowCount(tableName);
            Long targetCount = getTargetRowCount(tableName);
            
            boolean rowCountMatch = sourceCount != null && sourceCount.equals(targetCount);
            if (rowCountMatch) matchedCount++;
            
            TableValidationMetric metric = TableValidationMetric.builder()
                    .tableName(tableName)
                    .sourceRowCount(sourceCount)
                    .targetRowCount(targetCount)
                    .rowCountMatch(rowCountMatch)
                    .dataTypeMatch(true) // Placeholder for more complex schema validation
                    .nullCountMatch(true) // Placeholder for null check validation
                    .build();
            
            metrics.add(metric);
        }
        
        ValidationResult result = ValidationResult.builder()
                .migrationRunId(migrationId)
                .migrationRun(run)
                .validationStatus(matchedCount == tables.size() ? "PASSED" : "WARNING")
                .tablesValidatedCount(tables.size())
                .tablesMatchedCount(matchedCount)
                .validatedAt(Instant.now())
                .metrics(new ArrayList<>())
                .build();
        
        // Link metrics back to the result
        for (TableValidationMetric m : metrics) {
            m.setValidationResult(result);
            result.getMetrics().add(m);
        }
        
        validationResultRepository.save(result);
        
        log.info("Validation completed for run {}. Status: {}. Matched: {}/{}", 
                migrationId, result.getValidationStatus(), matchedCount, tables.size());
        
        return mapToDto(result);
    }

    public ValidationResultDto getValidationResult(UUID migrationId) {
        ValidationResult result = validationResultRepository.findById(migrationId)
                .orElseThrow(() -> new IllegalArgumentException("Validation result not found for ID: " + migrationId));
        return mapToDto(result);
    }

    private Long getSourceRowCount(String tableName) {
        // MOCKED: In a real scenario, this would query the Oracle source DB.
        // For the playground, we'll simulate a count (often matching target for demo purposes).
        try {
             return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tableName, Long.class);
        } catch (Exception e) {
            log.warn("Could not fetch source row count for table {}: {}", tableName, e.getMessage());
            return 0L; 
        }
    }

    private Long getTargetRowCount(String tableName) {
        try {
            return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tableName, Long.class);
        } catch (Exception e) {
            log.warn("Could not fetch target row count for table {}: {}", tableName, e.getMessage());
            return 0L;
        }
    }

    private ValidationResultDto mapToDto(ValidationResult result) {
        return ValidationResultDto.builder()
                .migrationRunId(result.getMigrationRunId())
                .validationStatus(result.getValidationStatus())
                .tablesValidatedCount(result.getTablesValidatedCount())
                .tablesMatchedCount(result.getTablesMatchedCount())
                .validatedAt(result.getValidatedAt())
                .metrics(result.getMetrics().stream()
                        .map(m -> TableValidationMetricDto.builder()
                                .tableName(m.getTableName())
                                .sourceRowCount(m.getSourceRowCount())
                                .targetRowCount(m.getTargetRowCount())
                                .rowCountMatch(m.getRowCountMatch())
                                .dataTypeMatch(m.getDataTypeMatch())
                                .nullCountMatch(m.getNullCountMatch())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
