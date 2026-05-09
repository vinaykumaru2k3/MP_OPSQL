# SchemaForge - Phase 2 Development Checklist

Following the completion of Sprints 1-6, this document details Phase 2. Phase 2 prioritizes hardening, security, refactoring, and addressing architectural limitations before expanding into comprehensive enterprise features.

Mark `[ ]` to `[/]` for in-progress and `[x]` when completed.

## Phase 2: System Hardening & Enterprise Upgrades

- [ ] **Sprint 7: Security Settings, Bug Fixes & Refactoring (Quality Focus)**
  - [x] **Security**: Remove plaintext database credentials from `application.properties`. Use environment variable placeholders (e.g., `${DB_URL}`).
  - [x] **Security**: Add `application.properties` to `.gitignore` and create an `application.properties.example` template.
  - [x] **Cleanup**: Add backend build output artifacts (`compile_out.txt`, `test_out.txt`) to `.gitignore`.
  - [x] **CI Quality Gate**: Update `pom.xml` to include JaCoCo test coverage enforcement (fail build if below 70%).
  - [x] **Refactoring**: Break down the `SchemaService` God Class into `MigrationRunService` (lifecycle management) and `ReportService` (aggregation & PDF/JSON exports). Retain `SchemaService` purely for orchestration.
  - [x] **Validation Bug**: Fix the idempotency check in `ValidationService` (`existsById(migrationId)`) to correctly correspond to the `ValidationResult` primary key configuration.
  - [x] **Parser Fix**: Update `SqlConverter` string replacement for `DATE` to use targeted regex ensuring it only applies to column definitions rather than sweeping replacements across constraints and string literals.
  - [x] **Frontend Robustness**: Address silent error swallowing in `Dashboard.tsx` (`getAnalysis` failing then falling back to `analyze`). Expose correct failure states explicitly to the UI.

- [x] **Sprint 8: Enterprise Architecture Upgrades**
  - [x] **AST Parsing (v2.0)**: Replace the fragile regex string-split logic in `SqlParser` with the `JSQLParser` library to natively process complex dot-qualified names, multi-schema variables, and complex constructs securely.
  - [x] **Authentication**: Implement Spring Security + JWT. Create a stateless authentication filter and secure all API routes under an admin role, resolving limitations marked in Phase 1.
  - [x] **Frontend Modernization**: Refactor out manual `useState`/`useEffect` logic within `Dashboard.tsx` by integrating React Query (TanStack) to handle robust data-caching, fetch deduplication, and structured retries.
  - [x] **Data Diff UI**: Construct a Migration History Diff view on the frontend that natively surfaces differential updates when a user uploads two sequential iterations of the same SQL file.
## Phase 3: Live Schema Extraction Engine

- [x] **Sprint 9: Dynamic Oracle JDBC Extractors**
  - [x] **Maven Configurations**: Import the `ojdbc11` driver to the backend `pom.xml`.
  - [x] **Data Hierarchy Upgrades**: Extend the `ParsedSchema` central models to encapsulate Oracle Indexes, Views, PK/FK Constraints, Stored Procedures, Triggers, and Sequences natively.
  - [x] **Connector Configuration**: Sculpt the transient `OracleConnectionConfig` DTO handling host schemas while strictly enforcing ephemeral memory states for passwords.
  - [x] **Extraction Engine**: Blueprint the `LiveSchemaExtractor` to systematically scan dictionaries (`ALL_TABLES`, `ALL_VIEWS`, `ALL_SOURCE`, etc.) dynamically translating object records straight into `ParsedSchema`.
  
- [x] **Sprint 10: Connectivity Interface & Extracted Formatter**
  - [x] **API Controller Node**: Configure the new backend router block `POST /api/v1/migrations/connect` returning standard `MigrationRun` formats bridging Oracle data securely to AST/Analyzer pipelines.
  - [x] **Formatting Downstream Rules**: Rewrite the linear string formatting behavior inside `SqlConverter` ensuring completely extracted structural environments compile correctly into DDL ordered statements (Sequences -> Base Tables -> Indexes -> Keys -> Views).
  - [x] **Frontend Network Panel**: Added "Live Database" tab to the Upload page isolating direct db-socket credentials with cleanly separated visual routing hooks.
  - [x] **Testing Emulation**: Unit test stub created for `LiveSchemaExtractor` (Oracle XE Docker integration deferred to pre-rollout testing phase).
  - [ ] **Live Validation DB**: _(Deferred to Phase 5 — Sprint 12 dual-JDBC implementation)_

## Phase 3.5: Live DB End-to-End Testing

- [ ] **Sprint 10.5: Oracle Free Test Environment**
  - [x] **Docker Compose**: Spin up `gvenzl/oracle-free:23-slim-faststart` with `schemaforge` APP_USER and `FREEPDB1` PDB in `docker/oracle-test/`.
  - [x] **V1 — Sequences**: `seq_customer_id`, `seq_category_id`, `seq_product_id`, `seq_order_id`, `seq_order_item_id`, `seq_audit_id`.
  - [x] **V2 — Tables**: 6 tables covering VARCHAR2, NUMBER, DATE, TIMESTAMP, CLOB, BLOB with PK, FK (incl. self-referencing), UNIQUE, and CHECK constraints.
  - [x] **V3 — Indexes**: 13 performance indexes beyond PK/UNIQUE.
  - [x] **V4 — Views**: 3 views (`vw_order_summary`, `vw_product_catalog`, `vw_low_stock_alert`) using Oracle scalar subqueries and OUTER JOINs.
  - [x] **V5 — Stored Procedures**: 3 PL/SQL procedures with EXCEPTION handling, FOR UPDATE cursors, and COMMIT/ROLLBACK.
  - [x] **V6 — Triggers**: 5 triggers — BEFORE INSERT auto-ID from sequences, AFTER UPDATE/DELETE audit capture.
  - [x] **V7 — Seed Data**: Realistic e-commerce data across all tables.
  - [x] **Live Extraction Test**: Run `POST /connect` from the frontend and verify the dashboard shows all 6 tables, sequences, views, and stored programs.
  - [x] **Conversion Validation**: Run the full Analyze → Convert pipeline on the LIVE_DB run and verify FK `REFERENCES` clauses are correctly emitted.

## Phase 4: SaaS & Enterprise Readiness

- [ ] **Sprint 11: Multi-Tenant Architecture & Auth Expansion**
  - [ ] **User Entities**: Create `User` JPA entity and update `MigrationRun` to have a `@ManyToOne` relationship with `User`.
  - [ ] **Registration Flow**: Add `POST /api/v1/auth/register` and `POST /api/v1/auth/login` endpoints. Remove hardcoded `admin` credentials from `SecurityConfig`.
  - [ ] **Data Isolation**: Update `MigrationRunRepository` queries to filter by the authenticated user's ID. Update services to verify ownership before accessing runs.
  - [ ] **Frontend Auth**: Build a true registration/login flow, store the JWT securely, and integrate with the frontend API client.

- [ ] **Sprint 12: Projects, Workspaces & UX Optimization**
  - [ ] **Projects Hierarchy**: Create a `Project` entity (`User` has many `Project`s, `Project` has many `MigrationRun`s).
  - [ ] **Saved Database Profiles**: Create a `DatabaseProfile` entity to securely store connection strings (with encrypted passwords) linked to a `User` or `Project`.
  - [ ] **Pagination API**: Update `GET /api/v1/migrations/history` to use Spring Data `Pageable` (e.g., `?page=0&size=10`).
  - [ ] **History UI Update**: Implement pagination controls in the `Dashboard` History tab to handle thousands of runs without memory bloat.

- [ ] **Sprint 13: Advanced Engine Configs & Throttling**
  - [ ] **Granular Live Extraction**: Update `POST /connect` DTO and `LiveSchemaExtractor` to accept include/exclude filters (e.g., specific tables, ignore views).
  - [ ] **Custom Type Mappings**: Expose a configuration payload in the `/convert` endpoint allowing users to override default mappings (e.g., `NUMBER` -> `NUMERIC` vs `INTEGER`).
  - [ ] **Rate Limiting**: Implement a basic rate limiter filter (e.g., using Bucket4j) to prevent abuse of the `/connect` and `/upload` endpoints.
  - [ ] **File Size Enforcement**: Add strict multi-part file size limits (e.g., 5MB max) in `application.properties` and handle `MaxUploadSizeExceededException` gracefully.

## Phase 5: Production Deployment

- [ ] **Sprint 14: Free-Tier Cloud Architecture**
  - [ ] **Dockerisation**: Construct a multi-stage `Dockerfile` within the backend restricting JVM memory allocations (`-Xmx400m`) preventing Railway out-of-memory terminations.
  - [ ] **Environment Injection**: Strip cleartext database references in `application.properties` implementing parameterised `${DB_URL}` routing placeholders.
  - [ ] **CORS & Routing**: Reconfigure CORS policies passing dynamic `FRONTEND_URL` identifiers. Update frontend `migrationApi.ts` allowing dynamic `VITE_API_URL` routing mapping separated Vercel frontends to Railway backends.
  - [ ] **CI/CD Deployment Pipelines**: Alter GitHub Actions extending deploy steps specific to `main` branch merging (`railway up` & `vercel --prod`), injecting token secrets automatically scaling the playground live to the web.

## Phase 6: ETL Pipeline & Live Validation

- [ ] **Sprint 15: Dual-JDBC & Structural Diffing (Phase 6a)**
  - [ ] **Dual Connections**: Architect `@Primary` and secondary Spring `DataSource` beans concurrently bridging PostgreSQL and Oracle runtime properties natively.
  - [ ] **Schema Extraction Diff**: Expand the validation engine to scan both data dictionaries actively checking parity between generated structures and Oracle objects without reading rows.

- [ ] **Sprint 16: Spring Batch ETL MVP (Phase 6b)**
  - [ ] **Job Scaffolding**: Import `spring-boot-starter-batch` and configure the core JobRepository.
  - [ ] **Chunking Execution**: Configure `JdbcCursorItemReader` and `JdbcBatchItemWriter` chunking standard rows (<10,000 limits) between databases targeting a single primitive test table containing no LOBs or dependencies.

- [ ] **Sprint 17: Complex Semantics & Enterprise Scale (Phase 6c)**
  - [ ] **LOB Streaming**: Integrate `oracle.sql.CLOB` reader profiles handling large binary footprints avoiding JVM OutOfMemory crashes.
  - [ ] **Dependency Deferment**: Dynamically inject `SET CONSTRAINTS ALL DEFERRED` within transaction envelopes enabling disjointed Foreign Key pipeline processing.
  - [ ] **Semantics Transformation**: Establish `ItemProcessor` interceptors handling explicit Oracle `''` vs PostgreSQL `NULL` mappings and explicit numerical precisions mappings prior to PostgreSQL write phases.

## Phase 7: Future Enhancements

- [ ] **Sprint 18: Persistence Layer Robustness**
  - [ ] **Database Column Sizing**: Audit and update all `MigrationRun` JPA entities to explicitly use `@Lob` or `columnDefinition="TEXT"` for `originalSql` and `convertedSql` fields. This ensures the Neon database can support massive enterprise SQL payloads without string-truncation crashes.
