package com.migrationplayground.controller;

import com.migrationplayground.model.MigrationRun;
import com.migrationplayground.service.SchemaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/migrations")
public class MigrationController {

    private final SchemaService schemaService;

    public MigrationController(SchemaService schemaService) {
        this.schemaService = schemaService;
    }

    @PostMapping("/upload")
    public ResponseEntity<MigrationRun> uploadSqlFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "file_name", required = false) String fileName) {
        
        MigrationRun run = schemaService.uploadAndParse(file, fileName);
        return new ResponseEntity<>(run, HttpStatus.CREATED);
    }
}
