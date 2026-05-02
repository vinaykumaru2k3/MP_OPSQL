package com.schemaforge.service;

import com.schemaforge.dto.OracleConnectionConfig;
import com.schemaforge.model.Column;
import com.schemaforge.model.Constraint;
import com.schemaforge.model.OracleIndex;
import com.schemaforge.model.OracleSequence;
import com.schemaforge.model.OracleSource;
import com.schemaforge.model.OracleView;
import com.schemaforge.model.ParsedSchema;
import com.schemaforge.model.Table;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Sprint 9 — Live Schema Extraction Engine.
 *
 * Connects to a live Oracle database via JDBC and scans the data dictionaries
 * (ALL_TABLES, ALL_TAB_COLUMNS, ALL_CONSTRAINTS, ALL_VIEWS, ALL_SEQUENCES,
 * ALL_INDEXES, ALL_IND_COLUMNS, ALL_SOURCE) to build a complete ParsedSchema.
 *
 * The connection is always closed in a finally block. The caller is responsible
 * for calling {@link OracleConnectionConfig#wipePassword()} after this method returns.
 */
@Service
public class LiveSchemaExtractor {

    private static final Logger log = LoggerFactory.getLogger(LiveSchemaExtractor.class);

    /**
     * Entry point. Extracts the full schema from the live Oracle instance described by config.
     *
     * @param config connection parameters (password will NOT be wiped here — caller's responsibility)
     * @return a fully populated ParsedSchema
     * @throws LiveExtractionException if the JDBC connection or any query fails
     */
    public ParsedSchema extract(OracleConnectionConfig config) {
        String url = config.buildJdbcUrl();
        String schema = config.getSchema();

        log.info("Starting live schema extraction from Oracle [{}] for schema [{}]", url, schema);

        Properties props = new Properties();
        props.setProperty("user", config.getUsername());
        props.setProperty("password", new String(config.getPassword()));
        // Disable Oracle implicit statement caching to prevent credential caching
        props.setProperty("oracle.jdbc.implicitStatementCacheSize", "0");

        ParsedSchema parsedSchema = new ParsedSchema();

        try (Connection conn = DriverManager.getConnection(url, props)) {
            log.info("JDBC connection established to Oracle.");

            parsedSchema.setTables(extractTables(conn, schema));
            parsedSchema.setViews(extractViews(conn, schema));
            parsedSchema.setIndexes(extractIndexes(conn, schema));
            parsedSchema.setSequences(extractSequences(conn, schema));
            parsedSchema.setSources(extractSources(conn, schema));

            log.info("Extraction complete. Tables={}, Views={}, Indexes={}, Sequences={}, Sources={}",
                    parsedSchema.getTables().size(),
                    parsedSchema.getViews().size(),
                    parsedSchema.getIndexes().size(),
                    parsedSchema.getSequences().size(),
                    parsedSchema.getSources().size());

        } catch (SQLException e) {
            log.error("Failed to connect or query Oracle: {}", e.getMessage());
            throw new LiveExtractionException("Oracle extraction failed: " + e.getMessage(), e);
        }

        return parsedSchema;
    }

    // ─── TABLES & COLUMNS ────────────────────────────────────────────────────

    private List<Table> extractTables(Connection conn, String schema) throws SQLException {
        // Use LinkedHashMap to preserve declaration order
        Map<String, Table> tableMap = new LinkedHashMap<>();

        // 1. Fetch all tables in schema
        String tablesSql = "SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = ? ORDER BY TABLE_NAME";
        try (PreparedStatement ps = conn.prepareStatement(tablesSql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String name = rs.getString("TABLE_NAME");
                    tableMap.put(name, new Table());
                    tableMap.get(name).setName(name);
                }
            }
        }
        log.debug("Found {} tables in schema [{}]", tableMap.size(), schema);

        // 2. Fetch columns for all tables
        String colsSql = """
                SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, NULLABLE
                FROM ALL_TAB_COLUMNS
                WHERE OWNER = ?
                ORDER BY TABLE_NAME, COLUMN_ID
                """;
        try (PreparedStatement ps = conn.prepareStatement(colsSql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    Table table = tableMap.get(tableName);
                    if (table == null) continue; // skip orphan rows

                    Column col = Column.builder()
                            .name(rs.getString("COLUMN_NAME"))
                            .type(rs.getString("DATA_TYPE"))
                            .nullable("Y".equalsIgnoreCase(rs.getString("NULLABLE")))
                            .build();

                    table.getColumns().add(col);
                }
            }
        }

        // 3. Fetch constraints (PK, FK, UNIQUE) for all tables
        String constraintsSql = """
                SELECT c.TABLE_NAME, c.CONSTRAINT_NAME, c.CONSTRAINT_TYPE,
                       cc.COLUMN_NAME, c.R_CONSTRAINT_NAME
                FROM ALL_CONSTRAINTS c
                JOIN ALL_CONS_COLUMNS cc
                  ON c.OWNER = cc.OWNER
                 AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
                WHERE c.OWNER = ?
                  AND c.CONSTRAINT_TYPE IN ('P', 'U', 'R')
                ORDER BY c.TABLE_NAME, c.CONSTRAINT_NAME, cc.POSITION
                """;
        try (PreparedStatement ps = conn.prepareStatement(constraintsSql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                // Accumulate columns per constraint first
                Map<String, Constraint> constraintMap = new LinkedHashMap<>();
                Map<String, String> constraintTable = new LinkedHashMap<>();

                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    String constraintName = rs.getString("CONSTRAINT_NAME");
                    String constraintType = rs.getString("CONSTRAINT_TYPE");
                    String columnName = rs.getString("COLUMN_NAME");

                    String key = tableName + "." + constraintName;
                    if (!constraintMap.containsKey(key)) {
                        Constraint c = new Constraint();
                        c.setType(mapConstraintType(constraintType));
                        c.setColumns(new ArrayList<>());
                        constraintMap.put(key, c);
                        constraintTable.put(key, tableName);
                    }
                    constraintMap.get(key).getColumns().add(columnName);
                }

                // Attach constraints to tables
                for (Map.Entry<String, Constraint> entry : constraintMap.entrySet()) {
                    String tableName = constraintTable.get(entry.getKey());
                    Table table = tableMap.get(tableName);
                    if (table != null) {
                        table.getConstraints().add(entry.getValue());
                    }
                }
            }
        }

        return new ArrayList<>(tableMap.values());
    }

    private String mapConstraintType(String oracleType) {
        return switch (oracleType) {
            case "P" -> "PRIMARY KEY";
            case "U" -> "UNIQUE";
            case "R" -> "FOREIGN KEY";
            default  -> oracleType;
        };
    }

    // ─── VIEWS ───────────────────────────────────────────────────────────────

    private List<OracleView> extractViews(Connection conn, String schema) throws SQLException {
        List<OracleView> views = new ArrayList<>();
        String sql = "SELECT VIEW_NAME, TEXT FROM ALL_VIEWS WHERE OWNER = ? ORDER BY VIEW_NAME";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    views.add(new OracleView(
                            rs.getString("VIEW_NAME"),
                            rs.getString("TEXT")
                    ));
                }
            }
        }
        log.debug("Extracted {} views", views.size());
        return views;
    }

    // ─── INDEXES ─────────────────────────────────────────────────────────────

    private List<OracleIndex> extractIndexes(Connection conn, String schema) throws SQLException {
        List<OracleIndex> indexes = new ArrayList<>();
        // Join ALL_INDEXES with ALL_IND_COLUMNS to get per-column index records
        String sql = """
                SELECT i.INDEX_NAME, i.TABLE_NAME, i.UNIQUENESS, ic.COLUMN_NAME
                FROM ALL_INDEXES i
                JOIN ALL_IND_COLUMNS ic
                  ON i.OWNER = ic.INDEX_OWNER
                 AND i.INDEX_NAME = ic.INDEX_NAME
                WHERE i.OWNER = ?
                ORDER BY i.TABLE_NAME, i.INDEX_NAME, ic.COLUMN_POSITION
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    indexes.add(new OracleIndex(
                            rs.getString("INDEX_NAME"),
                            rs.getString("TABLE_NAME"),
                            rs.getString("COLUMN_NAME"),
                            "UNIQUE".equalsIgnoreCase(rs.getString("UNIQUENESS"))
                    ));
                }
            }
        }
        log.debug("Extracted {} index-column rows", indexes.size());
        return indexes;
    }

    // ─── SEQUENCES ───────────────────────────────────────────────────────────

    private List<OracleSequence> extractSequences(Connection conn, String schema) throws SQLException {
        List<OracleSequence> sequences = new ArrayList<>();
        String sql = """
                SELECT SEQUENCE_NAME, MIN_VALUE, MAX_VALUE, INCREMENT_BY, CYCLE_FLAG
                FROM ALL_SEQUENCES
                WHERE SEQUENCE_OWNER = ?
                ORDER BY SEQUENCE_NAME
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    sequences.add(new OracleSequence(
                            rs.getString("SEQUENCE_NAME"),
                            rs.getLong("MIN_VALUE"),
                            rs.getLong("MAX_VALUE"),
                            rs.getLong("INCREMENT_BY"),
                            "Y".equalsIgnoreCase(rs.getString("CYCLE_FLAG"))
                    ));
                }
            }
        }
        log.debug("Extracted {} sequences", sequences.size());
        return sequences;
    }

    // ─── SOURCES (Procedures, Functions, Triggers, Packages) ─────────────────

    private List<OracleSource> extractSources(Connection conn, String schema) throws SQLException {
        // Concatenate lines per object to rebuild the full source body
        Map<String, OracleSource> sourceMap = new LinkedHashMap<>();
        String sql = """
                SELECT NAME, TYPE, LINE, TEXT
                FROM ALL_SOURCE
                WHERE OWNER = ?
                  AND TYPE IN ('PROCEDURE','FUNCTION','TRIGGER','PACKAGE','PACKAGE BODY')
                ORDER BY NAME, TYPE, LINE
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String name = rs.getString("NAME");
                    String type = rs.getString("TYPE");
                    String text = rs.getString("TEXT");

                    String key = type + "." + name;
                    if (!sourceMap.containsKey(key)) {
                        sourceMap.put(key, new OracleSource(name, type, ""));
                    }
                    OracleSource src = sourceMap.get(key);
                    src.setSourceText(src.getSourceText() + text);
                }
            }
        }
        log.debug("Extracted {} stored program objects", sourceMap.size());
        return new ArrayList<>(sourceMap.values());
    }

    // ─── Custom exception ────────────────────────────────────────────────────

    public static class LiveExtractionException extends RuntimeException {
        public LiveExtractionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
