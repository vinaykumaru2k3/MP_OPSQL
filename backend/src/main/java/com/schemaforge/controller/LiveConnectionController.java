package com.schemaforge.controller;

import com.schemaforge.dto.OracleConnectionConfig;
import com.schemaforge.model.MigrationRun;
import com.schemaforge.model.ParsedSchema;
import com.schemaforge.service.LiveSchemaExtractor;
import com.schemaforge.service.LiveSchemaExtractor.LiveExtractionException;
import com.schemaforge.service.MigrationRunService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sprint 9 — Live Oracle DB Connection Controller.
 *
 * POST /api/v1/migrations/connect accepts an OracleConnectionConfig payload,
 * triggers the LiveSchemaExtractor, and persists a MigrationRun (sourceType=LIVE_DB)
 * that flows through the same analysis / conversion pipeline as file-based runs.
 */
@RestController
@RequestMapping("/api/v1/migrations")
public class LiveConnectionController {

    private static final Logger log = LoggerFactory.getLogger(LiveConnectionController.class);

    private final LiveSchemaExtractor liveSchemaExtractor;
    private final MigrationRunService migrationRunService;

    public LiveConnectionController(LiveSchemaExtractor liveSchemaExtractor,
                                    MigrationRunService migrationRunService) {
        this.liveSchemaExtractor = liveSchemaExtractor;
        this.migrationRunService = migrationRunService;
    }

    /**
     * Connect to a live Oracle database, extract its full schema, persist a
     * MigrationRun, and return it so the caller can run the standard
     * analyse / convert / validate pipeline.
     *
     * Request body example:
     * <pre>
     * {
     *   "host": "my-oracle-host.example.com",
     *   "port": 1521,
     *   "serviceName": "ORCLPDB1",
     *   "username": "SCOTT",
     *   "password": "tiger",
     *   "schema": "SCOTT"
     * }
     * </pre>
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectAndExtract(@Valid @RequestBody OracleConnectionConfig config) {
        log.info("Received live extraction request for schema [{}] at [{}:{}]",
                config.getSchema(), config.getHost(), config.getPort());

        try {
            ParsedSchema schema = liveSchemaExtractor.extract(config);
            MigrationRun run = migrationRunService.createFromLiveExtraction(config.getSchema(), schema);
            return new ResponseEntity<>(run, HttpStatus.CREATED);

        } catch (LiveExtractionException ex) {
            log.error("Live extraction failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(java.util.Map.of("error", ex.getMessage()));

        } finally {
            // Always zero-out the password regardless of outcome
            config.wipePassword();
        }
    }
}
