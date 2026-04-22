# Migration Playground - Phase 2 Development Checklist

Following the completion of Sprints 1-6, this document details Phase 2. Phase 2 prioritizes hardening, security, refactoring, and addressing architectural limitations before expanding into comprehensive enterprise features.

Mark `[ ]` to `[/]` for in-progress and `[x]` when completed.

## Phase 2: System Hardening & Enterprise Upgrades

- [ ] **Sprint 7: Security Settings, Bug Fixes & Refactoring (Quality Focus)**
  - [ ] **Security**: Remove plaintext database credentials from `application.properties`. Use environment variable placeholders (e.g., `${DB_URL}`).
  - [ ] **Security**: Add `application.properties` to `.gitignore` and create an `application.properties.example` template.
  - [ ] **Cleanup**: Add backend build output artifacts (`compile_out.txt`, `test_out.txt`) to `.gitignore`.
  - [ ] **CI Quality Gate**: Update `pom.xml` to include JaCoCo test coverage enforcement (fail build if below 70%).
  - [ ] **Refactoring**: Break down the `SchemaService` God Class into `MigrationRunService` (lifecycle management) and `ReportService` (aggregation & PDF/JSON exports). Retain `SchemaService` purely for orchestration.
  - [ ] **Validation Bug**: Fix the idempotency check in `ValidationService` (`existsById(migrationId)`) to correctly correspond to the `ValidationResult` primary key configuration.
  - [ ] **Parser Fix**: Update `SqlConverter` string replacement for `DATE` to use targeted regex ensuring it only applies to column definitions rather than sweeping replacements across constraints and string literals.
  - [ ] **Frontend Robustness**: Address silent error swallowing in `Dashboard.tsx` (`getAnalysis` failing then falling back to `analyze`). Expose correct failure states explicitly to the UI.

- [ ] **Sprint 8: Enterprise Architecture Upgrades**
  - [ ] **AST Parsing (v2.0)**: Replace the fragile regex string-split logic in `SqlParser` with the `JSQLParser` library to natively process complex dot-qualified names, multi-schema variables, and complex constructs securely.
  - [ ] **Authentication**: Implement Spring Security + JWT. Create a stateless authentication filter and secure all API routes under an admin role, resolving limitations marked in Phase 1.
  - [ ] **Frontend Modernization**: Refactor out manual `useState`/`useEffect` logic within `Dashboard.tsx` by integrating React Query (TanStack) to handle robust data-caching, fetch deduplication, and structured retries.
  - [ ] **Data Diff UI**: Construct a Migration History Diff view on the frontend that natively surfaces differential updates when a user uploads two sequential iterations of the same SQL file.
  - [ ] **Live Validation DB**: Evolve the mock `ValidationService` to a dual-JDBC connector. Connect the backend logic to the local containerized PostgreSQL instance alongside an emulated Oracle instance for live production data verification.
