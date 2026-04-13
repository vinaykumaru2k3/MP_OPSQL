
package com.migrationplayground.parser;

import com.migrationplayground.model.Column;
import com.migrationplayground.model.Constraint;
import com.migrationplayground.model.ParsedSchema;
import com.migrationplayground.model.Table;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SqlParser {
    private static final Logger log = LoggerFactory.getLogger(SqlParser.class);
    
    public ParsedSchema parse(String rawSql) {
        if (rawSql == null || rawSql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL input cannot be empty.");
        }
        
        // Mask String Literals to avoid corrupting content inside quotes
        java.util.List<String> literals = new java.util.ArrayList<>();
        String maskedSql = maskStringLiterals(rawSql, literals);

        // Remove comments from masked SQL
        String sql = maskedSql.replaceAll("--.*", "");
        sql = sql.replaceAll("/\\*.*?\\*/", "");
        sql = sql.replaceAll("\r\n", "\n"); // normalize line endings
        
        // Restore String Literals
        sql = unmaskStringLiterals(sql, literals);

        ParsedSchema schema = new ParsedSchema();
        
        String[] tableBlocks = sql.split("(?i)CREATE\\s+TABLE\\s+");
        for (int i = 1; i < tableBlocks.length; i++) {
            String block = tableBlocks[i];
            int firstParen = block.indexOf('(');
            int lastParen = block.lastIndexOf(')');
            
            if (firstParen != -1 && lastParen != -1 && lastParen > firstParen) {
                String tableName = block.substring(0, firstParen).replace("\"", "").trim();
                String tableBody = block.substring(firstParen + 1, lastParen).trim();
                
                Table table = new Table();
                table.setName(tableName);
                parseTableBody(tableBody, table);
                schema.getTables().add(table);
            }
        }
        
        return schema;
    }
    
    private void parseTableBody(String body, Table table) {
        // Split by comma, but not commas inside parens (like NUMBER(10,2))
        String[] parts = body.split(",(?![^(]*\\))");
        
        for (String part : parts) {
            part = part.trim();
            if (part.isEmpty()) continue;
            
            String upperPart = part.toUpperCase();
            
            if (upperPart.startsWith("CONSTRAINT") || upperPart.startsWith("PRIMARY KEY") || upperPart.startsWith("FOREIGN KEY")) {
                parseConstraint(part, table);
            } else {
                parseColumn(part, table);
            }
        }
    }
    
    private void parseColumn(String part, Table table) {
        String name;
        String rest;

        // Check if the column name is a quoted identifier (e.g. "My Column")
        if (part.startsWith("\"")) {
            int closingQuote = part.indexOf('"', 1);
            if (closingQuote == -1) return; // malformed
            name = part.substring(1, closingQuote);
            rest = part.substring(closingQuote + 1).trim();
        } else {
            // Plain identifier: split on first whitespace
            int firstSpace = part.indexOf(' ');
            if (firstSpace == -1) return; // no type declared
            name = part.substring(0, firstSpace).trim();
            rest = part.substring(firstSpace).trim();
        }

        // Now parse the data type from the remaining string  
        Pattern typePattern = Pattern.compile("^([a-zA-Z0-9_]+(?:\\s*\\([0-9,\\s]+\\))?)(.*)", Pattern.CASE_INSENSITIVE);
        Matcher typeMatcher = typePattern.matcher(rest);
        if (typeMatcher.find()) {
            String type = typeMatcher.group(1).trim();
            String modifiers = typeMatcher.group(2);

            boolean nullable = true;
            if (modifiers != null && modifiers.toUpperCase().contains("NOT NULL")) {
                nullable = false;
            }

            table.getColumns().add(Column.builder()
                    .name(name)
                    .type(type)
                    .nullable(nullable)
                    .build());
        }
    }
    
    private void parseConstraint(String part, Table table) {
        Constraint constraint = new Constraint();
        
        Pattern pkPattern = Pattern.compile("PRIMARY\\s+KEY\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);
        Matcher pkMatcher = pkPattern.matcher(part);
        if (pkMatcher.find()) {
            constraint.setType("PRIMARY_KEY");
            String[] cols = pkMatcher.group(1).split(",");
            for (String c : cols) {
                constraint.getColumns().add(c.trim().replace("\"", ""));
            }
            table.getConstraints().add(constraint);
            return;
        }
        
        Pattern fkPattern = Pattern.compile("FOREIGN\\s+KEY\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);
        Matcher fkMatcher = fkPattern.matcher(part);
        if (fkMatcher.find()) {
            constraint.setType("FOREIGN_KEY");
            String[] cols = fkMatcher.group(1).split(",");
            for (String c : cols) {
                constraint.getColumns().add(c.trim().replace("\"", ""));
            }
            table.getConstraints().add(constraint);
            return;
        }
    }

    private String maskStringLiterals(String sql, java.util.List<String> literals) {
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

    private String unmaskStringLiterals(String sql, java.util.List<String> literals) {
        String result = sql;
        for (int i = 0; i < literals.size(); i++) {
            result = result.replace("___STR_LITERAL_" + i + "___", literals.get(i));
        }
        return result;
    }
}
