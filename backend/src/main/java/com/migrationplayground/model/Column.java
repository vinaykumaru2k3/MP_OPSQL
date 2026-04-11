package com.migrationplayground.model;

public class Column {
    private String name;
    private String type;
    private boolean nullable;

    public Column() {}
    public Column(String name, String type, boolean nullable) {
        this.name = name;
        this.type = type;
        this.nullable = nullable;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isNullable() { return nullable; }
    public void setNullable(boolean nullable) { this.nullable = nullable; }
    
    public static class Builder {
        private String name;
        private String type;
        private boolean nullable;
        
        public Builder name(String name) { this.name = name; return this; }
        public Builder type(String type) { this.type = type; return this; }
        public Builder nullable(boolean nullable) { this.nullable = nullable; return this; }
        public Column build() { return new Column(name, type, nullable); }
    }
    public static Builder builder() { return new Builder(); }
}
