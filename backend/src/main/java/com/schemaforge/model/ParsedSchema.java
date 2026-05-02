package com.schemaforge.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Transient in-memory model representing the full parsed Oracle schema.
 * Extended in Sprint 9 to encapsulate Indexes, Views, Sequences, and Stored Sources
 * in addition to the original Tables list.
 */
public class ParsedSchema {
    private List<Table> tables = new ArrayList<>();
    private List<OracleView> views = new ArrayList<>();
    private List<OracleIndex> indexes = new ArrayList<>();
    private List<OracleSequence> sequences = new ArrayList<>();
    private List<OracleSource> sources = new ArrayList<>();

    public List<Table> getTables() { return tables; }
    public void setTables(List<Table> tables) { this.tables = tables; }

    public List<OracleView> getViews() { return views; }
    public void setViews(List<OracleView> views) { this.views = views; }

    public List<OracleIndex> getIndexes() { return indexes; }
    public void setIndexes(List<OracleIndex> indexes) { this.indexes = indexes; }

    public List<OracleSequence> getSequences() { return sequences; }
    public void setSequences(List<OracleSequence> sequences) { this.sequences = sequences; }

    public List<OracleSource> getSources() { return sources; }
    public void setSources(List<OracleSource> sources) { this.sources = sources; }
}
