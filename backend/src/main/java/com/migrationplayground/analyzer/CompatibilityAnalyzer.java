package com.migrationplayground.analyzer;

import com.migrationplayground.model.AnalysisIssue;
import com.migrationplayground.model.AnalysisReport;
import com.migrationplayground.model.Column;
import com.migrationplayground.model.ParsedSchema;
import com.migrationplayground.model.Table;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CompatibilityAnalyzer {

    public AnalysisReport analyze(ParsedSchema schema, String rawSql) {
        List<AnalysisIssue> issues = new ArrayList<>();

        if (schema != null && schema.getTables() != null) {
            for (Table table : schema.getTables()) {
                if (table.getColumns() != null) {
                    for (Column col : table.getColumns()) {
                        analyzeDataType(table.getName(), col, issues);
                    }
                }
            }
        }

        if (rawSql != null && !rawSql.trim().isEmpty()) {
            analyzeRawSql(rawSql, issues);
        }

        int high = 0, medium = 0, low = 0;
        for (AnalysisIssue issue : issues) {
            switch (issue.getSeverity().toUpperCase()) {
                case "HIGH": high++; break;
                case "MEDIUM": medium++; break;
                case "LOW": low++; break;
            }
        }

        return AnalysisReport.builder()
                .issues(issues)
                .highSeverityCount(high)
                .mediumSeverityCount(medium)
                .lowSeverityCount(low)
                .build();
    }

    private void analyzeDataType(String tableName, Column col, List<AnalysisIssue> issues) {
        String type = col.getType().toUpperCase();
        String columnName = tableName + "." + col.getName();

        if (type.startsWith("VARCHAR2") || type.startsWith("NVARCHAR2")) {
            addIssue(issues, "VARCHAR2/NVARCHAR2", "LOW", "Column " + columnName + " uses Oracle-specific string type. Convert to VARCHAR.");
        } else if (type.startsWith("NUMBER")) {
            addIssue(issues, "NUMBER", "LOW", "Column " + columnName + " uses NUMBER. Convert to NUMERIC or BOOLEAN (if NUMBER(1)).");
        } else if (type.equals("DATE")) {
            addIssue(issues, "DATE", "MEDIUM", "Column " + columnName + " uses DATE. Convert to TIMESTAMP.");
        } else if (type.equals("CLOB")) {
            addIssue(issues, "CLOB", "LOW", "Column " + columnName + " uses CLOB. Convert to TEXT.");
        } else if (type.equals("BLOB")) {
            addIssue(issues, "BLOB", "MEDIUM", "Column " + columnName + " uses BLOB. Convert to BYTEA.");
        } else if (type.equals("ROWID") || type.equals("UROWID")) {
            addIssue(issues, "ROWID/UROWID", "HIGH", "Column " + columnName + " uses ROWID. No PostgreSQL equivalent. Requires redesign.");
        } else if (type.equals("XMLTYPE")) {
            addIssue(issues, "XMLTYPE", "MEDIUM", "Column " + columnName + " uses XMLTYPE. Convert to XML.");
        }
    }

    private void analyzeRawSql(String rawSql, List<AnalysisIssue> issues) {
        // Strip out single-line and multi-line comments to avoid false positives
        String cleanSql = rawSql.replaceAll("(?s)/\\*.*?\\*/", "")
                                .replaceAll("--.*", "");
        String upperSql = cleanSql.toUpperCase();

        // Functions and Expressions
        checkRegex(upperSql, "\\bNVL\\s*\\(", "NVL()", "MEDIUM", "Oracle NVL function used. Convert to COALESCE.", issues);
        checkRegex(upperSql, "\\bNVL2\\s*\\(", "NVL2()", "MEDIUM", "Oracle NVL2 function used. Convert to CASE statement.", issues);
        checkRegex(upperSql, "\\bDECODE\\s*\\(", "DECODE()", "MEDIUM", "Oracle DECODE function used. Convert to CASE statement.", issues);
        checkRegex(upperSql, "\\bSYSDATE\\b", "SYSDATE", "MEDIUM", "Oracle SYSDATE used. Convert to NOW() or CURRENT_TIMESTAMP.", issues);
        checkRegex(upperSql, "\\bSYS_GUID\\s*\\(\\s*\\)", "SYS_GUID()", "MEDIUM", "Oracle SYS_GUID() used. Convert to gen_random_uuid().", issues);
        checkRegex(upperSql, "\\bLNNVL\\b", "LNNVL()", "HIGH", "Oracle LNNVL function used. No direct equivalent. Requires rewrite.", issues);

        // Pagination and Joins
        checkRegex(upperSql, "\\bROWNUM\\b", "ROWNUM", "HIGH", "Oracle ROWNUM used for pagination. Convert to LIMIT/OFFSET.", issues);
        checkRegex(upperSql, "\\(\\+\\)", "(+) Outer Join", "HIGH", "Oracle old-style outer join (+) used. Convert to ANSI LEFT/RIGHT JOIN.", issues);
        checkRegex(upperSql, "\\bCONNECT\\s+BY\\b", "CONNECT BY", "HIGH", "Oracle CONNECT BY hierarchical query used. Convert to WITH RECURSIVE CTE.", issues);
        checkRegex(upperSql, "\\bMINUS\\b", "MINUS", "LOW", "Oracle MINUS set operator used. Convert to EXCEPT.", issues);

        // Sequences
        checkRegex(upperSql, "\\.NEXTVAL\\b", ".NEXTVAL", "MEDIUM", "Oracle sequence NEXTVAL syntax used. Convert to NEXTVAL('seq_name').", issues);

        // Unsupported Logic
        checkRegex(upperSql, "\\bBULK\\s+COLLECT\\b", "BULK COLLECT", "HIGH", "Oracle BULK COLLECT used. Rewrite as set-based operation.", issues);
        checkRegex(upperSql, "\\bFORALL\\b", "FORALL", "HIGH", "Oracle FORALL used. Rewrite as set-based operation.", issues);
        checkRegex(upperSql, "\\bPRAGMA\\b", "PRAGMA", "HIGH", "Oracle PRAGMA directive used. Remove or redesign for PostgreSQL.", issues);
    }

    private void checkRegex(String text, String regex, String construct, String severity, String desc, List<AnalysisIssue> issues) {
        Pattern p = Pattern.compile(regex);
        Matcher m = p.matcher(text);
        if (m.find()) { // We only need to know it exists at least once for the report
            addIssue(issues, construct, severity, desc);
        }
    }

    private void addIssue(List<AnalysisIssue> issues, String construct, String severity, String desc) {
        // Prevent duplicate constructs across the global run (e.g. if SYSDATE is used 10 times, report it once)
        boolean exists = issues.stream().anyMatch(i -> i.getConstruct().equals(construct) && i.getDescription().equals(desc));
        if (!exists) {
            issues.add(AnalysisIssue.builder()
                    .construct(construct)
                    .severity(severity)
                    .description(desc)
                    .build());
        }
    }
}
