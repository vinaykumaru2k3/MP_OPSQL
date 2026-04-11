package com.migrationplayground.model;

import java.util.List;
import java.util.ArrayList;

public class ParsedSchema {
    private List<Table> tables = new ArrayList<>();
    
    public List<Table> getTables() {
        return tables;
    }
    
    public void setTables(List<Table> tables) {
        this.tables = tables;
    }
}
