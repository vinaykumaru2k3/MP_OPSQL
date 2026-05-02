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
