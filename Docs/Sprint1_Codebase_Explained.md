# Sprint 1 Codebase Overview

This document provides a brief explanation of the architecture, folder structure, and individual code files established during Sprint 1 for the **Migration Playground** backend.

## Architecture Highlights
The backend strictly adheres to a domain-driven, layered Spring Boot architectural pattern. All endpoints flow vertically from the `Controller` -> `Service` -> `Parser/Engine` -> `Repository`.

---

## Filenames and Paths

### 1. Project Configuration
- **Path:** `backend/pom.xml`
  **Description:** The Maven configuration file initializing the Spring Boot environment. It imports dependencies like `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, and `postgresql`.

- **Path:** `backend/src/main/resources/application.properties`
  **Description:** Holds the essential setup properties detailing the PostgreSQL connection parameters, multipart upload limits (10MB), and logging preferences.

### 2. Main Entry Point
- **Path:** `backend/src/main/java/com/migrationplayground/MigrationPlaygroundApplication.java`
  **Description:** The standard Spring Boot `main` class required to bootstrap and execute the `Tomcat` server embedded within the app.

### 3. Core Domain Models (`/model`)
- **Path:** `backend/src/main/java/com/migrationplayground/model/Column.java`
- **Path:** `backend/src/main/java/com/migrationplayground/model/Constraint.java`
- **Path:** `backend/src/main/java/com/migrationplayground/model/Table.java`
- **Path:** `backend/src/main/java/com/migrationplayground/model/ParsedSchema.java`
  **Description:** These files form the in-memory Java POJO representation of the SQL structure. When an Oracle SQL file is parsed, it is tokenized into Tables, which contain iterative lists of Columns and Constraints. The `ParsedSchema` holds the final collection.

- **Path:** `backend/src/main/java/com/migrationplayground/model/MigrationRun.java`
  **Description:** Unlike the volatile schema POJOs, this is a `@jakarta.persistence.Entity` representing the PostgreSQL table `migration_runs`. It maps the audit trail of each execution in the playground (tracking metadata like execution time, file name, and entity count).

### 4. Database Access Layer (`/repository`)
- **Path:** `backend/src/main/java/com/migrationplayground/repository/MigrationRunRepository.java`
  **Description:** Inherits `JpaRepository`. Provides out-of-the-box methods (save, find, delete) to insert `MigrationRun` instances securely into the Postgres database.

### 5. API Exception Management (`/exception`)
- **Path:** `backend/src/main/java/com/migrationplayground/exception/GlobalExceptionHandler.java`
- **Path:** `backend/src/main/java/com/migrationplayground/exception/ApiErrorResponse.java`
  **Description:** Implements `@ControllerAdvice` to catch uncontrolled application crashes or logic constraints (`IllegalArgumentException`, `MaxUploadSizeExceededException`). It restructures these failures cleanly into standard `ApiErrorResponse` JSON packets so that the React frontend won't break during errors.

### 6. The Execution Engines (`/parser` & `/service`)
- **Path:** `backend/src/main/java/com/migrationplayground/parser/SqlParser.java`
  **Description:** The heavily optimized REGEX syntax processor. It breaks apart physical `.sql` files into blocks based on `CREATE TABLE` and tokenizes the inner parenthesis constraints accurately into programmatic Java types.

- **Path:** `backend/src/main/java/com/migrationplayground/service/SchemaService.java`
  **Description:** The core orchestration block bridging the gap. It takes the binary `MultipartFile` received by the controller, checks business rules (is it empty? is it `.sql`?), passes the string content to `SqlParser`, counts the output, and subsequently commands `MigrationRunRepository` to persist the metrics.

### 7. The REST Controller (`/controller`)
- **Path:** `backend/src/main/java/com/migrationplayground/controller/MigrationController.java`
  **Description:** Maps `/api/v1/migrations`. It exposes the `POST /upload` endpoint specifically allowing the frontend to transmit the payload mapping seamlessly to `SchemaService`.

### 8. Testing Foundation (`/test`)
- **Path:** `backend/src/test/java/com/migrationplayground/parser/SqlParserTest.java`
  **Description:** A pristine JUnit 5 execution framework evaluating P-01 through P-12 test conditions. It asserts properties ranging from deep Composite Keys to whitespace abnormalities ensuring future REGEX modifications don't shatter parsing logic.

- **Path:** `sql/samples/sample_01_basic_ddl.sql`
  **Description:** Valid boilerplate Oracle SQL schema stored natively to dynamically mock input.
