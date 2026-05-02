package com.schemaforge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for live Oracle DB connection.
 * Password is stored as a char[] so it can be zeroed after use (ephemeral safety).
 * This object is NEVER persisted to the database.
 */
public class OracleConnectionConfig {

    @NotBlank(message = "Host must not be blank")
    private String host;

    @Min(1) @Max(65535)
    private int port = 1521;

    @NotBlank(message = "Service name must not be blank")
    private String serviceName;

    @NotBlank(message = "Username must not be blank")
    private String username;

    // char[] to allow zeroing after use; Jackson deserialises from String automatically
    private char[] password;

    // Optional: restrict extraction to a specific schema owner (defaults to username)
    private String schema;

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public char[] getPassword() { return password; }
    public void setPassword(char[] password) { this.password = password; }

    public String getSchema() { return schema != null ? schema.toUpperCase() : username.toUpperCase(); }
    public void setSchema(String schema) { this.schema = schema; }

    /**
     * Build the JDBC URL for Oracle Thin driver.
     */
    public String buildJdbcUrl() {
        return String.format("jdbc:oracle:thin:@//%s:%d/%s", host, port, serviceName);
    }

    /**
     * Zero-out the password array after the connection is established to prevent
     * the credential lingering in heap memory.
     */
    public void wipePassword() {
        if (password != null) {
            java.util.Arrays.fill(password, '\0');
        }
    }
}
