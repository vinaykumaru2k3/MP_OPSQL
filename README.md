# Migration Playground

**Oracle-to-PostgreSQL Migration Assistant**

A full-stack enterprise application that automates the detection, analysis, and conversion of Oracle SQL schemas and scripts into PostgreSQL-compatible equivalents. Built with Spring Boot and React, it is designed for database engineers, developers, and architects managing real-world database migrations.

---

## Table of Contents

- [What This Tool Does](#what-this-tool-does)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [1. PostgreSQL Setup](#1-postgresql-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Docker (Optional)](#4-docker-optional)
- [Configuration Reference](#configuration-reference)
- [API Reference](#api-reference)
- [Core Modules](#core-modules)
- [Oracle-to-PostgreSQL Conversion Rules](#oracle-to-postgresql-conversion-rules)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Sprint Plan](#sprint-plan)
- [Limitations and Known Gaps](#limitations-and-known-gaps)
- [Contributing](#contributing)

---

## What This Tool Does

Oracle-to-PostgreSQL migrations are error-prone and require specialist knowledge. Incompatibilities in data types, functions, sequences, constraints, and procedural syntax create hidden bugs that are costly to diagnose manually.

Migration Playground solves this by accepting an Oracle `.sql` file and automatically:

1. Parsing the file to extract all tables, columns, constraints, and SQL constructs
2. Detecting every Oracle-specific construct incompatible with PostgreSQL
3. Assigning a severity level — `HIGH`, `MEDIUM`, or `LOW` — to each incompatibility
4. Generating a converted PostgreSQL script with all detectable issues automatically rewritten
5. Flagging constructs that require manual rewriting, such as PL/SQL packages and `CONNECT BY` hierarchical queries
6. Optionally validating migrated data by comparing row counts, null counts, and data types between the source Oracle database and the target PostgreSQL database
7. Exporting the full analysis report as JSON or PDF

**Who is this for:**

| Use Case | Benefit |
|---|---|
| DBAs migrating Oracle databases to PostgreSQL | Automated incompatibility analysis instead of manual line-by-line review |
| Developers writing Oracle SQL for systems being migrated | Catch incompatibilities before committing code |
| Architects estimating migration effort | Use severity counts to estimate complexity and required effort |
| Students learning PostgreSQL from Oracle | Side-by-side Oracle vs. PostgreSQL syntax comparison |

---

## System Architecture

The application follows a strict layered architecture. No layer bypasses another.

```
  React Frontend
       |
       | HTTP / REST (/api/v1)
       |
  Spring Boot Backend  (Controllers -> Services -> DTOs)
       |
  Core Engine Layer
       |-- SqlParser              Tokenizes Oracle SQL into structured schema
       |-- CompatibilityAnalyzer  Detects incompatibilities and assigns severity
       |-- SqlConverter           Rewrites Oracle constructs to PostgreSQL equivalents
       |-- ValidationService      Compares source Oracle DB vs target PostgreSQL DB
       |
  PostgreSQL Storage Layer  (Reports, runs, scripts, validation results)
```

**Component Interaction Rules:**

- Controllers call Services only — never Repositories or Parsers directly
- Services orchestrate Parsers, Analyzers, and Converters — they own all business logic
- Parsers, Analyzers, and Converters are stateless utility components
- Repositories handle data persistence only — no business logic lives here
- DTOs are used at controller boundaries; domain models are internal

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Language | Java 17 LTS |
| Backend Framework | Spring Boot 3.2.x |
| Build Tool | Maven 3.8+ |
| Storage | PostgreSQL 15+ |
| Schema Management | Flyway |
| Logging | SLF4J with Logback |
| Testing | JUnit 5, Mockito, JaCoCo |
| Frontend Language | JavaScript (Node 18 LTS) |
| Frontend Framework | React |
| HTTP Client | Axios |
| File Upload | react-dropzone |
| Charts | Recharts |
| Routing | React Router |

---

## Repository Structure

```
migration-playground/
|-- backend/                          Spring Boot project
|   |-- src/main/java/com/migrationplayground/
|   |   |-- controller/               REST endpoints
|   |   |-- service/                  Business logic orchestration
|   |   |-- parser/                   SqlParser - regex-based SQL tokenizer
|   |   |-- analyzer/                 CompatibilityAnalyzer - rule-based detection
|   |   |-- converter/                SqlConverter - Oracle to PostgreSQL rewriter
|   |   |-- model/                    Domain models (Table, Column, Constraint, MigrationRun)
|   |   |-- repository/               JPA repositories for persistence
|   |   |-- dto/                      Request/response DTOs
|   |   `-- exception/                GlobalExceptionHandler + ApiErrorResponse
|   |-- src/main/resources/
|   |   |-- application.properties
|   |   `-- db/migration/             Flyway versioned scripts (V1 through V5)
|   |-- src/test/                     JUnit 5 unit tests
|   `-- pom.xml
|-- frontend/                         React project (Sprint 4+)
|   |-- src/
|   `-- package.json
|-- sql/
|   |-- schema.sql                    Full PostgreSQL schema (generated from Flyway scripts)
|   `-- samples/                      Oracle SQL test files for parser and analyzer testing
|-- Docs/                             Project specification and engineering guides
|   |-- migration-playground-spec.docx
|   |-- migration-companion.docx
|   |-- migration-engineering-guide.docx
|   `-- diagrams/                     Sprint workflow diagrams
|-- tasks.md                          Sprint task checklist
`-- README.md
```

---

## Prerequisites

Install and verify all of the following before proceeding.

| Tool | Minimum Version | Purpose |
|---|---|---|
| Java (JDK) | 17 LTS | Backend runtime |
| Maven | 3.8+ | Build tool |
| Node.js | 18 LTS | React frontend runtime |
| PostgreSQL | 15+ | Storage layer |
| Git | 2.x | Version control |
| Postman | Latest | API testing |
| Docker Desktop | Latest | Optional: Oracle XE container |

Verify installations:

```bash
java -version    # openjdk version "17.x.x"
mvn -version     # Apache Maven 3.x.x
node -v          # v18.x.x
psql --version   # psql (PostgreSQL) 15.x
git --version    # git version 2.x.x
```

---

## Local Setup

### 1. PostgreSQL Setup

Start the PostgreSQL service:

```bash
# macOS (Homebrew)
brew services start postgresql@15

# Ubuntu / Debian
sudo systemctl start postgresql
```

Create the database and user:

```sql
psql -U postgres

CREATE DATABASE migration_db;
CREATE USER migration_user WITH ENCRYPTED PASSWORD 'migration_pass';
GRANT ALL PRIVILEGES ON DATABASE migration_db TO migration_user;
\q
```

Apply the schema:

```bash
psql -U migration_user -d migration_db -f sql/schema.sql

# Verify tables:
psql -U migration_user -d migration_db -c "\dt"
# Expected: migration_runs, analysis_reports, converted_scripts, validation_results
```

### 2. Backend Setup

```bash
git clone https://github.com/vinaykumaru2k3/MP_OPSQL.git
cd MP_OPSQL/backend

# Build, skipping tests on first run
mvn clean install -DskipTests

# Start the server
mvn spring-boot:run
```

The server starts at `http://localhost:8080`. Verify:

```bash
curl http://localhost:8080/api/v1/migrations
# Expected: HTTP 200, response body: []
```

Configure `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/migration_db
spring.datasource.username=migration_user
spring.datasource.password=migration_pass
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
server.port=8080
logging.level.com.migrationplayground=DEBUG
logging.file.name=logs/migration-tool.log
```

### 3. Frontend Setup

```bash
cd frontend
npm install
echo 'REACT_APP_API_BASE_URL=http://localhost:8080/api/v1' > .env.local
npm start
# Opens at http://localhost:3000
```

### 4. Docker (Optional)

A `docker-compose.yml` is provided to run PostgreSQL locally and optionally Oracle XE for validation testing.

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Stop all services
docker-compose down
```

The Oracle XE container (`gvenzl/oracle-xe:21-slim`) is only required during Sprint 5 validation testing. Skip it until then.

---

## Configuration Reference

| Variable | Default | Description | Required |
|---|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/migration_db` | PostgreSQL JDBC URL | Yes |
| `DB_USER` | `migration_user` | Database username | Yes |
| `DB_PASS` | `migration_pass` | Database password | Yes |
| `SERVER_PORT` | `8080` | Spring Boot port | No |
| `MAX_FILE_SIZE` | `10MB` | Max SQL file upload size | No |
| `LOG_LEVEL` | `DEBUG` | Application log level | No |
| `REACT_APP_API_BASE_URL` | `http://localhost:8080/api/v1` | Frontend API base URL | Yes (Frontend) |

---

## API Reference

Base URL: `http://localhost:8080/api/v1`

All requests and responses use `application/json` unless noted. File uploads use `multipart/form-data`. Downloads respond with `text/plain` or `application/pdf`.

### Migration Runs

| Method | Endpoint | Description | Request | Response |
|---|---|---|---|---|
| `POST` | `/migrations/upload` | Upload Oracle SQL file and create migration run | `multipart/form-data` (file, file_name) | `201` MigrationRun object |
| `GET` | `/migrations` | List all migration runs | — | `200` Array of MigrationRun |
| `GET` | `/migrations/{id}` | Get a single migration run | — | `200` MigrationRun object |
| `DELETE` | `/migrations/{id}` | Delete run and all associated data | — | `204 No Content` |

### Analysis

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/migrations/{id}/analyze` | Run compatibility analysis. Saves results to `analysis_reports`. |
| `GET` | `/migrations/{id}/analysis` | Retrieve existing analysis report without re-running. |

### Conversion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/migrations/{id}/convert` | Generate PostgreSQL-compatible SQL. Requires analysis first. |
| `GET` | `/migrations/{id}/converted-script` | Download converted SQL as plain text. |

### Validation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/migrations/{id}/validate` | Compare source Oracle DB and target PostgreSQL DB. |

### Reports and Export

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/migrations/{id}/report` | Full aggregated report: run + analysis + conversion + validation. |
| `GET` | `/migrations/{id}/export/pdf` | Export report as PDF download. |
| `GET` | `/migrations/{id}/export/json` | Export report as JSON download. |

### Standard Error Response

All errors return a consistent JSON structure — stack traces are never exposed to the client.

```json
{
  "timestamp": "2026-04-11T10:30:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Uploaded file is not a valid SQL file.",
  "path": "/api/v1/migrations/upload"
}
```

### HTTP Status Code Reference

| Code | Name | When Used |
|---|---|---|
| `200` | OK | Successful GET or non-creation POST |
| `201` | Created | Successful `POST /upload` |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid file type, empty file, malformed request |
| `404` | Not Found | Resource with given ID does not exist |
| `409` | Conflict | Action cannot be performed in the current state |
| `413` | Payload Too Large | File exceeds 10 MB |
| `422` | Unprocessable Entity | SQL file is syntactically invalid |
| `500` | Internal Server Error | Unexpected exception — see server logs |
| `503` | Service Unavailable | Database connection failure |

---

## Core Modules

### SqlParser (`parser/SqlParser.java`)

Accepts a raw Oracle `.sql` string. Uses a dual-path parsing strategy — quoted and unquoted identifiers are handled separately — to extract `CREATE TABLE` blocks, column definitions, data types, and constraint clauses. Produces a structured `ParsedSchema` object containing `Table`, `Column`, and `Constraint` instances.

### CompatibilityAnalyzer (`analyzer/CompatibilityAnalyzer.java`)

Accepts the parsed schema and the raw SQL string. Applies the full conversion rules table to detect Oracle-specific constructs. Each detected issue is assigned a severity:

- `HIGH` — Will cause migration failure; not auto-converted; requires manual fix
- `MEDIUM` — Requires rewriting; auto-converted where possible; result must be verified
- `LOW` — Rename or style change; reliably auto-converted

### SqlConverter (`converter/SqlConverter.java`)

Applies string-substitution and context-aware rewriting to transform Oracle constructs into PostgreSQL equivalents. For `HIGH` severity constructs that cannot be safely auto-converted, the converter emits a comment block in the output SQL describing the required manual action.

### ValidationService (`service/ValidationService.java`)

Connects to both the source Oracle database and the target PostgreSQL database using dynamic JDBC contexts. Performs per-table comparison of row counts, null counts per column, data type mappings, primary key integrity, and foreign key reference resolution.

---

## Oracle-to-PostgreSQL Conversion Rules

This is the authoritative reference for all constructs the Compatibility Analyzer detects and the Conversion Engine handles.

### Data Types

| Oracle | PostgreSQL | Severity |
|---|---|---|
| `VARCHAR2(n)` | `VARCHAR(n)` | LOW |
| `NVARCHAR2(n)` | `VARCHAR(n)` | LOW |
| `NUMBER(p,s)` | `NUMERIC(p,s)` | LOW |
| `NUMBER(1)` | `BOOLEAN` | LOW |
| `DATE` | `TIMESTAMP` | MEDIUM |
| `CLOB` | `TEXT` | LOW |
| `BLOB` | `BYTEA` | MEDIUM |
| `ROWID / UROWID` | No equivalent | HIGH |
| `XMLTYPE` | `XML` | MEDIUM |

### Functions and Expressions

| Oracle | PostgreSQL | Severity |
|---|---|---|
| `NVL(a, b)` | `COALESCE(a, b)` | MEDIUM |
| `NVL2(a, b, c)` | `CASE WHEN a IS NOT NULL THEN b ELSE c END` | MEDIUM |
| `DECODE(col, v1, r1, ...)` | `CASE WHEN col=v1 THEN r1 ... END` | MEDIUM |
| `SYSDATE` | `NOW()` | MEDIUM |
| `SYS_GUID()` | `gen_random_uuid()` | MEDIUM |
| `LNNVL(cond)` | No equivalent | HIGH |

### Pagination and Joins

| Oracle | PostgreSQL | Severity |
|---|---|---|
| `ROWNUM <= n` | `LIMIT n` | HIGH |
| `ROWNUM BETWEEN a AND b` | `LIMIT n OFFSET m` | HIGH |
| `(+)` outer join syntax | `LEFT JOIN / RIGHT JOIN` | HIGH |
| `CONNECT BY` | `WITH RECURSIVE ...` | HIGH |
| `MINUS` | `EXCEPT` | LOW |

### Sequences and Auto-Increment

| Oracle | PostgreSQL | Severity |
|---|---|---|
| `seq_name.NEXTVAL` | `NEXTVAL('seq_name')` | MEDIUM |
| `id NUMBER + trigger + NEXTVAL` | `id SERIAL` or `GENERATED ALWAYS AS IDENTITY` | HIGH |

### Unsupported Constructs (Manual Review Required)

The Conversion Engine does not attempt auto-conversion for these. A comment block is emitted in the converted output describing the required action.

| Construct | Recommended Action |
|---|---|
| Oracle Packages | Decompose into individual functions grouped by schema |
| `ROWID / UROWID` references | Redesign queries to use primary keys |
| `CONNECT BY` hierarchical queries | Rewrite as `WITH RECURSIVE` CTEs |
| `BULK COLLECT / FORALL` | Restructure as set-based operations |
| Oracle-specific hints `/*+ ... */` | Remove all hints |
| Database Links | Use the Foreign Data Wrapper (FDW) extension |
| `PRAGMA` in PL/SQL | Remove or redesign |

---

## Database Schema

All schema changes are managed through Flyway. Never modify the database schema manually. Every structural change must go through a versioned migration script.

Flyway scripts are located at: `backend/src/main/resources/db/migration/`

| Script | Description |
|---|---|
| `V1__initial_schema.sql` | Creates `migration_runs`, `analysis_reports`, `converted_scripts`, `validation_results` |
| `V2__add_indexes.sql` | Performance indexes on `run_id`, `severity`, `created_at`, `row_match` |
| `V3__seed_data.sql` | Sample completed migration run for local dev and demo purposes |
| `V4__add_conversion_metadata.sql` | Adds `conversion_notes` and `requires_manual_review` to `converted_scripts` |
| `V5__add_validation_extended_fields.sql` | Adds `source_null_counts`, `target_null_counts`, `pk_integrity_check`, `fk_integrity_check` to `validation_results` |

**Flyway Rule:** Once a migration script has run on any environment, it is immutable. Never rename or modify committed migration files. To fix a past migration, create a new versioned forward script.

---

## Testing

### Strategy

Testing is structured in four layers. Each layer must pass before proceeding to the next.

| Layer | Type | Tool | When |
|---|---|---|---|
| 1 | Unit Tests | JUnit 5 + Mockito | On every code change, before every commit |
| 2 | Integration Tests | Spring Boot Test + TestContainers | On every PR |
| 3 | API Tests | Postman Collection | After every sprint |
| 4 | Manual Exploratory | Postman + React UI | End of each sprint |

### Coverage Target

- Unit test line coverage: minimum 70% on parser, analyzer, and converter classes
- All REST endpoints must have at least one happy-path and one error-path integration test

Generate coverage reports:

```bash
mvn test jacoco:report
# Report generated at: backend/target/site/jacoco/index.html
```

### Running Tests

```bash
cd backend

# Run all tests
mvn clean test

# Run with verbose output
mvn clean test -e
```

### Quality Gates

Before any sprint is marked complete:

- All endpoints must return correct responses in Postman
- All unit tests must pass
- Zero `System.out.println` or `printStackTrace` in the codebase
- Logs must appear in `logs/migration-tool.log` for all requests

---

## Git Workflow

This project follows a simplified Git Flow adapted for a sprint-based delivery model.

### Branch Model

| Branch | Purpose | Lifespan |
|---|---|---|
| `main` | Production-ready code. Always deployable. | Permanent |
| `develop` | Integration branch. All features merge here first. | Permanent |
| `feature/s{n}-{desc}` | One branch per feature or sprint task. | Per feature |
| `bugfix/{desc}` | Bug fixes discovered during development. | Per bug |
| `hotfix/{desc}` | Critical production fixes only. Branches from `main`. | Per hotfix |
| `release/v{x}.{y}` | Sprint release candidate. Final QA happens here. | Per sprint |

**Rule:** Never commit directly to `main` or `develop`. All changes go through a branch and pull request.

### Commit Message Format

This project follows the Conventional Commits specification.

```
<type>(<scope>): <short summary>

[optional body — explain WHY, not WHAT]
```

| Type | When to Use |
|---|---|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `chore` | Build, dependencies, config |
| `perf` | Performance improvement |

---

## Sprint Plan

The project is built across six one-week sprints. Backend is implemented first; the UI is introduced in Sprint 4.

| Sprint | Week | Goals | Deliverables |
|---|---|---|---|
| Sprint 1 | Week 1 | Project scaffold, file upload, SQL parsing | Spring Boot project, upload API, `SqlParser`, parsed JSON output |
| Sprint 2 | Week 2 | Compatibility analysis and issue detection | `CompatibilityAnalyzer`, `analysis_reports` table, analysis endpoint |
| Sprint 3 | Week 3 | Conversion engine, PostgreSQL script generation | `SqlConverter`, `converted_scripts` table, conversion endpoint |
| Sprint 4 | Week 4 | Database report storage, React UI scaffold | Report persistence, React file upload and analysis display |
| Sprint 5 | Week 5 | Validation module, comparison logic | `ValidationService`, `validation_results` table, validation endpoint |
| Sprint 6 | Week 6 | UI polish, PDF/JSON export, edge case hardening | Export endpoints, refined UI, logging audit, Postman collection |

Current status: **Sprint 1 complete.** `SqlParser` implemented and passing 11/11 unit tests.

---

## Limitations and Known Gaps

| Limitation | Detail |
|---|---|
| No authentication | Version 1 has no auth. All endpoints are open. Add Spring Security + JWT before production deployment. |
| PL/SQL conversion | Full PL/SQL block conversion is not automated. Stored procedures, packages, and triggers are flagged as `HIGH` severity and require manual rewriting. |
| Chained NVL calls | `NVL(NVL(a, b), c)` requires recursive replacement logic, not yet implemented. |
| ROWNUM context-sensitivity | `ROWNUM` in subqueries versus top-level `WHERE` requires different conversion logic. Initial implementation handles the basic case only. |
| No pagination | All list endpoints return full result sets in v1. |
| Oracle XE for validation | Live validation testing requires the Oracle XE Docker container. Only needed from Sprint 5 onward. |

---

## Contributing

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop && git pull origin develop
   git checkout -b feature/s{n}-{short-description}
   ```
2. Work in small, focused commits following the Conventional Commits format.
3. Run the full test suite before pushing:
   ```bash
   cd backend && mvn clean test
   ```
4. Rebase onto `develop` before opening a pull request:
   ```bash
   git rebase develop
   ```
5. Open a pull request into `develop`. Ensure all CI checks pass.
6. Delete the feature branch after merging.

---

*Migration Playground — Project Specification v1.0 | April 2026*
