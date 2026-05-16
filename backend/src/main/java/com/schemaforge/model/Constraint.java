package com.schemaforge.model;

import java.util.ArrayList;
import java.util.List;

public class Constraint {
    private String type;
    private List<String> columns = new ArrayList<>();
    private String column;

    // FK reference metadata — populated by LiveSchemaExtractor for FOREIGN KEY constraints
    private String referencedTable;
    private List<String> referencedColumns = new ArrayList<>();

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
    public String getColumn() { return column; }
    public void setColumn(String column) { this.column = column; }
    public String getReferencedTable() { return referencedTable; }
    public void setReferencedTable(String referencedTable) { this.referencedTable = referencedTable; }
    public List<String> getReferencedColumns() { return referencedColumns; }
    public void setReferencedColumns(List<String> referencedColumns) { this.referencedColumns = referencedColumns; }
}
