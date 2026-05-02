# Phase 2 Development Plan: SchemaForge

*This document serves as an exhaustive architectural reference and execution guide for Phase 2, directly resolving technical debt elements and scaling the prototype to an enterprise-grade utility.*

---

## 1. Security & Configuration Hardening
**Current Limitation**: `application.properties` holds active database credentials in plaintext, which introduces severe security vulnerabilities when pushed to source control.
**Action Plan**:
* Replace direct values with injected environment variables falling back to defaults:
  ```properties
  spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/migration_db}
  spring.datasource.username=${DB_USER:migration_user}
  spring.datasource.password=${DB_PASS:migration_pass}
  ```
* Add `application.properties` to `.gitignore`.
* Scaffold an `application.properties.example` file that devs can securely clone.

---

## 2. CI/CD Enforcements
**Current Limitation**: Build artifacts are tracked, and CI accepts PRs without verifying testing thresholds.
**Action Plan**:
* Verify `.gitignore` ignores dynamically generated text fragments (`compile_out.txt`, `test_out.txt`).
* Alter `pom.xml` to weave JaCoCo threshold rules (Minimum 70% branch/line coverage). The Maven plugin should be explicitly mapped to the `check` goal, causing GitHub Actions to fail if test criteria slip below 70%.

---

## 3. Disassembling the God Class
**Current Limitation**: `SchemaService` violates the Single Responsibility Principle, amassing logic for uploading, file scanning, format analyzing, PDF templating, JSON exporting, and validation.
**Action Plan**:
Split parsing logic and export logic from orchestration:
1. **`MigrationRunService`**: Handshakes with AWS/File processing to register sessions.
2. **`ReportService`**: Dedicated to formatting metrics to OpenPDF standard models and generating JSON data blobs.
3. **`SchemaService`**: Functions solely as a coordinator interface that passes IDs between analyzers and formatters.

---

## 4. AST Transformation over Fragile Regex
**Current Limitation**: The engine isolates SQL blocks via linear string mutations: `(?i)CREATE\\s+TABLE\\s+`. It aggressively collapses under dot-qualified clauses (`CREATE TABLE hr.employees`) or complex views.
**Action Plan / Refactor**: 
* Incorporate [JSQLParser](https://github.com/JSQLParser/JSqlParser). 
* Construct Visitors (`StatementVisitor`, `SelectVisitor`) to safely walk through valid AST trees instead of blindly scrubbing files. This upgrades the component from a "smart regex parser" to a genuine syntactic compiler pipeline.

---

## 5. Refining Translation Algorithms
**Current Limitation**: Global regex string-rewriting replaces `DATE` uniformly to `TIMESTAMP`. This sweeps up literal references or defaults (e.g., `DEFAULT CURRENT_DATE`).
**Action Plan**: 
* Constrain type rewrite algorithms to fire exclusively under column-type mapping constraints vs un-scoped global file modifications (this will be greatly aided by implementing JSQLParser in Action #4).

---

## 6. Realizing Frontend Resiliency
**Current Limitation**: In `Dashboard.tsx`, silent try-catch ingestion triggers subsequent function loops (`getAnalysis()` falls back to `analyze()`), hiding 500 triggers.
**Action Plan**: 
* Install `@tanstack/react-query`. 
* Deprecate the cascading `useEffect` dependencies, relying heavily on `useQuery`'s strict `staleTime`, structured HTTP code interception, error boundary configurations, and fallback cache. 

---

## 7. Migration Idempotency Bug
**Current Limitation**: In `ValidationService`, attempting to protect duplicate validation entries employs `validationResultRepository.existsById(migrationId)`. 
**Action Plan**: 
* Confirm the `ValidationResult` target maps cleanly to `@Id UUID id`. If so, restructure the lookup mapping to invoke an explicit relational key `existsByMigrationRunId(migrationId)`. 

---

## 8. Enterprise Feature Epics
* **Spring Security Authorization**: Shielding logic under Stateless JWT protocol arrays.
* **Dual-JDBC Test Harness**: Deprecating the `ValidationService` local hashing structure to a genuine `DataSource` pooling architecture, linking Oracle Emulations concurrently against target Postgres models.
* **Progressive UI History**: Rendering comparative text diffs sequentially tracking Oracle mutations between file-runs in React.
