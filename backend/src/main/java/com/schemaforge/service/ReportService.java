package com.schemaforge.service;

import com.lowagie.text.Document;
import com.lowagie.text.HeaderFooter;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfWriter;
import com.schemaforge.dto.FullReportDto;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class ReportService {

    public byte[] generatePdfReport(FullReportDto report) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);

            HeaderFooter header = new HeaderFooter(new Phrase("SchemaForge - Official Report"), false);
            header.setAlignment(1);
            document.setHeader(header);

            HeaderFooter footer = new HeaderFooter(new Phrase("Page "), true);
            footer.setAlignment(1);
            document.setFooter(footer);

            document.open();

            document.add(new Paragraph("Migration Run ID: " + report.getMigrationRun().getId()));
            document.add(new Paragraph("File Name: " + report.getMigrationRun().getFileName()));
            document.add(new Paragraph("Status: " + report.getMigrationRun().getStatus()));
            document.add(new Paragraph("Tables: " + report.getMigrationRun().getTableCount()));
            document.add(new Paragraph("Columns: " + report.getMigrationRun().getColumnCount()));
            document.add(new Paragraph(" "));

            if (report.getAnalysisReport() != null) {
                document.add(new Paragraph("=== Analysis Summary ==="));
                document.add(new Paragraph("High Severity Issues: " + report.getAnalysisReport().getHighSeverityCount()));
                document.add(new Paragraph("Medium Severity Issues: " + report.getAnalysisReport().getMediumSeverityCount()));
                document.add(new Paragraph("Low Severity Issues: " + report.getAnalysisReport().getLowSeverityCount()));
                document.add(new Paragraph(" "));
            }

            if (report.getValidationResult() != null) {
                document.add(new Paragraph("=== Validation Summary ==="));
                document.add(new Paragraph("Validation Status: " + report.getValidationResult().getValidationStatus()));
                document.add(new Paragraph("Matched Tables: " + report.getValidationResult().getTablesMatchedCount() + " / " + report.getValidationResult().getTablesValidatedCount()));
                document.add(new Paragraph(" "));
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }
}
