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

## Phase 3: Live Schema Extraction Engine

- [ ] **Sprint 9: Dynamic Oracle JDBC Extractors**
  - [ ] **Maven Configurations**: Import the `ojdbc11` driver to the backend `pom.xml`.
  - [ ] **Data Hierarchy Upgrades**: Extend the `ParsedSchema` central models to encapsulate Oracle Indexes, Views, PK/FK Constraints, Stored Procedures, Triggers, and Sequences natively.
  - [ ] **Connector Configuration**: Sculpt the transient `OracleConnectionConfig` DTO handling host schemas while strictly enforcing ephemeral memory states for passwords.
  - [ ] **Extraction Engine**: Blueprint the `LiveSchemaExtractor` to systematically scan dictionaries (`ALL_TABLES`, `ALL_VIEWS`, `ALL_SOURCE`, etc.) dynamically translating object records straight into `ParsedSchema`.
  
- [ ] **Sprint 10: Connectivity Interface & Extracted Formatter**
  - [ ] **API Controller Node**: Configure the new backend router block `POST /api/v1/migrations/connect` returning standard `MigrationRun` formats bridging Oracle data securely to AST/Analyzer pipelines.
  - [ ] **Formatting Downstream Rules**: Rewrite the linear string formatting behavior inside `SqlConverter` ensuring completely extracted structural environments compile correctly into DDL ordered statements (Sequences -> Base Tables -> Indexes -> Keys -> Views).
  - [ ] **Frontend Network Panel**: Append a secondary input form to `Home.tsx` isolating direct db-socket credentials with cleanly separated visual routing hooks.
  - [ ] **Testing Emulation**: Map testing routines against an Oracle XE Docker container testing authentic JDBC extractions comprehensively prior to rollout.

## Phase 4: Production Deployment

- [ ] **Sprint 11: Free-Tier Cloud Architecture**
  - [ ] **Dockerisation**: Construct a multi-stage `Dockerfile` within the backend restricting JVM memory allocations (`-Xmx400m`) preventing Railway out-of-memory terminations.
  - [ ] **Environment Injection**: Strip cleartext database references in `application.properties` implementing parameterised `${DB_URL}` routing placeholders.
  - [ ] **CORS & Routing**: Reconfigure CORS policies passing dynamic `FRONTEND_URL` identifiers. Update frontend `migrationApi.ts` allowing dynamic `VITE_API_URL` routing mapping separated Vercel frontends to Railway backends.
  - [ ] **CI/CD Deployment Pipelines**: Alter GitHub Actions extending deploy steps specific to `main` branch merging (`railway up` & `vercel --prod`), injecting token secrets automatically scaling the playground live to the web.

## Phase 5: ETL Pipeline & Live Validation

- [ ] **Sprint 12: Dual-JDBC & Structural Diffing (Phase 5a)**
  - [ ] **Dual Connections**: Architect `@Primary` and secondary Spring `DataSource` beans concurrently bridging PostgreSQL and Oracle runtime properties natively.
  - [ ] **Schema Extraction Diff**: Expand the validation engine to scan both data dictionaries actively checking parity between generated structures and Oracle objects without reading rows.

- [ ] **Sprint 13: Spring Batch ETL MVP (Phase 5b)**
  - [ ] **Job Scaffolding**: Import `spring-boot-starter-batch` and configure the core JobRepository.
  - [ ] **Chunking Execution**: Configure `JdbcCursorItemReader` and `JdbcBatchItemWriter` chunking standard rows (<10,000 limits) between databases targeting a single primitive test table containing no LOBs or dependencies.

- [ ] **Sprint 14: Complex Semantics & Enterprise Scale (Phase 5c)**
  - [ ] **LOB Streaming**: Integrate `oracle.sql.CLOB` reader profiles handling large binary footprints avoiding JVM OutOfMemory crashes.
  - [ ] **Dependency Deferment**: Dynamically inject `SET CONSTRAINTS ALL DEFERRED` within transaction envelopes enabling disjointed Foreign Key pipeline processing.
  - [ ] **Semantics Transformation**: Establish `ItemProcessor` interceptors handling explicit Oracle `''` vs PostgreSQL `NULL` mappings and explicit numerical precisions mappings prior to PostgreSQL write phases.
