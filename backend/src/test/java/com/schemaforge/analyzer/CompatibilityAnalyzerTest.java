package com.schemaforge.analyzer;

import com.schemaforge.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CompatibilityAnalyzerTest {

    private CompatibilityAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new CompatibilityAnalyzer();
    }

    private ParsedSchema createMockSchema(String colType) {
        Column col = Column.builder().name("id").type(colType).nullable(false).build();
        Table table = new Table();
        table.setName("test_table");
        table.setColumns(Collections.singletonList(col));
        
        ParsedSchema schema = new ParsedSchema();
        schema.setTables(Collections.singletonList(table));
        return schema;
    }
    
    private ParsedSchema createEmptySchema() {
        return new ParsedSchema();
    }

    @Test
    void testA01_Varchar2() {
        AnalysisReport report = analyzer.analyze(createMockSchema("VARCHAR2(50)"), "");
        assertEquals(0, report.getHighSeverityCount());
        assertEquals(0, report.getMediumSeverityCount());
        assertEquals(1, report.getLowSeverityCount());
        assertEquals("VARCHAR2/NVARCHAR2", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA02_Number() {
        AnalysisReport report = analyzer.analyze(createMockSchema("NUMBER(10,2)"), "");
        assertEquals(1, report.getLowSeverityCount());
        assertEquals("NUMBER", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA03_Date() {
        AnalysisReport report = analyzer.analyze(createMockSchema("DATE"), "");
        assertEquals(1, report.getMediumSeverityCount());
        assertEquals("DATE", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA04_ClobBlob() {
        AnalysisReport reportClob = analyzer.analyze(createMockSchema("CLOB"), "");
        assertEquals(1, reportClob.getLowSeverityCount());
        assertEquals("CLOB", reportClob.getIssues().get(0).getConstruct());

        AnalysisReport reportBlob = analyzer.analyze(createMockSchema("BLOB"), "");
        assertEquals(1, reportBlob.getMediumSeverityCount());
        assertEquals("BLOB", reportBlob.getIssues().get(0).getConstruct());
    }

    @Test
    void testA05_RowId() {
        AnalysisReport report = analyzer.analyze(createMockSchema("ROWID"), "");
        assertEquals(1, report.getHighSeverityCount());
        assertEquals("ROWID/UROWID", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA06_XmlType() {
        AnalysisReport report = analyzer.analyze(createMockSchema("XMLTYPE"), "");
        assertEquals(1, report.getMediumSeverityCount());
        assertEquals("XMLTYPE", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA07_NVL_Functions() {
        String sql = "SELECT NVL(col1, 'none'), NVL2(col1, 'y', 'n') FROM t;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(2, report.getMediumSeverityCount());
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("NVL()")));
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("NVL2()")));
    }

    @Test
    void testA08_Decode() {
        String sql = "SELECT DECODE(status, 1, 'Active', 'Inactive') FROM t;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getMediumSeverityCount());
        assertEquals("DECODE()", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA09_SysdateAndSysGuid() {
        String sql = "SELECT SYSDATE, SYS_GUID() FROM dual;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(2, report.getMediumSeverityCount());
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("SYSDATE")));
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("SYS_GUID()")));
    }

    @Test
    void testA10_Lnnvl() {
        String sql = "SELECT * FROM t WHERE LNNVL(col1 > 10);";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getHighSeverityCount());
        assertEquals("LNNVL()", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA11_Rownum() {
        String sql = "SELECT * FROM t WHERE ROWNUM <= 10;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getHighSeverityCount());
        assertEquals("ROWNUM", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA12_OuterJoin() {
        String sql = "SELECT * FROM t1, t2 WHERE t1.id = t2.id (+);";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getHighSeverityCount());
        assertEquals("(+) Outer Join", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA13_ConnectBy() {
        String sql = "SELECT * FROM emp START WITH mgr IS NULL CONNECT BY mgr = id;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getHighSeverityCount());
        assertEquals("CONNECT BY", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA14_Minus() {
        String sql = "SELECT id FROM t1 MINUS SELECT id FROM t2;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(1, report.getLowSeverityCount());
        assertEquals("MINUS", report.getIssues().get(0).getConstruct());
    }

    @Test
    void testA15_UnsupportedBlocks() {
        String sql = "DECLARE PRAGMA AUTONOMOUS_TRANSACTION; BEGIN FORALL i IN 1..10 INSERT INTO t VALUES(i); END;";
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        assertEquals(2, report.getHighSeverityCount());
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("PRAGMA")));
        assertTrue(report.getIssues().stream().anyMatch(i -> i.getConstruct().equals("FORALL")));
    }

    @Test
    void testA16_StringLiteralIsolation() {
        // This test case contains Oracle keywords/functions INSIDE string literals.
        // They should NOT be flagged by the analyzer.
        String sql = "INSERT INTO logs (msg) VALUES ('User tried to use NVL function');\n" +
                     "INSERT INTO logs (msg) VALUES ('Old style join (+) is bad');\n" +
                     "INSERT INTO logs (msg) VALUES ('SYSDATE is also a keyword');\n" +
                     "INSERT INTO logs (msg) VALUES ('Escaped single quote ''NVL'' should be ignored');";
        
        AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
        
        // If the fix is NOT implemented, this will likely have several issues.
        // We want 0 issues from the strings.
        assertEquals(0, report.getIssues().size(), "Should not flag keywords inside string literals");
    }
}
