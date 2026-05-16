# Live Schema Extraction — How SchemaForge Reads a Live Oracle Database

> **File:** `backend/src/main/java/com/schemaforge/service/LiveSchemaExtractor.java`  
> **Introduced in:** Sprint 9 (Phase 3)  
> **Entry point:** `POST /api/v1/migrations/connect`

---

## Overview

When a user fills in the **Live Database** connection form on the frontend and clicks
**Extract Schema**, SchemaForge does **not** ask Oracle to produce DDL text.
Instead, it connects via JDBC and queries Oracle's built-in **data dictionary views** —
system tables that Oracle maintains internally to describe every object in the database.

The extracted metadata is assembled in-memory into a `ParsedSchema` object, which is
then passed through the exact same **Analyzer → Converter** pipeline that processes an
uploaded `.sql` file. From the pipeline's perspective, live extraction and file upload
are completely interchangeable.

```
User fills form → POST /connect → LiveSchemaExtractor → ParsedSchema
                                                              ↓
                                              CompatibilityAnalyzer  (same as file upload)
                                                              ↓
                                                      SqlConverter   (same as file upload)
                                                              ↓
                                                 MigrationRun stored in DB
```

---

## Why Not Use `DBMS_METADATA.GET_DDL`?

Oracle provides a built-in function called `DBMS_METADATA.GET_DDL` that can return
the exact DDL text for any object. We deliberately chose **not** to use it for the
following reasons:

| Concern | Detail |
|---|---|
| **Requires elevated privileges** | Calling `DBMS_METADATA` on another user's objects requires `SELECT_CATALOG_ROLE` or `DBA` grants, which many read-only accounts don't have. |
| **Output is Oracle-specific syntax** | The returned DDL contains storage clauses (`TABLESPACE`, `PCTFREE`, `STORAGE`), Oracle segment parameters, and XML-style output that needs heavy parsing before it is useful. |
| **Portability** | Dictionary views (`ALL_*`) are available in every Oracle edition including Oracle Free 23c, Oracle XE, and RDS Oracle — no special grants required beyond `SELECT` on `ALL_*`. |
| **Structured data is cleaner** | Reading metadata as typed rows (column names, data types, constraint types) produces a clean in-memory model that the Analyzer can work with directly — no regex parsing of raw DDL text needed. |

---

## Step-by-Step: What Happens When You Click "Extract Schema"

### 1. Frontend Sends Credentials

`LiveDb.tsx` collects the connection form and calls:

```typescript
migrationApi.connectToDb({
  host:        "localhost",
  port:        1521,
  serviceName: "FREEPDB1",
  username:    "schemaforge",
  password:    "SchemaForge1!",
  schema:      "SCHEMAFORGE"   // optional — defaults to username if omitted
});
// → POST /api/v1/migrations/connect
```

---

### 2. Backend Opens a JDBC Connection

`LiveConnectionController` receives the request, deserialises it into an
`OracleConnectionConfig` DTO, and hands it to `LiveSchemaExtractor.extract()`.

```java
// OracleConnectionConfig builds the JDBC URL
String url = "jdbc:oracle:thin:@//localhost:1521/FREEPDB1";

Properties props = new Properties();
props.setProperty("user",     "schemaforge");
props.setProperty("password", "SchemaForge1!");
// Disable Oracle's implicit statement cache so the password
// is never held in memory longer than needed.
props.setProperty("oracle.jdbc.implicitStatementCacheSize", "0");

Connection conn = DriverManager.getConnection(url, props);
```

> **Security note:** The password is stored as a `char[]` (not a `String`) in the DTO
> and is zeroed with `Arrays.fill(password, '\0')` immediately after the connection
> is established. Java `String` objects are immutable and can linger in the heap;
> `char[]` can be explicitly wiped.

---

### 3. Five Dictionary Queries Are Executed

The extractor queries five groups of Oracle data dictionary views in sequence.
All queries are `PreparedStatement`s parameterised on the schema owner name to
prevent SQL injection.

---

#### Query Group A — Tables, Columns, and Constraints

**`ALL_TABLES`** → Which tables exist in the schema?

```sql
SELECT TABLE_NAME
FROM   ALL_TABLES
WHERE  OWNER = ?
ORDER  BY TABLE_NAME;
```

**`ALL_TAB_COLUMNS`** → What columns does each table have?

```sql
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, NULLABLE
FROM   ALL_TAB_COLUMNS
WHERE  OWNER = ?
ORDER  BY TABLE_NAME, COLUMN_ID;  -- COLUMN_ID preserves declaration order
```

**`ALL_CONSTRAINTS` + `ALL_CONS_COLUMNS`** → What constraints exist?

Oracle stores constraint definitions and the columns they cover in two separate
tables. A JOIN is needed to get both in one pass.

```sql
SELECT c.TABLE_NAME,
       c.CONSTRAINT_NAME,
       c.CONSTRAINT_TYPE,   -- 'P'=Primary Key, 'U'=Unique, 'R'=Foreign Key
       cc.COLUMN_NAME,
       c.R_OWNER,           -- owner of the referenced PK (for FKs)
       c.R_CONSTRAINT_NAME  -- name of the referenced PK constraint (for FKs)
FROM   ALL_CONSTRAINTS   c
JOIN   ALL_CONS_COLUMNS  cc
       ON  c.OWNER           = cc.OWNER
       AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE  c.OWNER            = ?
  AND  c.CONSTRAINT_TYPE IN ('P', 'U', 'R')
ORDER  BY c.TABLE_NAME, c.CONSTRAINT_NAME, cc.POSITION;
```

**FK resolution is a two-pass process:**

Oracle foreign keys reference a *constraint name*, not a table name directly.
For example:

```
FK_ORDER_CUSTOMER references constraint "PK_CUSTOMERS"
```

To find out which table `PK_CUSTOMERS` belongs to, the extractor first builds
a lookup map:

```
Step 1 → Build map:  "SCHEMAFORGE.PK_CUSTOMERS" → table "CUSTOMERS", columns ["CUSTOMER_ID"]
Step 2 → Walk FKs:  look up R_OWNER + R_CONSTRAINT_NAME in the map
Step 3 → Attach:    fkConstraint.referencedTable  = "CUSTOMERS"
                    fkConstraint.referencedColumns = ["CUSTOMER_ID"]
```

This is why the JDBC code runs **two queries** against `ALL_CONSTRAINTS` — one to
build the PK lookup map, one to fetch FK records.

---

#### Query Group B — Views

**`ALL_VIEWS`** → What views exist and what is their query body?

```sql
SELECT VIEW_NAME, TEXT
FROM   ALL_VIEWS
WHERE  OWNER = ?
ORDER  BY VIEW_NAME;
```

Oracle stores the full `SELECT` body of each view in the `TEXT` column. This is
captured verbatim as an `OracleView` object.

---

#### Query Group C — Indexes

**`ALL_INDEXES` + `ALL_IND_COLUMNS`** → What indexes exist?

```sql
SELECT i.INDEX_NAME,
       i.TABLE_NAME,
       i.UNIQUENESS,     -- 'UNIQUE' or 'NONUNIQUE'
       ic.COLUMN_NAME
FROM   ALL_INDEXES     i
JOIN   ALL_IND_COLUMNS ic
       ON  i.OWNER      = ic.INDEX_OWNER
       AND i.INDEX_NAME = ic.INDEX_NAME
WHERE  i.OWNER = ?
ORDER  BY i.TABLE_NAME, i.INDEX_NAME, ic.COLUMN_POSITION;
```

Each row represents one **column of one index**. A multi-column index produces
multiple rows; the extractor stores each as a separate `OracleIndex` record
(with the same `INDEX_NAME` on each row).

---

#### Query Group D — Sequences

**`ALL_SEQUENCES`** → What sequences exist and what are their parameters?

```sql
SELECT SEQUENCE_NAME,
       MIN_VALUE,
       MAX_VALUE,
       INCREMENT_BY,
       CYCLE_FLAG    -- 'Y' or 'N'
FROM   ALL_SEQUENCES
WHERE  SEQUENCE_OWNER = ?
ORDER  BY SEQUENCE_NAME;
```

These map directly to PostgreSQL `CREATE SEQUENCE` statements.

---

#### Query Group E — Stored Programs (Procedures, Triggers, Functions, Packages)

**`ALL_SOURCE`** → What is the source code of each stored program?

```sql
SELECT NAME, TYPE, LINE, TEXT
FROM   ALL_SOURCE
WHERE  OWNER = ?
  AND  TYPE IN ('PROCEDURE','FUNCTION','TRIGGER','PACKAGE','PACKAGE BODY')
ORDER  BY NAME, TYPE, LINE;
```

Oracle stores source code **one row per line** (like a text file split by newline).
The extractor **concatenates all lines** for each `(NAME, TYPE)` pair to rebuild
the full body:

```
Row 1:  "CREATE OR REPLACE PROCEDURE update_inventory (\n"
Row 2:  "    p_product_id IN NUMBER,\n"
Row 3:  "    p_qty        IN NUMBER\n"
Row 4:  ") AS\n"
...
```
→ joined into a single `sourceText` string per procedure/trigger.

---

### 4. In-Memory Model Assembly

All query results are stored in a single `ParsedSchema` object:

```
ParsedSchema
├── List<Table>
│     ├── name: "ORDERS"
│     ├── columns: [ {name:"ORDER_ID", type:"NUMBER", nullable:false}, ... ]
│     └── constraints: [ {type:"PRIMARY KEY", columns:["ORDER_ID"]},
│                        {type:"FOREIGN KEY", columns:["CUSTOMER_ID"],
│                         referencedTable:"CUSTOMERS",
│                         referencedColumns:["CUSTOMER_ID"]} ]
├── List<OracleView>
│     └── {name:"VW_ORDER_SUMMARY", text:"SELECT o.order_id, ..."}
├── List<OracleIndex>
│     └── {name:"IDX_ORDERS_STATUS", table:"ORDERS", column:"STATUS", unique:false}
├── List<OracleSequence>
│     └── {name:"SEQ_ORDER_ID", minValue:1, maxValue:999999, increment:1, cycle:false}
└── List<OracleSource>
      └── {name:"UPDATE_INVENTORY", type:"PROCEDURE", sourceText:"CREATE OR REPLACE ..."}
```

---

### 5. The Connection Is Closed and the Password Is Wiped

The JDBC `Connection` is opened inside a `try-with-resources` block, so it is
**always closed** when the extraction finishes — even if an exception is thrown.
Immediately after `extract()` returns, the controller calls
`config.wipePassword()` which zeroes the `char[]`:

```java
Arrays.fill(password, '\0');
```

---

### 6. Same Pipeline as File Upload

`ParsedSchema` is passed to `SchemaService.orchestrate()`, which runs:

1. **`CompatibilityAnalyzer`** — scans the schema for Oracle-specific constructs
   (`SEQUENCES`, `VARCHAR2`, `NUMBER`, `SYSDATE`, `ROWNUM`, etc.) and assigns
   `HIGH / MEDIUM / LOW` severity issues.

2. **`SqlConverter`** — synthesises a PostgreSQL DDL script from the structured
   model, in the correct dependency order:
   ```
   Sequences → Base Tables → Indexes → Constraints (FK) → Views
   ```

3. A `MigrationRun` record is persisted in the PostgreSQL database with a
   `source = LIVE_DB` flag, and the frontend is redirected to the Dashboard
   showing the full analysis.

---

## Dictionary Views Quick Reference

| View | Contains |
|---|---|
| `ALL_TABLES` | Table names visible to the connected user |
| `ALL_TAB_COLUMNS` | Column definitions (name, type, nullability, position) |
| `ALL_CONSTRAINTS` | Constraint metadata (PK, FK, UNIQUE, CHECK) |
| `ALL_CONS_COLUMNS` | Columns covered by each constraint |
| `ALL_VIEWS` | View definitions including the full query body |
| `ALL_INDEXES` | Index metadata (name, table, uniqueness) |
| `ALL_IND_COLUMNS` | Columns covered by each index |
| `ALL_SEQUENCES` | Sequence parameters (start, increment, min/max, cycle) |
| `ALL_SOURCE` | Source code lines for procedures, functions, triggers, packages |

> `ALL_*` views show objects the current user has **SELECT privilege** on.
> `DBA_*` equivalents show all objects in the database but require DBA access.
> `USER_*` equivalents show only objects owned by the current user.
> SchemaForge uses `ALL_*` for maximum compatibility across privilege levels.

---

## Data Flow Diagram

```
Frontend (LiveDb.tsx)
        │
        │  POST /api/v1/migrations/connect
        │  { host, port, serviceName, username, password, schema }
        ▼
LiveConnectionController.java
        │
        │  new OracleConnectionConfig(...)
        ▼
LiveSchemaExtractor.java
        │
        ├── DriverManager.getConnection(jdbcUrl, props)
        │         │
        │         ▼  Oracle Database (FREEPDB1)
        │    ┌────────────────────────────────────────────┐
        │    │  ALL_TABLES          → table names         │
        │    │  ALL_TAB_COLUMNS     → column definitions  │
        │    │  ALL_CONSTRAINTS     → PK / FK / UNIQUE    │
        │    │  ALL_CONS_COLUMNS    → constraint columns  │
        │    │  ALL_VIEWS           → view bodies         │
        │    │  ALL_INDEXES         → index metadata      │
        │    │  ALL_IND_COLUMNS     → index columns       │
        │    │  ALL_SEQUENCES       → sequence params     │
        │    │  ALL_SOURCE          → PL/SQL source lines │
        │    └────────────────────────────────────────────┘
        │
        │  Connection closed, password wiped
        ▼
ParsedSchema (in-memory Java object)
        │
        ▼
CompatibilityAnalyzer.java
        │  → List<AnalysisIssue> (HIGH / MEDIUM / LOW)
        ▼
SqlConverter.java
        │  → PostgreSQL DDL string
        ▼
MigrationRun (persisted to PostgreSQL)
        │
        ▼
Frontend Dashboard (Analysis + SQL Comparison tabs)
```

---

## Related Files

| File | Role |
|---|---|
| `LiveSchemaExtractor.java` | Core extraction engine (JDBC + dictionary queries) |
| `LiveConnectionController.java` | REST endpoint — receives credentials, invokes extractor |
| `OracleConnectionConfig.java` (dto) | Holds connection parameters; stores password as `char[]` |
| `ParsedSchema.java` (model) | Central in-memory schema representation |
| `SchemaService.java` | Orchestrates Analyzer + Converter after extraction |
| `SqlConverter.java` | Synthesises PostgreSQL DDL from `ParsedSchema` |
| `CompatibilityAnalyzer.java` | Flags Oracle-specific constructs |
| `LiveDb.tsx` | Frontend connection form |
| `migrationApi.ts` | Frontend API client — `connectToDb()` |
