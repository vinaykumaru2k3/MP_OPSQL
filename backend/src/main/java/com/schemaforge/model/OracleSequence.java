package com.schemaforge.model;

/**
 * Represents an Oracle SEQUENCE extracted from ALL_SEQUENCES.
 * Transient in-memory model — not a JPA entity.
 */
public class OracleSequence {
    private String name;
    private long minValue;
    private long maxValue;
    private long incrementBy;
    private boolean cycleFlag;

    public OracleSequence() {}

    public OracleSequence(String name, long minValue, long maxValue, long incrementBy, boolean cycleFlag) {
        this.name = name;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.incrementBy = incrementBy;
        this.cycleFlag = cycleFlag;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public long getMinValue() { return minValue; }
    public void setMinValue(long minValue) { this.minValue = minValue; }
    public long getMaxValue() { return maxValue; }
    public void setMaxValue(long maxValue) { this.maxValue = maxValue; }
    public long getIncrementBy() { return incrementBy; }
    public void setIncrementBy(long incrementBy) { this.incrementBy = incrementBy; }
    public boolean isCycleFlag() { return cycleFlag; }
    public void setCycleFlag(boolean cycleFlag) { this.cycleFlag = cycleFlag; }
}
