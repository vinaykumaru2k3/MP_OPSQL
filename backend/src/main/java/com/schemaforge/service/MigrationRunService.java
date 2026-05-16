package com.schemaforge.service;

import com.schemaforge.model.MigrationRun;
import com.schemaforge.model.ParsedSchema;
import com.schemaforge.parser.SqlParser;
import com.schemaforge.repository.MigrationRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Service
public class MigrationRunService {
    private static final Logger log = LoggerFactory.getLogger(MigrationRunService.class);

    private final MigrationRunRepository migrationRunRepository;
    private final SqlParser sqlParser;

    public MigrationRunService(MigrationRunRepository migrationRunRepository, SqlParser sqlParser) {
        this.migrationRunRepository = migrationRunRepository;
        this.sqlParser = sqlParser;
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

    /**
     * Creates and persists a MigrationRun sourced from a live Oracle DB extraction.
     * The rawSql is synthesised from the extracted ParsedSchema as a minimal DDL summary.
     *
     * @param schemaOwner the Oracle schema/owner name (used as the run's file_name identifier)
     * @param schema      the fully extracted ParsedSchema
     * @return the persisted MigrationRun with sourceType = LIVE_DB
     */
    public MigrationRun createFromLiveExtraction(String schemaOwner, ParsedSchema schema) {
        int tableCount = schema.getTables().size();
        int colCount = schema.getTables().stream()
                .mapToInt(t -> t.getColumns().size())
                .sum();

        // Synthesise a minimal DDL summary to store as rawSql so downstream
        // analysis and conversion pipelines have something to work with.
        String rawSql = synthesiseDdl(schema);

        MigrationRun run = MigrationRun.builder()
                .fileName(schemaOwner + " (live)")
                .status("PARSED")
                .tableCount(tableCount)
                .columnCount(colCount)
                .rawSql(rawSql)
                .build();
        run.setSourceType("LIVE_DB");

        run = migrationRunRepository.save(run);
        log.info("Created LIVE_DB run ID: {} for schema [{}]. Tables={}, Cols={}",
                run.getId(), schemaOwner, tableCount, colCount);
        return run;
    }

    /**
     * Synthesises a CREATE TABLE DDL string from the in-memory ParsedSchema.
     * This is used as the rawSql stored in the MigrationRun so that the existing
     * CompatibilityAnalyzer and SqlConverter pipelines can operate normally.
     */
    private String synthesiseDdl(ParsedSchema schema) {
        StringBuilder sb = new StringBuilder();

        // Sequences first
        for (com.schemaforge.model.OracleSequence seq : schema.getSequences()) {
            sb.append("CREATE SEQUENCE ").append(seq.getName())
                    .append(" START WITH ").append(seq.getMinValue())
                    .append(" INCREMENT BY ").append(seq.getIncrementBy())
                    .append(";\n");
        }

        // Tables
        for (com.schemaforge.model.Table table : schema.getTables()) {
            sb.append("CREATE TABLE ").append(table.getName()).append(" (\n");
            List<com.schemaforge.model.Column> cols = table.getColumns();
            for (int i = 0; i < cols.size(); i++) {
                com.schemaforge.model.Column col = cols.get(i);
                sb.append("  ").append(col.getName()).append(" ").append(col.getType());
                if (!col.isNullable()) sb.append(" NOT NULL");
                if (i < cols.size() - 1) sb.append(",");
                sb.append("\n");
            }
            // Append constraints
            for (com.schemaforge.model.Constraint c : table.getConstraints()) {
                sb.append("  ,").append(c.getType()).append(" (")
                        .append(String.join(", ", c.getColumns())).append(")\n");
            }
            sb.append(");\n\n");
        }

        // Views
        for (com.schemaforge.model.OracleView view : schema.getViews()) {
            sb.append("CREATE OR REPLACE VIEW ").append(view.getName()).append(" AS\n");
            sb.append(view.getDefinition()).append(";\n\n");
        }

        return sb.toString();
    }

    public MigrationRun getMigrationRun(UUID runId) {
        return migrationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Migration run not found for ID: " + runId));
    }

    public java.util.List<MigrationRun> getHistory(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return migrationRunRepository.findAllByOrderByCreatedAtDesc();
        }
        return migrationRunRepository.findByFileNameOrderByCreatedAtDesc(fileName);
    }
}

