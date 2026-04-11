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


@Service
public class SchemaService {
    private static final Logger log = LoggerFactory.getLogger(SchemaService.class);

    private final MigrationRunRepository migrationRunRepository;
    private final SqlParser sqlParser;
    
    public SchemaService(MigrationRunRepository migrationRunRepository, SqlParser sqlParser) {
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
            
            MigrationRun run = new MigrationRun();
            run.setFileName(fileName);
            run.setStatus("PARSED");
            run.setTableCount(tableCount);
            run.setColumnCount(colCount);
                
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
}

