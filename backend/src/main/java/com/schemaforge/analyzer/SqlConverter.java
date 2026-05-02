package com.schemaforge.analyzer;

import com.schemaforge.model.OracleIndex;
import com.schemaforge.model.OracleSequence;
import com.schemaforge.model.OracleView;
import com.schemaforge.model.ParsedSchema;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SqlConverter {

    /**
     * Convert raw Oracle DDL string (from file upload).
     * Applies data-type, function, sequence, and flag transformations then returns
     * the converted PostgreSQL-compatible string.
     */
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

    /**
     * Sprint 10 — Formatting Downstream Rules.
     *
     * Convert a fully extracted {@link ParsedSchema} (from LiveSchemaExtractor) into
     * an ordered, PostgreSQL-compatible DDL script following the canonical dependency order:
     * <ol>
     *   <li>Sequences (referenced by DEFAULT expressions in tables)</li>
     *   <li>Base Tables (no FK constraints yet)</li>
     *   <li>Indexes (must be created after tables)</li>
     *   <li>Foreign Key Constraints (after all tables exist)</li>
     *   <li>Views (after all base tables exist)</li>
     * </ol>
     *
     * This ordering avoids "table does not exist" errors during DDL replay on PostgreSQL.
     */
    public String convertFromSchema(ParsedSchema schema) {
        StringBuilder sb = new StringBuilder();
        sb.append("-- ============================================================\n");
        sb.append("-- SchemaForge — Generated PostgreSQL DDL\n");
        sb.append("-- Dependency order: Sequences → Tables → Indexes → Keys → Views\n");
        sb.append("-- ============================================================\n\n");

        // ── 1. SEQUENCES ─────────────────────────────────────────────────────
        if (!schema.getSequences().isEmpty()) {
            sb.append("-- ── Sequences ─────────────────────────────────────────────\n");
            for (OracleSequence seq : schema.getSequences()) {
                sb.append(convertSequenceDdl(seq));
            }
            sb.append("\n");
        }

        // ── 2. BASE TABLES (columns only, no FKs yet) ────────────────────────
        sb.append("-- ── Tables ─────────────────────────────────────────────────\n");
        for (com.schemaforge.model.Table table : schema.getTables()) {
            sb.append(convertTableDdl(table, false));
        }
        sb.append("\n");

        // ── 3. INDEXES ───────────────────────────────────────────────────────
        if (!schema.getIndexes().isEmpty()) {
            sb.append("-- ── Indexes ────────────────────────────────────────────────\n");
            for (OracleIndex idx : schema.getIndexes()) {
                sb.append(convertIndexDdl(idx));
            }
            sb.append("\n");
        }

        // ── 4. FOREIGN KEY CONSTRAINTS ───────────────────────────────────────
        boolean hasFk = schema.getTables().stream()
                .anyMatch(t -> t.getConstraints().stream()
                        .anyMatch(c -> "FOREIGN KEY".equalsIgnoreCase(c.getType())));
        if (hasFk) {
            sb.append("-- ── Foreign Keys ───────────────────────────────────────────\n");
            for (com.schemaforge.model.Table table : schema.getTables()) {
                for (com.schemaforge.model.Constraint c : table.getConstraints()) {
                    if ("FOREIGN KEY".equalsIgnoreCase(c.getType())) {
                        sb.append("ALTER TABLE ").append(pgName(table.getName()))
                                .append("\n  ADD CONSTRAINT fk_")
                                .append(table.getName().toLowerCase()).append("_")
                                .append(String.join("_", c.getColumns()).toLowerCase())
                                .append("\n  FOREIGN KEY (")
                                .append(String.join(", ", c.getColumns().stream()
                                        .map(this::pgName).toList()))
                                .append(");\n");
                    }
                }
            }
            sb.append("\n");
        }

        // ── 5. VIEWS ─────────────────────────────────────────────────────────
        if (!schema.getViews().isEmpty()) {
            sb.append("-- ── Views ──────────────────────────────────────────────────\n");
            for (OracleView view : schema.getViews()) {
                sb.append(convertViewDdl(view));
            }
        }

        return sb.toString();
    }

    // ─── DDL helpers ─────────────────────────────────────────────────────────

    private String convertSequenceDdl(OracleSequence seq) {
        return String.format(
                "CREATE SEQUENCE IF NOT EXISTS %s\n  START WITH %d\n  INCREMENT BY %d\n  MINVALUE %d%s;\n\n",
                pgName(seq.getName()),
                seq.getMinValue(),
                seq.getIncrementBy(),
                seq.getMinValue(),
                seq.isCycleFlag() ? "\n  CYCLE" : "\n  NO CYCLE"
        );
    }

    private String convertTableDdl(com.schemaforge.model.Table table, boolean includeFk) {
        StringBuilder sb = new StringBuilder();
        sb.append("CREATE TABLE IF NOT EXISTS ").append(pgName(table.getName())).append(" (\n");

        List<String> lines = new ArrayList<>();

        for (com.schemaforge.model.Column col : table.getColumns()) {
            StringBuilder colLine = new StringBuilder("  ");
            colLine.append(pgName(col.getName())).append(" ").append(convertType(col.getType()));
            if (!col.isNullable()) colLine.append(" NOT NULL");
            lines.add(colLine.toString());
        }

        // PK and UNIQUE constraints (not FK — those come later)
        for (com.schemaforge.model.Constraint c : table.getConstraints()) {
            if ("PRIMARY KEY".equalsIgnoreCase(c.getType()) || "UNIQUE".equalsIgnoreCase(c.getType())) {
                lines.add("  " + c.getType() + " (" +
                        String.join(", ", c.getColumns().stream().map(this::pgName).toList()) + ")");
            }
            if (includeFk && "FOREIGN KEY".equalsIgnoreCase(c.getType())) {
                lines.add("  FOREIGN KEY (" +
                        String.join(", ", c.getColumns().stream().map(this::pgName).toList()) + ")");
            }
        }

        sb.append(String.join(",\n", lines));
        sb.append("\n);\n\n");
        return sb.toString();
    }

    private String convertIndexDdl(OracleIndex idx) {
        return String.format(
                "CREATE %sINDEX IF NOT EXISTS %s ON %s (%s);\n",
                idx.isUnique() ? "UNIQUE " : "",
                pgName(idx.getName()),
                pgName(idx.getTableName()),
                pgName(idx.getColumnName())
        );
    }

    private String convertViewDdl(OracleView view) {
        // Run the view definition through the standard converter to fix Oracle syntax
        String pgViewSql = convert(view.getDefinition() != null ? view.getDefinition() : "");
        return "CREATE OR REPLACE VIEW " + pgName(view.getName()) + " AS\n" + pgViewSql + ";\n\n";
    }

    /**
     * Convert Oracle data type to PostgreSQL equivalent.
     * Handles the most common type mappings.
     */
    private String convertType(String oracleType) {
        if (oracleType == null) return "TEXT";
        return switch (oracleType.toUpperCase().replaceAll("\\(.*\\)", "").trim()) {
            case "VARCHAR2", "NVARCHAR2", "CHAR", "NCHAR" -> oracleType
                    .replaceAll("(?i)\\bVARCHAR2\\b", "VARCHAR")
                    .replaceAll("(?i)\\bNVARCHAR2\\b", "VARCHAR")
                    .replaceAll("(?i)\\bNCHAR\\b", "CHAR");
            case "NUMBER"  -> "NUMERIC";
            case "DATE"    -> "TIMESTAMP";
            case "CLOB"    -> "TEXT";
            case "BLOB"    -> "BYTEA";
            case "FLOAT"   -> "DOUBLE PRECISION";
            case "INTEGER" -> "INTEGER";
            default        -> oracleType;
        };
    }

    /** Lowercase identifier — PostgreSQL prefers lowercase unquoted names. */
    private String pgName(String oracleName) {
        return oracleName == null ? "" : oracleName.toLowerCase();
    }

    // ─── Existing convert(String) helpers ────────────────────────────────────

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
        sql = sql.replaceAll("(?i)\\bVARCHAR2\\b", "VARCHAR");
        sql = sql.replaceAll("(?i)\\bNVARCHAR2\\b", "VARCHAR");
        sql = sql.replaceAll("(?i)\\bNUMBER\\b", "NUMERIC");
        sql = sql.replaceAll("(?i)(\\b\\w+\\s+)DATE\\b", "$1TIMESTAMP");
        sql = sql.replaceAll("(?i)\\bCLOB\\b", "TEXT");
        sql = sql.replaceAll("(?i)\\bBLOB\\b", "BYTEA");
        return sql;
    }

    private String convertFunctions(String sql) {
        sql = sql.replaceAll("(?i)\\bNVL\\s*\\(", "COALESCE(");
        sql = sql.replaceAll("(?i)\\bNVL2\\s*\\(([^,]+),\\s*([^,]+),\\s*([^)]+)\\)",
                "CASE WHEN $1 IS NOT NULL THEN $2 ELSE $3 END");
        sql = sql.replaceAll("(?i)\\bSYSDATE\\b", "CURRENT_TIMESTAMP");
        sql = sql.replaceAll("(?i)\\bMINUS\\b", "EXCEPT");
        sql = sql.replaceAll("(?i)\\bSYS_GUID\\s*\\(\\s*\\)", "gen_random_uuid()");
        return sql;
    }

    private String convertSequences(String sql) {
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
        sql = sql.replaceAll("(?i)\\bROWNUM\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle ROWNUM detected. Convert to LIMIT/OFFSET. */ ROWNUM");
        sql = sql.replaceAll("(?i)\\(\\+\\)",
                "/* TODO [MANUAL_REVIEW]: Oracle old-style outer join (+) detected. Convert to ANSI JOIN. */ (+)");
        sql = sql.replaceAll("(?i)\\bCONNECT\\s+BY\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle CONNECT BY detected. Convert to WITH RECURSIVE. */ CONNECT BY");
        sql = sql.replaceAll("(?i)\\bDECODE\\s*\\(",
                "/* TODO [MANUAL_REVIEW]: Oracle DECODE detected. Convert to CASE. */ DECODE(");
        sql = sql.replaceAll("(?i)\\bROWID\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle ROWID detected. No direct PostgreSQL equivalent. */ ROWID");
        sql = sql.replaceAll("(?i)\\bBULK\\s+COLLECT\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle BULK COLLECT detected. */ BULK COLLECT");
        sql = sql.replaceAll("(?i)\\bFORALL\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle FORALL detected. */ FORALL");
        sql = sql.replaceAll("(?i)\\bPRAGMA\\b",
                "/* TODO [MANUAL_REVIEW]: Oracle PRAGMA detected. */ PRAGMA");
        return sql;
    }
}
