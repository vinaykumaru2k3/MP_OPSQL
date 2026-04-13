package com.migrationplayground.analyzer;

import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SqlConverter {

    public String convert(String oracleSql) {
        if (oracleSql == null || oracleSql.trim().isEmpty()) {
            return oracleSql;
        }

        // Mask String Literals to protect data during conversion
        List<String> literals = new ArrayList<>();
        String maskedSql = maskStringLiterals(oracleSql, literals);

        // Perform conversions on masked SQL
        String converted = maskedSql;

        // 1. Data Type Conversions
        converted = convertDataTypes(converted);

        // 2. Function Conversions
        converted = convertFunctions(converted);

        // 3. Sequence Conversions
        converted = convertSequences(converted);

        // 4. Flag HIGH severity constructs with manual review comments
        converted = flagHighSeverityConstructs(converted);

        // Restore String Literals
        return unmaskStringLiterals(converted, literals);
    }

    private String maskStringLiterals(String sql, List<String> literals) {
        Pattern p = Pattern.compile("'(?:[^']|'')*'");
        Matcher m = p.matcher(sql);
        StringBuilder sb = new StringBuilder();
        int lastIndex = 0;
        while (m.find()) {
            sb.append(sql, lastIndex, m.start());
            sb.append("___STR_LITERAL_").append(literals.size()).append("___");
            literals.add(m.group());
            lastIndex = m.end();
        }
        sb.append(sql.substring(lastIndex));
        return sb.toString();
    }

    private String unmaskStringLiterals(String sql, List<String> literals) {
        String result = sql;
        for (int i = 0; i < literals.size(); i++) {
            result = result.replace("___STR_LITERAL_" + i + "___", literals.get(i));
        }
        return result;
    }

    private String convertDataTypes(String sql) {
        // VARCHAR2 -> VARCHAR
        sql = sql.replaceAll("(?i)\\bVARCHAR2\\b", "VARCHAR");
        // NVARCHAR2 -> VARCHAR
        sql = sql.replaceAll("(?i)\\bNVARCHAR2\\b", "VARCHAR");
        // NUMBER -> NUMERIC (Note: more complex logic needed for NUMBER(1) -> BOOLEAN, but NUMERIC is safer default)
        sql = sql.replaceAll("(?i)\\bNUMBER\\b", "NUMERIC");
        // DATE -> TIMESTAMP (Oracle DATE contains time)
        sql = sql.replaceAll("(?i)\\bDATE\\b", "TIMESTAMP");
        // CLOB -> TEXT
        sql = sql.replaceAll("(?i)\\bCLOB\\b", "TEXT");
        // BLOB -> BYTEA
        sql = sql.replaceAll("(?i)\\bBLOB\\b", "BYTEA");

        return sql;
    }

    private String convertFunctions(String sql) {
        // NVL(a, b) -> COALESCE(a, b)
        sql = sql.replaceAll("(?i)\\bNVL\\s*\\(", "COALESCE(");
        
        // SYSDATE -> CURRENT_TIMESTAMP
        sql = sql.replaceAll("(?i)\\bSYSDATE\\b", "CURRENT_TIMESTAMP");
        
        // MINUS -> EXCEPT
        sql = sql.replaceAll("(?i)\\bMINUS\\b", "EXCEPT");

        // SYS_GUID() -> gen_random_uuid()
        sql = sql.replaceAll("(?i)\\bSYS_GUID\\s*\\(\\s*\\)", "gen_random_uuid()");

        // DECODE(expr, search, result, default) -> CASE WHEN expr = search THEN result ELSE default END
        // Simple regex for DECODE is hard, but we can do a basic replacement of the keyword for now 
        // as a placeholder or use a more advanced pattern. For Sprint 3, basic keyword replacement 
        // might be too risky without full parsing, but we'll try a common pattern.
        // Actually, DECODE to CASE is complex. Let's just flag it for now or do a simple replace if possible.
        // For now, let's stick to the simpler ones and flag DECODE as MEDIUM in analyzer.
        
        return sql;
    }

    private String convertSequences(String sql) {
        // .NEXTVAL -> NEXTVAL('sequence_name')
        // This is tricky because we need the sequence name. 
        // Oracle: seq_name.NEXTVAL
        // Postgres: NEXTVAL('seq_name')
        Pattern p = Pattern.compile("(\\w+)\\.NEXTVAL", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(sql);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, "NEXTVAL('" + m.group(1).toLowerCase() + "')");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String flagHighSeverityConstructs(String sql) {
        // ROWNUM
        sql = sql.replaceAll("(?i)\\bROWNUM\\b", "/* TODO [MANUAL_REVIEW]: Oracle ROWNUM detected. Convert to LIMIT/OFFSET. */ ROWNUM");
        
        // (+) Outer Join
        sql = sql.replaceAll("(?i)\\(\\+\\)", "/* TODO [MANUAL_REVIEW]: Oracle old-style outer join (+) detected. Convert to ANSI JOIN. */ (+)");
        
        // CONNECT BY
        sql = sql.replaceAll("(?i)\\bCONNECT\\s+BY\\b", "/* TODO [MANUAL_REVIEW]: Oracle CONNECT BY detected. Convert to WITH RECURSIVE. */ CONNECT BY");
        
        // ROWID
        sql = sql.replaceAll("(?i)\\bROWID\\b", "/* TODO [MANUAL_REVIEW]: Oracle ROWID detected. No direct PostgreSQL equivalent. */ ROWID");

        // BULK COLLECT / FORALL / PRAGMA
        sql = sql.replaceAll("(?i)\\bBULK\\s+COLLECT\\b", "/* TODO [MANUAL_REVIEW]: Oracle BULK COLLECT detected. */ BULK COLLECT");
        sql = sql.replaceAll("(?i)\\bFORALL\\b", "/* TODO [MANUAL_REVIEW]: Oracle FORALL detected. */ FORALL");
        sql = sql.replaceAll("(?i)\\bPRAGMA\\b", "/* TODO [MANUAL_REVIEW]: Oracle PRAGMA detected. */ PRAGMA");

        return sql;
    }
}
