package com.migrationplayground.service;

import com.migrationplayground.dto.ValidationResultDto;
import com.migrationplayground.model.*;
import com.migrationplayground.parser.SqlParser;
import com.migrationplayground.repository.MigrationRunRepository;
import com.migrationplayground.repository.ValidationResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ValidationServiceTest {

    @Mock
    private MigrationRunRepository migrationRunRepository;

    @Mock
    private ValidationResultRepository validationResultRepository;

    @Mock
    private SqlParser sqlParser;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private ValidationService validationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        validationService = new ValidationService(migrationRunRepository, validationResultRepository, sqlParser, jdbcTemplate);
    }

    @Test
    void testValidateMigration_Success() {
        UUID runId = UUID.randomUUID();
        MigrationRun run = MigrationRun.builder()
                .id(runId)
                .rawSql("CREATE TABLE USERS (ID NUMBER);")
                .build();

        Table table = new Table();
        table.setName("USERS");
        ParsedSchema schema = new ParsedSchema();
        schema.getTables().add(table);

        when(migrationRunRepository.findById(runId)).thenReturn(Optional.of(run));
        when(sqlParser.parse(anyString())).thenReturn(schema);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(100L);

        ValidationResultDto result = validationService.validateMigration(runId);

        assertNotNull(result);
        assertEquals("PASSED", result.getValidationStatus());
        assertEquals(1, result.getTablesValidatedCount());
        assertEquals(1, result.getTablesMatchedCount());
        assertEquals(1, result.getMetrics().size());
        assertTrue(result.getMetrics().get(0).getRowCountMatch());
        
        verify(validationResultRepository, times(1)).save(any(ValidationResult.class));
    }

    @Test
    void testValidateMigration_Mismatch() {
        UUID runId = UUID.randomUUID();
        MigrationRun run = MigrationRun.builder()
                .id(runId)
                .rawSql("CREATE TABLE USERS (ID NUMBER);")
                .build();

        Table table = new Table();
        table.setName("USERS");
        ParsedSchema schema = new ParsedSchema();
        schema.getTables().add(table);

        when(migrationRunRepository.findById(runId)).thenReturn(Optional.of(run));
        when(sqlParser.parse(anyString())).thenReturn(schema);
        
        // Mock different counts for source and target
        // Since my implementation uses the same jdbcTemplate twice for now, I'll need to use thenReturn(100L, 50L)
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(100L, 50L);

        ValidationResultDto result = validationService.validateMigration(runId);

        assertNotNull(result);
        assertEquals("WARNING", result.getValidationStatus());
        assertEquals(1, result.getTablesValidatedCount());
        assertEquals(0, result.getTablesMatchedCount());
        assertFalse(result.getMetrics().get(0).getRowCountMatch());
    }
}
