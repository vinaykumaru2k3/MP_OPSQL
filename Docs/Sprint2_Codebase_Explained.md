# Sprint 2 — Compatibility Analyzer Codebase Explanation

> **SchemaForge** | Sprint 2: Compatibility Analyzer Engine
> This document provides a comprehensive breakdown of exactly what was built during Sprint 2. Where Sprint 1 laid the foundation and created a syntax parser, Sprint 2 introduces the real "brain" of the application: the component that detects incompatibilities between Oracle and PostgreSQL and assigns severity ratings.

---

## Table of Contents

1. [Big Picture: What Did Sprint 2 Build?](#1-big-picture)
2. [The Request Lifecycle (Analyze Flow)](#2-request-lifecycle)
3. [The Memory Cache (Sprint 4 Technical Debt)](#3-memory-cache)
4. [Domain Models and DTOs](#4-domain-models)
5. [The Core Engine — CompatibilityAnalyzer.java (Deep Dive)](#5-compatibility-analyzer)
6. [The Controller — MigrationController.java Updates](#6-migrationcontroller)
7. [The Test Suite — CompatibilityAnalyzerTest.java](#7-test-suite)
8. [The Postman Collection Update](#8-postman-collection)

---

## 1. Big Picture

In Sprint 1, we built an endpoint (`POST /upload`) that accepted a SQL file, used `SqlParser.java` to slice it into a Java-based Abstract Syntax Tree (`ParsedSchema`), and returned basic metrics (table/column counts). 

Sprint 2 brings the **Oracle DBA knowledge** into the system. We built `CompatibilityAnalyzer.java`, an engine that iterates over that `ParsedSchema` as well as the raw SQL string, looking for legacy, proprietary Oracle constructs that will explicitly fail if run against a PostgreSQL database. 

It maps 15 unique Oracle constructs into `HIGH`, `MEDIUM`, or `LOW` severities and aggregates them into a comprehensive `AnalysisReport`.

---

## 2. The Request Lifecycle (Analyze Flow)

Here is exactly what happens when the user hits the new analysis endpoint:

1. **Client Request:** User sends `POST /api/v1/migrations/{id}/analyze`.
2. **Controller Routing:** `MigrationController` receives the UUID and delegates to `SchemaService.analyze(runId)`.
3. **Cache Hit:** `SchemaService` looks inside its temporary `rawSqlCache` and `schemaCache` to retrieve the SQL file that was uploaded in Sprint 1.
4. **Engine Orchestration:** `SchemaService` passes both the `ParsedSchema` object and the raw SQL `String` directly to `CompatibilityAnalyzer.analyze(schema, rawSql)`.
5. **Detection:**
    * The analyzer loops over every column looking at `getType()`.
    * The analyzer runs 14 distinct regex patterns against the raw SQL string.
    * It builds a `List<AnalysisIssue>`.
6. **Return:** The `AnalysisReport` model is mapped to an `AnalysisReportDto` to hide internal logic/fields, cached for future `GET` requests, and returned to the Controller as a `201 Created` JSON payload.

---

## 3. The Memory Cache (Sprint 4 Technical Debt)

**Why this exists:** 
In Sprint 1, our `MigrationRun` DB entity only tracked basic high-level primitives (`id`, `table_count`, etc.). The actual 5MB uploaded SQL file content was discarded the millisecond the request ended.

However, to run an analysis later, we *must* have access to that raw SQL. Because setting up full database BLOB/JSONB persistence isn't slated until Sprint 4, we implemented an intentional technical debt hack inside `SchemaService.java`:

```java
// SchemaService.java
private final Map<UUID, String> rawSqlCache = new ConcurrentHashMap<>();
private final Map<UUID, ParsedSchema> schemaCache = new ConcurrentHashMap<>();
private final Map<UUID, AnalysisReportDto> reportCache = new ConcurrentHashMap<>();
```

During `POST /upload`, the string is slammed into these `ConcurrentHashMap` stores. During `POST /analyze`, it is retrieved via the given UUID. 
*Note: Because this is stored in RAM, restarting your Spring Boot server completely clears the cache. This will be replaced by PostgreSQL persistence in Sprint 4.*

---

## 4. Domain Models and DTOs

Two new POJOs were created in the `model/` package.

### `AnalysisIssue.java`
Represents a single detected discrepancy. 
- `construct`: What Oracle piece was found (e.g. `"SYSDATE"` or `"ROWID"`).
- `severity`: `"HIGH"`, `"MEDIUM"`, or `"LOW"`.
- `description`: The human-readable instruction (e.g. `"Oracle SYSDATE used. Convert to NOW()"`).

### `AnalysisReport.java` & `AnalysisReportDto.java`
The report groups all issues together. It calculates the aggregate metrics locally (`highSeverityCount`, `mediumSeverityCount`, etc.) so the React UI doesn't have to manually count them later. We mirrored it with a DTO (Data Transfer Object) in `dto/` so our API layer has a boundary separating it from our DB logic later.

---

## 5. The Core Engine — CompatibilityAnalyzer (Deep Dive)

**File:** `analyzer/CompatibilityAnalyzer.java`

This component has no database connections and handles zero HTTP traffic. It is a pure, stateless Java engine (a `@Component`). It uses a two-pronged strategy:

### Strategy 1: Data Type Injection (AST Checking)
It iterates over the `ParsedSchema` tree directly (`Table` -> `Column` -> `getType()`). 
```java
if (type.equals("DATE")) {
    addIssue(issues, "DATE", "MEDIUM", "Column uses DATE. Convert to TIMESTAMP.");
}
```
*Because the parser already resolved columns gracefully, we don't need messy regex to find datatypes. We just read the java strings.*

### Strategy 2: Raw SQL Regex Matching
For functions, pagination, and structural logic, the system strips out comments (`--` and `/* */`) AND **string literals** (`'...'`) to avoid false positives. It then converts the raw SQL to uppercase and runs strict Word-Boundaried Regexes:

```java
// Masking String Literals perfectly (handles escaped quotes '')
String cleanSql = rawSql.replaceAll("(?s)/\\*.*?\\*/", "")
                        .replaceAll("--.*", "")
                        .replaceAll("'(?:[^']|'')*'", "''");
```

*This "String Literal Masking" ensures that if a user has a string like `'User tried to use NVL'`, the word `NVL` is NOT falsely flagged as an Oracle incompatibility.*

### Strategy 3: Specific Regex Rules

```java
// Matches exactly the word ROWNUM, but not part of 'GROWNUM'
checkRegex(upperSql, "\\bROWNUM\\b", "ROWNUM", "HIGH", "...", issues);

// Matches DECODE followed by optional spaces and a parenthesis ('DECODE (', 'DECODE(')
checkRegex(upperSql, "\\bDECODE\\s*\\(", "DECODE()", "MEDIUM", "...", issues);

// Matches the literal (+) syntax for old oracle outer joins
checkRegex(upperSql, "\\(\\+\\)", "(+) Outer Join", "HIGH", "...", issues);
```

**De-duplication:** 
The `addIssue` method checks if the specific `(construct, description)` combo already exists in the `issues` list before appending it. If a developer uses `SYSDATE` 500 times, the analysis report flags it *once*.

---

## 6. The Controller — MigrationController.java Updates

Two highly standardized endpoints were mapped:
- `@PostMapping("/{id}/analyze")` — Triggers the heavyweight regex calculation.
- `@GetMapping("/{id}/analysis")` — A fast retrieve-only method returning the computed DTO from the cache. 

---

## 7. The Test Suite — CompatibilityAnalyzerTest.java

**File:** `test/.../CompatibilityAnalyzerTest.java`

15 distinct unit tests were written to cover every single severity rule mapped in the engineering specs. 

Instead of dealing with massive text files, the test utilizes a mocking pattern:
```java
// Testing LNNVL explicitly
String sql = "SELECT * FROM t WHERE LNNVL(col1 > 10);";
AnalysisReport report = analyzer.analyze(createEmptySchema(), sql);
assertEquals(1, report.getHighSeverityCount());
assertEquals("LNNVL()", report.getIssues().get(0).getConstruct());
```
When running `mvn test`, the Spring context runs all 11 Parser tests alongside all 15 Analyzer tests in milliseconds. No database running is required to vet the analyzer logic.

---

## 8. The Postman Collection Update

The `SchemaForge.postman_collection.json` file now contains a new folder: **Sprint 2 — Analysis Endpoints**.
It houses:
- **API-05 | Run Analysis** 
- **API-06 | Get Analysis**

Both use the built-in Postman `{{run_id}}` variable routing schema. 

> **How to use them locally:** 
> 1. Start your Spring Boot application.
> 2. Open Postman and run **API-01 (Sprint 1)** to upload `sql/samples/sample_02_oracle_specifics.sql`.
> 3. Copy the `"id"` from that JSON response.
> 4. Go to **API-05 (Sprint 2)**, paste the ID into the path (e.g. `/api/v1/migrations/[your_id]/analyze`) and fire.
> 5. You will see a detailed JSON payload detailing all 15+ Oracle constructs successfully flagged. 
