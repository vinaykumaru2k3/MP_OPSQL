# Migration Playground Development Checklist

Follow this living breakdown of tasks aligned with the 6-week sprint plan defined in the engineering specs. Mark `[ ]` to `[/]` for in-progress and `[x]` when completed.

- [x] **Sprint 1: Project Scaffold & Parser Engine** ✅ _Completed 2026-04-12_
  - [x] Initialize Spring Boot backend project (Dependencies: `web`, `data-jpa`, `postgresql`, `validation`, `lombok`)
  - [x] Configure `application.properties` (PostgreSQL config, 10MB multipart size limits, SLF4J logging)
  - [x] Implement `GlobalExceptionHandler` per the standard error response schema
  - [x] Create domain models (`Table`, `Column`, `Constraint`, `MigrationRun`)
  - [x] Implement `POST /api/v1/migrations/upload` to handle multipart SQL files
  - [x] Implement `SqlParser.java` using regex to extract CREATE TABLE blocks, columns, and constraints
  - [x] Write `SqlParserTest` achieving 70%+ JaCoCo coverage (Cases P-01 to P-11)
  - [x] Initialize `MigrationPlayground.postman_collection.json` with upload endpoints API-01 to API-04
  - [x] Provide sample Oracle SQL files for tests `sql/samples/sample_01_basic_ddl.sql`
  - [x] Create `docker-compose.yml` for local PostgreSQL database instance

- [x] **Sprint 2: Compatibility Analyzer** ✅ _Completed_
  - [x] Create `AnalysisReport` model and DTO
  - [x] Implement `CompatibilityAnalyzer.java` with the full conversion rules map (Data Types, Functions, Subqueries, PL/SQL)
  - [x] Ensure HIGH, MEDIUM, LOW severity tracking is correctly applied
  - [x] Write `CompatibilityAnalyzerTest.java` (Cases A-01 to A-15)
  - [x] Implement `POST /api/v1/migrations/{id}/analyze`
  - [x] Implement `GET /api/v1/migrations/{id}/analysis`
  - [x] Add analyzer endpoints to Postman collection

- [x] **Sprint 3: Conversion Engine** ✅ _Completed 2026-04-13_
  - [x] Create `ConvertedScript` model and DTO
  - [x] Implement `SqlConverter.java` for string replacements and context-aware transformations (`NVL` -> `COALESCE`, `NVL2` -> `CASE`, `ROWNUM` -> `LIMIT`)
  - [x] Prevent auto-conversion on HIGH-severity unimplemented constructs (add manual review comments instead)
  - [x] Implement String Literal Masking for Enterprise Resilience (Hardening: `SqlParser`, `CompatibilityAnalyzer`, `SqlConverter`)
  - [x] Write `SqlConverterTest` (Cases CV-01 to CV-18)
  - [x] Implement `POST /api/v1/migrations/{id}/convert` endpoint
  - [x] Implement `GET /api/v1/migrations/{id}/converted-script` (returns `text/plain` SQL)
  - [x] Add conversion endpoints to Postman collection

- [ ] **Sprint 4: Database Persistence & React UI Scaffold**
  - [ ] Add Flyway dependency and script `V1__initial_schema.sql` through `V5`
  - [ ] Integrate Repositories: `MigrationRunRepository`, `AnalysisReportRepository`, `ConvertedScriptRepository`
  - [ ] Refactor Services to securely persist outputs in PostgreSQL
  - [ ] **Technical Debt:** Remove the temporary in-memory SQL cache from `SchemaService` (added in Sprint 2) and persist raw files to PostgreSQL/File System
  - [ ] Initialize React frontend in `/frontend` directory (`npx create-react-app` or Vite)
  - [ ] Set up frontend `.env.local` to point to `REACT_APP_API_BASE_URL`
  - [ ] Build **Home & Upload UI** (react-dropzone integration)
  - [ ] Build **Analysis Dashboard UI** (Metrics and severity grouped charts using `recharts`)

- [ ] **Sprint 5: Validation Engine**
  - [ ] Create `ValidationResult` domain model and Repository
  - [ ] Implement `ValidationService` using dynamic JDBC context to connect to both Oracle AND PostgreSQL
  - [ ] Execute `Row Count`, `Null Count`, and `Data Type` matching between both databases
  - [ ] Write `ValidationServiceTest.java` (Cases V-01 to V-08)
  - [ ] Implement `POST /api/v1/migrations/{id}/validate`
  - [ ] Add Validation table and metric UI to the React frontend

- [ ] **Sprint 6: Polish, Export, & Hardening**
  - [ ] Implement `GET /api/v1/migrations/{id}/report` to return fully aggregated run record
  - [ ] Implement `GET /api/v1/migrations/{id}/export/pdf` (Generate PDF blob)
  - [ ] Implement `GET /api/v1/migrations/{id}/export/json` (File download)
  - [ ] Polish React logic (Include split-view preview of Oracle vs Converted Postgres DB)
  - [ ] Complete End-to-End Postman testing (API-01 to API-12)
  - [ ] Source Audit: Remove any `System.out.println` or `printStackTrace`
  - [ ] Ensure all local setup `docker-compose.yml` specs are working accurately
