package com.migrationplayground.analyzer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SqlConverterTest {

    private SqlConverter converter;

    @BeforeEach
    void setUp() {
        converter = new SqlConverter();
    }

    @Test
    void testCV01_Varchar2Conversion() {
        String sql = "CREATE TABLE t (name VARCHAR2(100), desc NVARCHAR2(50));";
        String result = converter.convert(sql);
        assertTrue(result.contains("VARCHAR(100)"));
        assertTrue(result.contains("VARCHAR(50)"));
        assertFalse(result.contains("VARCHAR2"));
        assertFalse(result.contains("NVARCHAR2"));
    }

    @Test
    void testCV02_NumberConversion() {
        String sql = "CREATE TABLE t (id NUMBER, price NUMBER(10,2));";
        String result = converter.convert(sql);
        assertTrue(result.contains("NUMERIC"));
        assertFalse(result.contains("NUMBER"));
    }

    @Test
    void testCV03_DateConversion() {
        String sql = "CREATE TABLE t (created_at DATE);";
        String result = converter.convert(sql);
        assertTrue(result.contains("TIMESTAMP"));
        assertFalse(result.contains("DATE"));
    }

    @Test
    void testCV04_LobConversion() {
        String sql = "CREATE TABLE t (bio CLOB, avatar BLOB);";
        String result = converter.convert(sql);
        assertTrue(result.contains("TEXT"));
        assertTrue(result.contains("BYTEA"));
    }

    @Test
    void testCV05_NvlConversion() {
        String sql = "SELECT NVL(name, 'Unknown') FROM users;";
        String result = converter.convert(sql);
        assertTrue(result.contains("COALESCE(name, 'Unknown')"));
        assertFalse(result.contains("NVL"));
    }

    @Test
    void testCV06_SysdateConversion() {
        String sql = "INSERT INTO t (d) VALUES (SYSDATE);";
        String result = converter.convert(sql);
        assertTrue(result.contains("CURRENT_TIMESTAMP"));
        assertFalse(result.contains("SYSDATE"));
    }

    @Test
    void testCV07_MinusConversion() {
        String sql = "SELECT id FROM t1 MINUS SELECT id FROM t2;";
        String result = converter.convert(sql);
        assertTrue(result.contains("EXCEPT"));
        assertFalse(result.contains("MINUS"));
    }

    @Test
    void testCV08_SysGuidConversion() {
        String sql = "SELECT SYS_GUID() FROM dual;";
        String result = converter.convert(sql);
        assertTrue(result.contains("gen_random_uuid()"));
        assertFalse(result.contains("SYS_GUID()"));
    }

    @Test
    void testCV09_SequenceNextvalConversion() {
        String sql = "INSERT INTO users (id) VALUES (user_seq.NEXTVAL);";
        String result = converter.convert(sql);
        assertTrue(result.contains("NEXTVAL('user_seq')"));
        assertFalse(result.contains("user_seq.NEXTVAL"));
    }

    @Test
    void testCV10_RownumFlagging() {
        String sql = "SELECT * FROM t WHERE ROWNUM <= 10;";
        String result = converter.convert(sql);
        assertTrue(result.contains("MANUAL_REVIEW"));
        assertTrue(result.contains("LIMIT/OFFSET"));
        assertTrue(result.contains("ROWNUM"));
    }

    @Test
    void testCV11_OuterJoinFlagging() {
        String sql = "SELECT * FROM t1, t2 WHERE t1.id = t2.id (+);";
        String result = converter.convert(sql);
        assertTrue(result.contains("MANUAL_REVIEW"));
        assertTrue(result.contains("(+)"));
    }

    @Test
    void testCV12_ConnectByFlagging() {
        String sql = "SELECT * FROM emp CONNECT BY PRIOR id = mgr;";
        String result = converter.convert(sql);
        assertTrue(result.contains("MANUAL_REVIEW"));
        assertTrue(result.contains("CONNECT BY"));
    }

    @Test
    void testCV13_RowidFlagging() {
        String sql = "SELECT ROWID, name FROM users;";
        String result = converter.convert(sql);
        assertTrue(result.contains("MANUAL_REVIEW"));
        assertTrue(result.contains("ROWID"));
    }

    @Test
    void testCV14_PlSqlLogicFlagging() {
        String sql = "BEGIN FORALL i IN 1..10 BULK COLLECT INTO t; END;";
        String result = converter.convert(sql);
        assertTrue(result.contains("FORALL"));
        assertTrue(result.contains("BULK COLLECT"));
        assertTrue(result.contains("MANUAL_REVIEW"));
    }

    @Test
    void testCV15_ComplexScript() {
        String sql = "CREATE TABLE employees (\n" +
                "  emp_id NUMBER PRIMARY KEY,\n" +
                "  name VARCHAR2(100) NOT NULL,\n" +
                "  hire_date DATE DEFAULT SYSDATE\n" +
                ");\n" +
                "INSERT INTO employees (emp_id, name) VALUES (emp_seq.NEXTVAL, 'John Doe');";
        String result = converter.convert(sql);
        assertTrue(result.contains("NUMERIC PRIMARY KEY"));
        assertTrue(result.contains("VARCHAR(100)"));
        assertTrue(result.contains("TIMESTAMP DEFAULT CURRENT_TIMESTAMP"));
        assertTrue(result.contains("NEXTVAL('emp_seq')"));
    }
}
