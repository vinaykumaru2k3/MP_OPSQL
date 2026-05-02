# Sprint 5 Implementation Plan: Validation Engine

The goal of Sprint 5 is to implement a **Validation Engine** that performs row count and data integrity checks between Oracle and PostgreSQL databases after a migration run.

## Proposed Changes

### 1. Database Persistence
- Create `V2__add_validation_tables.sql` for Flyway.
- **New Tables**:
    - `validation_results`: Summarized validation for a `migration_run`.
    - `table_validation_metrics`: Individual table metrics (row counts, null counts, data type matches).

### 2. Domain Models & Repositories
- `com.schemaforge.model.ValidationResult`: Entity for the validation summary.
- `com.schemaforge.model.TableValidationMetric`: Entity for per-table metrics.
- `com.schemaforge.repository.ValidationResultRepository`: For saving validation outcomes.

### 3. Service Layer
- **`ValidationService.java`**:
    - Implement `validateMigration(UUID migrationId)`.
    - Handle dynamic JDBC connections to Oracle and PostgreSQL.
    - Execute validation queries:
        - `SELECT count(*) FROM table` (Both).
        - `SELECT count(*) FROM table WHERE col IS NULL` (Optional).
        - Check schema mapping success.

### 4. API Layer
- `POST /api/v1/migrations/{id}/validate`: Trigger the validation process.
- `GET /api/v1/migrations/{id}/validation`: Retrieve validation results.

### 5. Frontend (React UI)
- Add a **Validation Dashboard** tab or section.
- Display a summary table of table-by-table comparisons.
- Color-coded "MATCH" / "MISMATCH" indicators for row counts.

## Implementation Details

### Validation Workflow:
1. Client calls `/validate`.
2. Service retrieves the `MigrationRun` and `ParsedSchema`.
3. For each table in `ParsedSchema`:
    - Fetch row count from Oracle (Source).
    - Fetch row count from PostgreSQL (Target).
    - Compare and save as `TableValidationMetric`.
4. Update `ValidationResult` status.

## Verification Plan

### Backend Unit Tests:
- `ValidationServiceTest.java`:
    - Mock JDBC templates for Oracle/PostgreSQL.
    - Test row count comparison logic.
    - Test error handling for connection failures.

### Frontend Manual Check:
- Upload `sample_01_basic_ddl.sql`.
- Run conversion and analyze.
- Run validation and ensure metrics are displayed correctly in the UI.
