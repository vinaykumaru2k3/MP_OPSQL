package com.schemaforge.service;

import com.schemaforge.dto.TableValidationMetricDto;
import com.schemaforge.dto.ValidationResultDto;
import com.schemaforge.model.*;
import com.schemaforge.parser.SqlParser;
import com.schemaforge.repository.MigrationRunRepository;
import com.schemaforge.repository.ValidationResultRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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

    public ValidationResultDto validateMigration(UUID migrationId) {
        if (validationResultRepository.existsByMigrationRunId(migrationId)) {
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
        
        try {
            validationResultRepository.save(result);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn("Concurrent save detected for validation {}, returning existing.", migrationId);
            return getValidationResult(migrationId);
        }
        
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
        long hash = Math.abs((long) tableName.hashCode());
        // Simulate a realistic row count between 100 and 150,000 based on the table name
        return 100L + (hash % 150000L);
    }

    private Long getTargetRowCount(String tableName) {
        long sourceCount = getSourceRowCount(tableName);
        long hash = Math.abs((long) tableName.hashCode());
        
        // Inject a simulated mismatch for about 20% of tables to demonstrate "WARNING" statuses
        if (hash % 5 == 0) {
            return sourceCount - (hash % 15) - 1L; // Slight data loss simulation
        }
        return sourceCount;
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
