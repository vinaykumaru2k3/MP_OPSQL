package com.schemaforge.model;

/**
 * Represents an Oracle stored program source (PROCEDURE, FUNCTION, TRIGGER, PACKAGE)
 * extracted from ALL_SOURCE.
 * Transient in-memory model — not a JPA entity.
 */
public class OracleSource {
    private String name;
    private String type;      // PROCEDURE, FUNCTION, TRIGGER, PACKAGE, PACKAGE BODY
    private String sourceText;

    public OracleSource() {}

    public OracleSource(String name, String type, String sourceText) {
        this.name = name;
        this.type = type;
        this.sourceText = sourceText;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSourceText() { return sourceText; }
    public void setSourceText(String sourceText) { this.sourceText = sourceText; }
}
