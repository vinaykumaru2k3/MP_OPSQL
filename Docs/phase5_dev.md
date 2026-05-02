# Phase 5 Development Plan: ETL Pipeline & Live Validation

*This document scales the SchemaForge from a static Schema Advisor into a stateful, dual-connected Data Migration Engine. This is a significant architectural leap moving from generating DDL text to executing live, transactional data mutations.*

---

## Strategic Shift: Target DB Ownership
To avoid hosting complex infrastructure, this tool operates on a **"Bring Your Own Database" (BYOD)** model. 
1. The user connects to the Source Oracle DB.
2. The user generates the DDL script via the existing engine.
3. The user manually executes the DDL script on their Target PostgreSQL DB.
4. The user provides the tool with BOTH connection strings.
5. The tool performs Dual-JDBC structural validation and Spring Batch data migration.

---

## Sub-Phase 5a: Real Structural Validation (No Data Movement)
Before moving terabytes of state, the system will explicitly validate schema parity between both live environments.

### Architectural Execution
* **Dual-JDBC Configuration:** Implement `@Primary` and `@Qualifier` Spring bindings to maintain concurrent Oracle (`ojdbc11`) and PostgreSQL (`org.postgresql.Driver`) `DataSource` pools.
* **Schema Diff Engine:** Read data dictionaries simultaneously from both connections. Compare:
  * Table existence
  * Column name and data type matching (e.g., `NUMBER(10,2)` mapped exactly to `NUMERIC(10,2)`)
  * Constraint presence (PK, FK, Unique constraints)
* **Status Indication:** Return a genuine `ValidationResult` matrix confirming exactly what exists in Postgres vs Oracle without executing a single `INSERT` statement.

---

## Sub-Phase 5b: Spring Batch ETL (The MVP)
Build the chunked read-write loop using Spring Batch. We explicitly constrain the MVP to simple tables: **No LOBs, No Foreign Keys, < 10,000 rows.**

### Architectural Execution
* **Spring Batch Bootstrapping:** Define a `JobLauncher` with a single step.
* **Chunking Configuration:** Set the chunk threshold (e.g., `500` rows) utilizing standard `JdbcCursorItemReader` (Extract) and `JdbcBatchItemWriter` (Load).
* **Rollback & Restart Mechanisms:** Rely on Spring Batch's native `JobRepository` to track the state of the job natively, allowing restart-from-checkpoint if rows fail.

---

## Sub-Phase 5c: Advanced Constraints & Semantics (The Reality of ETL)
Once the MVP chunk-loop proves stable, layer in the complex database semantics required for enterprise data integrity.

### 1. Complex Memory Streaming (LOBs)
* **The Problem:** Oracle `CLOB`/`BLOB` cannot be loaded natively via simple `ResultSet.getString()`.
* **The Solution:** Implement explicit `oracle.sql.CLOB` and `oracle.sql.BLOB` stream handlers natively inside the Spring Batch `ItemProcessor`. Buffer large binaries to disk temporarily if chunk thresholds risk JVM Out-Of-Memory exceptions.

### 2. Constraint Deferment (Foreign Keys)
* **The Problem:** If `Table A` depends on `Table B`, concurrent or unordered data loads will trigger blocking constraint violations.
* **The Solution:** Leverage PostgreSQL's native capability by executing `SET CONSTRAINTS ALL DEFERRED` within the Spring Batch transaction context. This pushes constraint checks to the end of the transaction rather than row-by-row.

### 3. NULL Semantics & Precision Traps
* **The Problem:** Oracle evaluates empty strings (`''`) as `NULL`. PostgreSQL evaluates `''` as a distinct empty string. Oracle `NUMBER` evaluates to arbitrary precision, crashing PostgreSQL `NUMERIC` targets.
* **The Solution:** Construct a semantic translation layer within the `ItemProcessor`. Actively mutate empty strings mapped from Oracle `VARCHAR2` into explicit `NULL` representations before writing. Enforce precision boundaries checking before pushing `BigDecimal` values over the wire.
