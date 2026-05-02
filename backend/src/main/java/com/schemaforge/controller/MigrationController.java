package com.schemaforge.controller;

import com.schemaforge.dto.AnalysisReportDto;
import com.schemaforge.dto.ConvertedScriptDto;
import com.schemaforge.dto.FullReportDto;
import com.schemaforge.dto.ValidationResultDto;
import com.schemaforge.model.MigrationRun;
import com.schemaforge.service.SchemaService;
import com.schemaforge.service.ValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/migrations")
public class MigrationController {

    private final SchemaService schemaService;
    private final ValidationService validationService;

    public MigrationController(SchemaService schemaService, ValidationService validationService) {
        this.schemaService = schemaService;
        this.validationService = validationService;
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

    @GetMapping("/{id}")
    public ResponseEntity<MigrationRun> getMigrationRun(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(schemaService.getFullReport(id).getMigrationRun());
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
    public ResponseEntity<ConvertedScriptDto> getConvertedScript(@PathVariable("id") UUID id) {
        ConvertedScriptDto scriptDto = schemaService.getConvertedScript(id);
        return new ResponseEntity<>(scriptDto, HttpStatus.OK);
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<ValidationResultDto> validate(@PathVariable("id") UUID id) {
        ValidationResultDto result = validationService.validateMigration(id);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/validation")
    public ResponseEntity<ValidationResultDto> getValidation(@PathVariable("id") UUID id) {
        ValidationResultDto result = validationService.getValidationResult(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<FullReportDto> getFullReport(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(schemaService.getFullReport(id));
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable("id") UUID id) {
        byte[] pdfBytes = schemaService.generatePdfReport(id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/{id}/export/json")
    public ResponseEntity<FullReportDto> exportJson(@PathVariable("id") UUID id) {
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + id + ".json")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(schemaService.getFullReport(id));
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<MigrationRun>> getHistory(@RequestParam(value = "fileName", required = false) String fileName) {
        return ResponseEntity.ok(schemaService.getHistory(fileName));
    }
}
