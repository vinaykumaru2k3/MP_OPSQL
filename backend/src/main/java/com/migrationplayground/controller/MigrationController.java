package com.migrationplayground.controller;

import com.migrationplayground.dto.AnalysisReportDto;
import com.migrationplayground.dto.ConvertedScriptDto;
import com.migrationplayground.model.MigrationRun;
import com.migrationplayground.service.SchemaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

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

    @PostMapping("/{id}/analyze")
    public ResponseEntity<AnalysisReportDto> runAnalysis(@PathVariable("id") UUID id) {
        AnalysisReportDto report = schemaService.analyze(id);
        return new ResponseEntity<>(report, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<AnalysisReportDto> getAnalysis(@PathVariable("id") UUID id) {
        AnalysisReportDto report = schemaService.getAnalysis(id);
        return new ResponseEntity<>(report, HttpStatus.OK);
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ConvertedScriptDto> convert(@PathVariable("id") UUID id) {
        ConvertedScriptDto script = schemaService.convert(id);
        return new ResponseEntity<>(script, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/converted-script")
    public ResponseEntity<String> getConvertedScript(@PathVariable("id") UUID id) {
        ConvertedScriptDto script = schemaService.getConvertedScript(id);
        return ResponseEntity.ok()
                .header("Content-Type", "text/plain")
                .body(script.getConvertedSql());
    }
}
