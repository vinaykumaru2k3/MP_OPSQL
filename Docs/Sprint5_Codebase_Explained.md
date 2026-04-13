# Sprint 5 Codebase Explained: Validation Engine

This document provides a technical deep-dive into the core components implemented during **Sprint 5**. The primary goal was to establish a cross-database validation framework to ensure data integrity after migration from Oracle to PostgreSQL.

## 1. Validation Architecture

### 1.1 Data Persistence (`V2__add_validation_tables.sql`)
To support persistent validation results, we expanded the database schema:
- **`validation_results`**: Stores high-level metrics for a migration run (status, counts, timestamp). It shares the same ID as `migration_runs` (1:1 relationship).
- **`table_validation_metrics`**: Stores granular, table-level metrics (row counts, data type matching, null counts).

### 1.2 Domain Models
- **`ValidationResult`**: The aggregate root for validation data, linked to a `MigrationRun`.
- **`TableValidationMetric`**: Represents the comparison result for a single table.

## 2. Validation Engine (`ValidationService`)

The `ValidationService` is the heart of Sprint 5. It performs the following steps:
1. **Schema Parsing**: Uses the existing `SqlParser` to identify tables from the original Oracle SQL.
2. **Row Count Comparison**:
    - **`getSourceRowCount`**: Mocks source database access (Oracle). In this playground, it uses the local `JdbcTemplate` to simulate a source count.
    - **`getTargetRowCount`**: Queries the target PostgreSQL database to get the current row count for the migrated table.
3. **Status Assignment**: Sets the status to `PASSED` if all tables match, or `WARNING` if there are mismatches.
4. **Persistence**: Saves the full validation result and metrics to the database.

## 3. Frontend Enhancement

The **Analysis Dashboard** was upgraded with a dedicated "Validation Metrics" tab:
- **Summary Cards**: Visual indicators for "Tables Validated" and "Matches Found".
- **Real-Time Trigger**: A "Run Validation" button that calls the `/api/v1/migrations/{id}/validate` endpoint.
- **Detailed Table**: A comparison view showing source vs. target row counts with status icons (Checkmark/Alert).

## 4. API Endpoints
- **`POST /api/v1/migrations/{id}/validate`**: Triggers the validation process and returns the results.
- **`GET /api/v1/migrations/{id}/validation`**: Retrieves existing validation results for a specific run.

## 5. Verification
- **`ValidationServiceTest`**: A new test suite covering successful validation, row count mismatches, and error handling.
- **Frontend Build**: Verified with `npm run build` to ensure type safety and production readiness.
