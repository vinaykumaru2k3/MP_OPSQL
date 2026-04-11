package com.migrationplayground.parser;

import com.migrationplayground.model.Column;
import com.migrationplayground.model.Constraint;
import com.migrationplayground.model.ParsedSchema;
import com.migrationplayground.model.Table;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SqlParserTest {

    private SqlParser sqlParser;

    @BeforeEach
    void setUp() {
        sqlParser = new SqlParser();
    }

    @Test
    void testParseSingleTable_P01() {
        String sql = "CREATE TABLE users (id NUMBER, name VARCHAR2(100))";
        ParsedSchema schema = sqlParser.parse(sql);
        
        assertEquals(1, schema.getTables().size());
        Table table = schema.getTables().get(0);
        assertEquals("users", table.getName());
        assertEquals(2, table.getColumns().size());
        assertEquals("id", table.getColumns().get(0).getName());
        assertEquals("NUMBER", table.getColumns().get(0).getType());
        assertEquals("name", table.getColumns().get(1).getName());
        assertEquals("VARCHAR2(100)", table.getColumns().get(1).getType());
    }
    
    @Test
    void testParseMultipleTables_P02() {
        String sql = "CREATE TABLE a (id NUMBER); CREATE TABLE b (id NUMBER); CREATE TABLE c (id NUMBER);";
        ParsedSchema schema = sqlParser.parse(sql);
        assertEquals(3, schema.getTables().size());
        assertEquals("a", schema.getTables().get(0).getName());
        assertEquals("b", schema.getTables().get(1).getName());
        assertEquals("c", schema.getTables().get(2).getName());
    }

    @Test
    void testParsePrimaryKey_P03() {
        String sql = "CREATE TABLE users (id NUMBER, PRIMARY KEY (id))";
        ParsedSchema schema = sqlParser.parse(sql);
        Table table = schema.getTables().get(0);
        assertEquals(1, table.getConstraints().size());
        assertEquals("PRIMARY_KEY", table.getConstraints().get(0).getType());
        assertEquals("id", table.getConstraints().get(0).getColumns().get(0));
    }

    @Test
    void testParseCompositePrimaryKey_P04() {
        String sql = "CREATE TABLE orders (order_id NUMBER, line_num NUMBER, PRIMARY KEY (order_id, line_num))";
        ParsedSchema schema = sqlParser.parse(sql);
        Table table = schema.getTables().get(0);
        assertEquals(1, table.getConstraints().size());
        assertEquals("PRIMARY_KEY", table.getConstraints().get(0).getType());
        assertEquals(2, table.getConstraints().get(0).getColumns().size());
        assertEquals("order_id", table.getConstraints().get(0).getColumns().get(0));
        assertEquals("line_num", table.getConstraints().get(0).getColumns().get(1));
    }

    @Test
    void testParseForeignKey_P05() {
        String sql = "CREATE TABLE orders (user_id NUMBER, FOREIGN KEY (user_id) REFERENCES users(id))";
        ParsedSchema schema = sqlParser.parse(sql);
        Table table = schema.getTables().get(0);
        assertEquals(1, table.getConstraints().size());
        assertEquals("FOREIGN_KEY", table.getConstraints().get(0).getType());
        assertEquals("user_id", table.getConstraints().get(0).getColumns().get(0));
    }

    @Test
    void testParseNotNull_P06() {
        String sql = "CREATE TABLE users (name VARCHAR2(100) NOT NULL)";
        ParsedSchema schema = sqlParser.parse(sql);
        Table table = schema.getTables().get(0);
        assertFalse(table.getColumns().get(0).isNullable());
    }

    @Test
    void testParseInlineComments_P07() {
        String sql = "-- This is a comment\nCREATE TABLE users (id NUMBER)";
        ParsedSchema schema = sqlParser.parse(sql);
        assertEquals(1, schema.getTables().size());
    }

    @Test
    void testParseBlockComments_P08() {
        String sql = "/* block block */ CREATE TABLE users (id NUMBER)";
        ParsedSchema schema = sqlParser.parse(sql);
        assertEquals(1, schema.getTables().size());
        assertEquals("users", schema.getTables().get(0).getName());
    }

    @Test
    void testParseCRLFLineEndings_P09() {
        String sql = "CREATE TABLE users\r\n(id NUMBER)\r\n";
        ParsedSchema schema = sqlParser.parse(sql);
        assertEquals(1, schema.getTables().size());
        assertEquals("id", schema.getTables().get(0).getColumns().get(0).getName());
    }

    @Test
    void testParseQuotedIdentifiers_P10() {
        String sql = "CREATE TABLE \"My Table\" (\"My Column\" NUMBER)";
        ParsedSchema schema = sqlParser.parse(sql);
        assertEquals("My Table", schema.getTables().get(0).getName());
        assertEquals("My Column", schema.getTables().get(0).getColumns().get(0).getName());
    }

    @Test
    void testEmptyInput_P11() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> sqlParser.parse(""));
        assertTrue(ex.getMessage().contains("empty"));
    }
}
