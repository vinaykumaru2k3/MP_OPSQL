# Phase 3 Development Plan: Live Schema Extraction Engine

*This document outlines the architectural implementation for Phase 3: Live Schema Extraction. This phase transitions the SchemaForge from purely static file processing to an active, database-connected migration extraction tool.*

---

## Strategic Overview
Rather than mandating users upload raw SQL dumps, the application will provide a parallel entry point leveraging **JDBC**. The system will connect securely to a target Oracle instance, interrogate the data dictionary views (`ALL_TABLES`, `ALL_VIEWS`, `ALL_SOURCE`), strip the structural metadata natively, and seamlessly feed into our existing conversion lifecycle (`CompatibilityAnalyzer` -> `SqlConverter`).

### Pipeline Fit
The `ParsedSchema` object becomes our central contract interface.
1. **Existing Path**: `SQL File` -> `SqlParser` -> `ParsedSchema`
2. **New Path**: `Oracle JDBC` -> `LiveSchemaExtractor` -> `ParsedSchema`

Once the schema sits in `ParsedSchema`, the downstream analysis, rewriting, and exportation logic remains completely untouched.

---

## 1. Domain Modeling Extensions
To support live database structural extraction, the existing `ParsedSchema` model must expand beyond just standard tables.

We will map extended Oracle dictionary components to our domain models:
* `List<Index>` indexes;
* `List<View>` views;
* `List<StoredProcedure>` procedures;
* `List<Trigger>` triggers;
* `List<Sequence>` sequences;

---

## 2. Oracle Data Dictionary Targets
The `LiveSchemaExtractor` dynamically queries Oracle's internal dictionary mapping views. We will restrict queries exclusively to `ALL_*` views filtered by the authenticated `OWNER` attribute to respect strict user permission hierarchies without demanding root `DBA_*` privileges.

| Object | Oracle View | Core Columns |
| :--- | :--- | :--- |
| **Tables** | `ALL_TABLES` | `TABLE_NAME`, `NUM_ROWS` |
| **Columns** | `ALL_TAB_COLUMNS` | `TABLE_NAME`, `COLUMN_NAME`, `DATA_TYPE`, `DATA_LENGTH`, `NULLABLE`, `DATA_DEFAULT` |
| **Indexes** | `ALL_INDEXES` + `ALL_IND_COLUMNS` | `INDEX_NAME`, `INDEX_TYPE`, `UNIQUENESS`, `COLUMN_NAME`, `COLUMN_POSITION` |
| **Primary/Foreign Keys**| `ALL_CONSTRAINTS` + `ALL_CONS_COLUMNS` | `CONSTRAINT_TYPE` (P, R, U, C) |
| **Views** | `ALL_VIEWS` | `VIEW_NAME`, `TEXT` |
| **Stored Procedures** | `ALL_SOURCE` | `NAME`, `TYPE`, `LINE`, `TEXT` |
| **Triggers** | `ALL_TRIGGERS` | `TRIGGER_NAME`, `TABLE_NAME`, `TRIGGER_TYPE`, `TRIGGERING_EVENT`, `TRIGGER_BODY` |
| **Sequences** | `ALL_SEQUENCES` | `SEQUENCE_NAME`, `MIN_VALUE`, `MAX_VALUE`, `INCREMENT_BY` |

*(Note on Procedures: `ALL_SOURCE` stores PL/SQL sequentially. Our engine must execute `ORDER BY LINE` and concatenate string bodies to surface complete blocks for HIGH severity flagging).*

---

## 3. Backend Implementation

### OracleConnectionConfig DTO
A secure runtime payload for initializing transient DB sessions:
```java
public class OracleConnectionConfig {
    private String host;
    private int port;          // default 1521
    private String serviceName; // or SID
    private String username;
    private String password;   // DISCARDED INSTANTLY, never persisted.
    private String schema;     // optional
}
```

### LiveSchemaExtractor Component
The extraction brain, requiring the integration of Oracle's official JDBC driver:
```xml
<!-- In pom.xml -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>21.1.0.0</version>
</dependency>
```

```java
@Component
public class LiveSchemaExtractor {
    public ParsedSchema extract(OracleConnectionConfig config) {
        // Build isolated ephemeral JDBC context
        // Iterate dictionary queries
        // Assemble and return central ParsedSchema
    }
}
```

### API Endpoint Interface
* **`POST /api/v1/migrations/connect`** 
  * Accepts the JSON configuration. 
  * Rejects connection persistence. 
  * Spawns a standard `MigrationRun` entity compatible with the `/analyze` route.

---

## 4. Frontend Topology
The UI Home page will branch logic between isolated File Drops and Database connections.

**UI Toggle**: `[Upload File]` | `[Connect Live]`
* When configured to Connect Live, a localized form intercepts host, port, remote user metadata.
* It securely queries the `/connect` API and cascades the response ID straight into the visualization dashboard exactly mirroring file-upload pathways.

---

## 5. End-to-End Delivery Outputs
When processed, the `SqlConverter` expands strictly linear document dumping into sequentially accurate, full-database DDL replication blocks:
```sql
-- 1. Generated Sequences
CREATE SEQUENCE emp_seq START WITH 1 INCREMENT BY 1;

-- 2. Master Tables
CREATE TABLE employees ( ... );

-- 3. Accelerated Indexes
CREATE INDEX idx_emp_dept ON employees(department_id);

-- 4. Constraint Alterations
ALTER TABLE employees ADD CONSTRAINT pk_emp PRIMARY KEY (employee_id);

-- 5. Data View Proxies
CREATE VIEW active_employees AS SELECT ...;

-- 6. Trigger Exceptions (Captured via Validation Logging)
/* TODO [MANUAL_REVIEW]: Trigger TRG_EMP_AUDIT requires manual rewriting */
```

## Security & Timeout Guardrails
1. **Password Scavenging**: Password strings mapped into `OracleConnectionConfig` exist solely as memory vectors for establishing the target JDBC context and are aggressively purged prior to initializing the global `MigrationRun`.
2. **Ephemeral Timeouts**: Remote database extractions run intense risks of thread starvation if targeted at dead endpoints. Aggressive constraints (`loginTimeout`, `socketTimeout`) must be enforced on JDBC drivers. As load-volumes balloon, future consideration includes pivoting schema-extraction to asynchronous execution polling routes instead of blocked HTTP contexts.
