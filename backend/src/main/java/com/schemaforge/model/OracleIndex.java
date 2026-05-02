package com.schemaforge.model;

/**
 * Represents an Oracle INDEX extracted from ALL_INDEXES / ALL_IND_COLUMNS.
 * Transient in-memory model — not a JPA entity.
 */
public class OracleIndex {
    private String name;
    private String tableName;
    private String columnName;
    private boolean unique;

    public OracleIndex() {}

    public OracleIndex(String name, String tableName, String columnName, boolean unique) {
        this.name = name;
        this.tableName = tableName;
        this.columnName = columnName;
        this.unique = unique;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public String getColumnName() { return columnName; }
    public void setColumnName(String columnName) { this.columnName = columnName; }
    public boolean isUnique() { return unique; }
    public void setUnique(boolean unique) { this.unique = unique; }
}
