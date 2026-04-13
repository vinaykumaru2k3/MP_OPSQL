# Sprint 3 — Conversion Engine Codebase Explanation

> **Migration Playground** | Sprint 3: Conversion Engine Implementation
> This document provides a comprehensive, in-depth walkthrough of the components built during Sprint 3. Building upon the Parser (Sprint 1) and the Analyzer (Sprint 2), Sprint 3 introduces the automated transformation logic that rewrites Oracle-specific SQL into PostgreSQL-compatible syntax.

---

## Table of Contents

1. [Big Picture: What Did Sprint 3 Build?](#1-big-picture)
2. [The Request Lifecycle (Conversion Flow)](#2-request-lifecycle)
3. [The Memory Cache (Sprint 4 Technical Debt)](#3-memory-cache)
4. [Domain Models and DTOs](#4-domain-models)
5. [The Core Engine — SqlConverter.java (Deep Dive)](#5-sqlconverter-deep-dive)
6. [The Service Layer — SchemaService.java Updates](#6-schemaservice)
7. [The Controller — MigrationController.java Updates](#7-migrationcontroller)
8. [The Test Suite — SqlConverterTest.java](#8-test-suite)
9. [The Postman Collection Update](#9-postman-collection)

---

## 1. Big Picture

Sprint 3 delivers the **Conversion Engine**, the third pillar of the Migration Playground. While Sprint 1 parsed the structure and Sprint 2 identified incompatibilities, Sprint 3 actually attempts to fix them.

**What Sprint 3 specifically delivers:**
- **Automated SQL Transformation**: A rule-based engine that rewrites data types, functions, and sequence syntax.
- **Manual Review Injection**: A safety mechanism that injects SQL comments into the generated script for `HIGH` severity constructs that cannot be safely auto-converted (e.g., `ROWNUM`, `(+)`).
- **New REST Endpoints**: Endpoints to trigger conversion and retrieve the final PostgreSQL-compatible script.
- **End-to-End Logic**: Integration with the existing `SchemaService` to provide a seamless transition from analysis to conversion.

---

## 2. Request Lifecycle (Conversion Flow)

Here is exactly what happens when a user requests a SQL conversion:

1.  **Client Request**: User sends `POST /api/v1/migrations/{id}/convert`.
2.  **Controller Routing**: `MigrationController` receives the UUID and delegates to `SchemaService.convert(runId)`.
3.  **Cache Retrieval**: `SchemaService` retrieves the raw Oracle SQL from the `rawSqlCache` (populated during the Sprint 1 upload).
4.  **Engine Execution**: `SchemaService` passes the raw SQL string to `SqlConverter.convert(oracleSql)`.
5.  **Transformation Steps**:
    *   **Data Types**: `VARCHAR2` → `VARCHAR`, `NUMBER` → `NUMERIC`, `DATE` → `TIMESTAMP`, etc.
    *   **Functions**: `NVL()` → `COALESCE()`, `SYSDATE` → `CURRENT_TIMESTAMP`, etc.
    *   **Sequences**: `seq.NEXTVAL` → `NEXTVAL('seq')`.
    *   **Flagging**: `ROWNUM`, `(+)`, `CONNECT BY`, etc., are wrapped with `/* TODO [MANUAL_REVIEW] */` comments.
6.  **Persistence**: The resulting PostgreSQL script is wrapped in a `ConvertedScriptDto` and stored in the `conversionCache`.
7.  **Response**: The system returns a JSON response containing the `migrationRunId` and the `convertedSql`.

---

## 3. The Memory Cache (Sprint 4 Technical Debt)

Following the pattern established in Sprint 2, the conversion results are temporarily stored in memory to bridge the gap until Sprint 4's persistence layer is implemented.

```java
// SchemaService.java
private final Map<UUID, ConvertedScriptDto> conversionCache = new ConcurrentHashMap<>();
```

*Note: Restarting the application will clear all converted scripts. This is a known limitation to be addressed in the next sprint.*

---

## 4. Domain Models and DTOs

New DTOs were added to the `dto/` package to handle the conversion results.

### `ConvertedScriptDto.java`
Represents the final output of the conversion process.
- `migrationRunId`: The UUID of the original migration run.
- `convertedSql`: The full PostgreSQL-compatible SQL script.

---

## 5. The Core Engine — SqlConverter (Deep Dive)

**File**: `analyzer/SqlConverter.java`

This component is a stateless `@Component` that uses a multi-pass approach to transform SQL strings. It relies heavily on regular expressions to ensure accurate replacements with word boundaries and case-insensitivity.

### Phase 1: Data Type Conversions
The engine maps Oracle-specific types to their closest PostgreSQL equivalents.
- `VARCHAR2` / `NVARCHAR2` → `VARCHAR`
- `NUMBER` → `NUMERIC`
- `DATE` → `TIMESTAMP` (PostgreSQL `DATE` does not store time, whereas Oracle's does)
- `CLOB` → `TEXT`
- `BLOB` → `BYTEA`

### Phase 2: Function Rewriting
Proprietary Oracle functions are replaced with standard ANSI SQL or PostgreSQL-specific functions.
- `NVL(a, b)` → `COALESCE(a, b)`
- `SYSDATE` → `CURRENT_TIMESTAMP`
- `MINUS` → `EXCEPT`
- `SYS_GUID()` → `gen_random_uuid()`

### Phase 3: Sequence Syntax
Oracle's `sequence.NEXTVAL` syntax is rewritten to the PostgreSQL `NEXTVAL('sequence')` function call.
```java
Pattern p = Pattern.compile("(\\w+)\\.NEXTVAL", Pattern.CASE_INSENSITIVE);
// Result: seq_name.NEXTVAL -> NEXTVAL('seq_name')
```

### Phase 4: Manual Review Injection (Safety Net)
For constructs where an automated fix might change the query's semantics or is too complex for simple regex, the engine injects a comment.
- **Example**: `SELECT * FROM table WHERE ROWNUM <= 1`
- **Becomes**: `SELECT * FROM table WHERE /* TODO [MANUAL_REVIEW]: Oracle ROWNUM detected. Convert to LIMIT/OFFSET. */ ROWNUM <= 1`

This ensures that the DBA is alerted to sections of the code that require human oversight.

---

## 6. The Service Layer — SchemaService Updates

`SchemaService.java` was updated to orchestrate the conversion process and manage the new cache.

- `convert(UUID runId)`: Orchestrates the conversion by fetching raw SQL and calling the `SqlConverter`.
- `getConvertedScript(UUID runId)`: Retrieves a previously computed conversion from the cache.

---

## 7. The Controller — MigrationController Updates

Two new endpoints were added to expose the conversion functionality:

- `POST /api/v1/migrations/{id}/convert`: Triggers the conversion and returns the script in the JSON body.
- `GET /api/v1/migrations/{id}/converted-script`: Retrieves the converted script for a given run ID.

---

## 8. The Test Suite — SqlConverterTest.java

**File**: `test/.../analyzer/SqlConverterTest.java`

15 unit tests were implemented to verify the conversion logic across various scenarios:
- **CV-01 to CV-04**: Data type mapping accuracy.
- **CV-05 to CV-08**: Function replacement logic.
- **CV-09**: Sequence syntax transformation.
- **CV-10 to CV-14**: Correct injection of manual review comments for high-severity items.
- **CV-15**: End-to-end multi-line script transformation.

These tests ensure that the conversion engine remains reliable as more rules are added in future iterations.

---

## 9. The Postman Collection Update

The `MigrationPlayground.postman_collection.json` file now includes a folder for **Sprint 3 — Conversion Endpoints**.

### API-07 | Convert SQL
- **Method**: `POST`
- **Path**: `/api/v1/migrations/{{run_id}}/convert`
- **Purpose**: Performs the Oracle-to-PostgreSQL transformation.

### API-08 | Get Converted Script
- **Method**: `GET`
- **Path**: `/api/v1/migrations/{{run_id}}/converted-script`
- **Purpose**: Returns the result of a previous conversion.

> **Sprint 3 is complete.** The Conversion Engine provides a robust foundation for automated migrations, while the Manual Review Injection ensures high-risk patterns are never silently mis-converted. Sprint 4 will focus on persisting these results and building the React User Interface.
