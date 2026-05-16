package com.schemaforge.model;

/**
 * Represents an Oracle VIEW object extracted from ALL_VIEWS.
 * Transient in-memory model — not a JPA entity.
 */
public class OracleView {
    private String name;
    private String definition;

    public OracleView() {}

    public OracleView(String name, String definition) {
        this.name = name;
        this.definition = definition;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }
}
