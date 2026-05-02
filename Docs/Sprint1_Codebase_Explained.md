# Sprint 1 — Complete Codebase Explanation

> **SchemaForge** | Sprint 1: Project Scaffold & Parser Engine
> This document is a comprehensive, in-depth walkthrough of every file built in Sprint 1. It explains not just *what* each file does, but *why* it exists, *how* it connects to everything else, and *what happens at runtime* when the system processes a request.

---

## Table of Contents

1. [Big Picture: What Did Sprint 1 Build?](#1-big-picture)
2. [Package Structure at a Glance](#2-package-structure)
3. [The Request Lifecycle (End-to-End Flow)](#3-request-lifecycle)
4. [Configuration Files](#4-configuration-files)
5. [The Model Layer — In-Memory Data Structures](#5-model-layer)
6. [The Parser Engine — SqlParser.java (Deep Dive)](#6-sqlparser-deep-dive)
7. [The Service Layer — SchemaService.java](#7-schemaservice)
8. [The Controller — MigrationController.java](#8-migrationcontroller)
9. [The Repository — MigrationRunRepository.java](#9-repository)
10. [The Exception System](#10-exception-system)
11. [The Test Suite — SqlParserTest.java](#11-test-suite)
12. [Empty Packages: What They're Reserved For](#12-empty-packages)
13. [How Everything Connects (Dependency Map)](#13-dependency-map)
14. [The Postman Collection — SchemaForge.postman_collection.json](#14-postman-collection)

---

## 1. Big Picture

Sprint 1 built the **foundational backend scaffold** for the SchemaForge — a tool that allows engineers to upload raw Oracle SQL files and analyze them for PostgreSQL compatibility.

**What Sprint 1 specifically delivers:**
- A running Spring Boot REST API (`http://localhost:8080`)
- One `POST /api/v1/migrations/upload` endpoint that accepts a `.sql` file
- A **regex-based SQL parser** that reads Oracle DDL (CREATE TABLE statements) and converts them into structured Java objects
- A **PostgreSQL persistence layer** that records metadata about every parse run (file name, table count, column count)
- A **global exception handling** system that converts every crash or validation failure into clean JSON error responses

The project does **not** yet do type conversion (Sprint 3), compatibility analysis (Sprint 2), or have a UI (Sprint 4). Sprint 1 is purely the pipeline skeleton.

---

## 2. Package Structure

```
backend/src/main/java/com/migrationplayground/
│
├── SchemaForgeApplication.java  ← Entry point (boots the server)
│
├── controller/
│   └── MigrationController.java         ← Receives HTTP requests
│
├── service/
│   └── SchemaService.java               ← Business logic & orchestration
│
├── parser/
│   └── SqlParser.java                   ← Core SQL parsing engine
│
├── model/
│   ├── ParsedSchema.java                ← Top-level container for parse results
│   ├── Table.java                       ← Represents one CREATE TABLE block
│   ├── Column.java                      ← Represents one column definition
│   ├── Constraint.java                  ← Represents PK/FK constraints
│   └── MigrationRun.java               ← JPA Entity saved to PostgreSQL
│
├── repository/
│   └── MigrationRunRepository.java      ← JPA interface for database access
│
├── exception/
│   ├── GlobalExceptionHandler.java      ← Catches all exceptions globally
│   └── ApiErrorResponse.java           ← Standardized error JSON shape
│
├── analyzer/     (empty — reserved for Sprint 2)
├── converter/    (empty — reserved for Sprint 3)
└── dto/          (empty — reserved for Sprint 4)
```

```
backend/src/test/java/com/migrationplayground/
└── parser/
    └── SqlParserTest.java               ← 11 JUnit 5 test cases (P-01 to P-11)
```

```
backend/src/main/resources/
└── application.properties               ← DB connection, upload limits, logging

backend/
└── pom.xml                              ← Maven dependencies & build config

sql/samples/
└── sample_01_basic_ddl.sql             ← Oracle DDL sample for manual testing
```

---

## 3. Request Lifecycle

Here is exactly what happens from the moment you upload a `.sql` file to the API until you get a JSON response back:

```
[Client] ──POST /api/v1/migrations/upload (multipart/form-data)──►

[MigrationController]
  │  Receives MultipartFile + optional file_name param
  │  Delegates immediately to SchemaService
  ▼
[SchemaService.uploadAndParse()]
  │  1. Guards: file null? empty? non-.sql extension? → throw IllegalArgumentException
  │  2. Reads raw bytes from MultipartFile → UTF-8 String
  │  3. Calls SqlParser.parse(content)
  │         │
  │         ▼
  │    [SqlParser.parse()]
  │      1. Strips SQL comments (-- and /* */)
  │      2. Normalizes line endings (\r\n → \n)
  │      3. Splits raw SQL on "CREATE TABLE" keyword (regex, case-insensitive)
  │      4. For each CREATE TABLE block:
  │           - Extracts table name (between CREATE TABLE and first open paren)
  │           - Extracts table body (between first ( and last ))
  │           - Calls parseTableBody()
  │                │
  │                ├── For each comma-separated token:
  │                │     - If starts with CONSTRAINT / PRIMARY KEY / FOREIGN KEY → parseConstraint()
  │                │     - Otherwise → parseColumn()
  │                │
  │                └── Returns fully populated Table object
  │
  │  4. Counts tables and total columns from ParsedSchema
  │  5. Creates MigrationRun (fileName, status="PARSED", tableCount, columnCount)
  │  6. Saves MigrationRun to PostgreSQL via MigrationRunRepository.save()
  │  7. Returns saved MigrationRun (now has generated UUID id + createdAt)
  ▼
[MigrationController]
  │  Wraps result in ResponseEntity with HTTP 201 CREATED
  ▼
[Client] ◄── JSON response (MigrationRun: id, fileName, status, tableCount, columnCount, createdAt)
```

**Error path:** If anything throws at any layer:
```
[Any Layer throws Exception]
  ▼
[GlobalExceptionHandler]
  ├── IllegalArgumentException → HTTP 400 Bad Request
  ├── MaxUploadSizeExceededException → HTTP 413 Payload Too Large
  └── Any other Exception → HTTP 500 Internal Server Error
  ▼
[Client] ◄── JSON: { timestamp, status, error, message, path }
```

---

## 4. Configuration Files

### `backend/pom.xml`

The Maven build descriptor. Key decisions:

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | Embeds Tomcat, enables `@RestController`, `@RequestMapping`, `MultipartFile` handling |
| `spring-boot-starter-data-jpa` | Enables `@Entity`, `JpaRepository`, Hibernate ORM, `@Transactional` |
| `spring-boot-starter-validation` | Enables `@Valid`, `@NotNull` etc. for future request validation |
| `postgresql` (runtime) | JDBC driver that connects Java to PostgreSQL, not needed at compile time |
| `lombok` (optional) | Generates boilerplate (getters/setters). **Note:** Sprint 1 ended up not using `@Data` annotations — instead manual getters/setters and inner `Builder` classes were written |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ — the testing toolkit |
| `jacoco-maven-plugin` | Measures code coverage. Reports are generated in `target/site/jacoco/` after `mvn test` |

**Why Lombok is `optional: true`**: This tells Maven not to bundle Lombok into the final JAR (the annotation processor runs at compile time only, so the runtime artifact doesn't need it).

**Why JaCoCo has two executions**: `prepare-agent` injects the coverage agent before tests run. The `report` execution (bound to the `test` phase) then writes the HTML/XML reports. This is the standard JaCoCo wiring.

---

### `backend/src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/migration_db
spring.datasource.username=migration_user
spring.datasource.password=migration_pass
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
server.port=8080

logging.level.com.schemaforge=DEBUG
logging.file.name=logs/migration-tool.log
```

**Line-by-line explanation:**

- `datasource.url`: Connects to a PostgreSQL database named `migration_db` on localhost port 5432. This is the standard JDBC URL format for PostgreSQL.
- `hibernate.ddl-auto=update`: Hibernate will **automatically create or alter** the `migration_runs` table based on the `MigrationRun` entity when the app starts. This is convenient for development. In production, this should be `validate` or `none` with Flyway managing schema migrations.
- `jpa.show-sql=false`: We're not polluting logs with every SQL statement. Flip to `true` for debugging.
- `multipart.max-file-size` and `max-request-size=10MB`: Both must be set. The `GlobalExceptionHandler` catches `MaxUploadSizeExceededException` specifically when this limit is breached.
- `logging.level.com.schemaforge=DEBUG`: Every `log.info()` and `log.debug()` call inside our package will be visible. External library logs stay at INFO.
- `logging.file.name`: All logs are also written to `logs/migration-tool.log` (relative to working directory) in addition to the console.

---

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: migration_postgres
    environment:
      POSTGRES_USER: migration_user
      POSTGRES_PASSWORD: migration_pass
      POSTGRES_DB: migration_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

This file is required to actually run the database that the Sprint 1 application expects. It spins up a lightweight PostgreSQL 15 container exposing port 5432 to your local machine, and pre-creates the `migration_db` with the `migration_user` so the Spring Boot application can connect immediately upon startup without manual Database administration.

---

### `SchemaForgeApplication.java`

```java
@SpringBootApplication
public class SchemaForgeApplication {
    public static void main(String[] args) {
        SpringApplication.run(SchemaForgeApplication.class, args);
    }
}
```

`@SpringBootApplication` is a composite annotation that equals `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. The component scan starts from this class's package (`com.schemaforge`) and recursively finds every `@Component`, `@Service`, `@Repository`, `@RestController`, and `@ControllerAdvice` in the codebase — wiring them all into the Spring IoC container automatically.

---

## 5. Model Layer

The model layer contains two fundamentally different types of classes:

### In-Memory POJOs (used during parsing, never saved to DB)

These are plain Java objects with no JPA annotations. They represent the **parsed structure of Oracle SQL** in memory for the duration of one request. They are discarded after `SchemaService` finishes counting.

#### `ParsedSchema.java`
The top-level container returned by `SqlParser.parse()`.

```java
public class ParsedSchema {
    private List<Table> tables = new ArrayList<>();
}
```

This is intentionally minimal. When `SqlParser` finishes parsing a SQL file, it returns one `ParsedSchema` object. Its `tables` list holds every `CREATE TABLE` statement it found.

#### `Table.java`
Represents a single `CREATE TABLE` block.

```java
public class Table {
    private String name;
    private List<Column> columns = new ArrayList<>();
    private List<Constraint> constraints = new ArrayList<>();
}
```

`name` is the table name extracted from `CREATE TABLE <name> (...)`. The columns and constraints are populated by `parseColumn()` and `parseConstraint()` respectively inside `SqlParser`.

#### `Column.java`
Represents one column definition inside a `CREATE TABLE`. Uses a hand-written Builder pattern (instead of Lombok `@Builder`, since Lombok was kept out of models):

```java
public class Column {
    private String name;    // e.g. "user_id"
    private String type;    // e.g. "NUMBER" or "VARCHAR2(100)"
    private boolean nullable; // false if "NOT NULL" is present
}
```

The `Column.builder().name(...).type(...).nullable(...).build()` pattern in `SqlParser` at line 98 uses this inner `Builder` class directly.

#### `Constraint.java`
Represents a PRIMARY KEY or FOREIGN KEY constraint.

```java
public class Constraint {
    private String type;              // "PRIMARY_KEY" or "FOREIGN_KEY"
    private List<String> columns;     // ["order_id", "line_num"] for composite keys
    private String column;            // legacy single-column field (currently unused)
}
```

**Note:** The `column` (singular) field currently exists but is never written to in Sprint 1 — the parser always adds to `columns` (plural). This is a minor redundancy to clean up in a future sprint.

---

### JPA Entity (saved to PostgreSQL)

#### `MigrationRun.java`
This is the **only class in Sprint 1 that touches the database**. It maps directly to a `migration_runs` table in PostgreSQL.

```java
@Entity
@Table(name = "migration_runs")
public class MigrationRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;                     // Auto-generated UUID primary key

    @Column(name = "file_name", nullable = false)
    private String fileName;             // The uploaded file's name

    @Column(nullable = false)
    private String status;               // "PARSED" after successful processing

    @Column(name = "table_count")
    private Integer tableCount;          // How many CREATE TABLE blocks were found

    @Column(name = "column_count")
    private Integer columnCount;         // Total columns across all tables

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;           // Auto-set on first save

    @PrePersist
    protected void onCreate() { ... }   // Lifecycle hook: sets createdAt + default status
}
```

**Key design choices:**
- **UUID as primary key** (not auto-increment integer): UUIDs are safer to expose in URLs (no sequential enumeration attack), and they work better in distributed systems.
- **`@PrePersist` lifecycle hook**: Instead of relying on the database to set `created_at` (which is Oracle/PostgreSQL-specific), we set it in Java using `Instant.now()`. This keeps the logic portable.
- **`updatable = false` on `created_at`**: Once saved, this field is frozen. Even if someone calls `save()` again, Hibernate won't include it in the UPDATE statement.
- **`GenerationType.UUID`**: This is a JPA 3.1 feature (available in Spring Boot 3.2+ with Jakarta Persistence). Hibernate generates the UUID before INSERT using the JVM's `UUID.randomUUID()`.

---

## 6. SqlParser — Deep Dive

`SqlParser.java` is the **most complex class in Sprint 1**. It's a `@Component` (stateless Spring bean), meaning one shared instance lives in the application context and is injected wherever needed.

### Method: `parse(String rawSql)`

**Step 1 — Comment Stripping**
```java
String sql = rawSql.replaceAll("--.*", "");       // Remove single-line comments
sql = sql.replaceAll("/\\*.*?\\*/", "");          // Remove block comments (non-greedy)
sql = sql.replaceAll("\\r\\n", "\\n");            // Normalize Windows line endings
```
The `.*?` in the block comment regex is **non-greedy** — it stops at the first `*/` it finds, not the last. This is important so `/* comment1 */ code /* comment2 */` doesn't incorrectly swallow `code`.

**Step 2 — Split on CREATE TABLE**
```java
String[] tableBlocks = sql.split("(?i)CREATE\\s+TABLE\\s+");
```
- `(?i)` = case-insensitive
- `\\s+` = one or more whitespace characters (handles `CREATE  TABLE` with extra spaces)
- The split produces an array where index 0 is everything *before* the first `CREATE TABLE`, and index 1+ is everything *after* each keyword. We loop from index 1.

**Step 3 — Extract Table Name and Body**
```java
int firstParen = block.indexOf('(');
int lastParen = block.lastIndexOf(')');
String tableName = block.substring(0, firstParen).replace("\"", "").trim();
String tableBody = block.substring(firstParen + 1, lastParen).trim();
```
- `lastIndexOf(')')` is intentional — it handles nested parens inside `NUMBER(10,2)` or `VARCHAR2(100)` correctly. We're looking for the outermost closing paren.
- `replace("\"", "")` strips Oracle quoted identifiers (e.g., `"MY_TABLE"` → `MY_TABLE`).

---

### Method: `parseTableBody(String body, Table table)`

```java
String[] parts = body.split(",(?![^(]*\\))");
```
This is the trickiest regex in the entire codebase. It splits on commas that are **not inside parentheses**. For example:

```sql
id NUMBER,
price NUMBER(10,2),      ← the comma here is inside parens — do NOT split
name VARCHAR2(100)
```

The negative lookahead `(?![^(]*\\))` means: "only match a comma if there is no `)` ahead of it without a matching `(` first." This correctly keeps `NUMBER(10,2)` as a single token.

Each part is then classified:
- Starts with `CONSTRAINT`, `PRIMARY KEY`, or `FOREIGN KEY` → `parseConstraint()`
- Otherwise → `parseColumn()`

---

### Method: `parseColumn(String part, Table table)`

Handles two cases:

**Quoted identifiers** (Oracle allows `"My Column"`):
```java
if (part.startsWith("\"")) {
    int closingQuote = part.indexOf('"', 1);
    name = part.substring(1, closingQuote);
    rest = part.substring(closingQuote + 1).trim();
}
```

**Normal identifiers** (split on first whitespace):
```java
int firstSpace = part.indexOf(' ');
name = part.substring(0, firstSpace).trim();
rest = part.substring(firstSpace).trim();
```

Then a regex extracts the data type and any modifiers:
```java
Pattern typePattern = Pattern.compile(
    "^([a-zA-Z0-9_]+(?:\\s*\\([0-9,\\s]+\\))?)(.*)",
    Pattern.CASE_INSENSITIVE
);
```
- Group 1 captures the type: `NUMBER`, `VARCHAR2(100)`, `NUMBER(10,2)` — including optional precision/scale in parens
- Group 2 captures everything after (e.g., `NOT NULL`, `DEFAULT 0`) — this is the `modifiers` string
- `nullable` is set to `false` if `NOT NULL` appears anywhere in the modifiers

---

### Method: `parseConstraint(String part, Table table)`

Two separate regex patterns:

**Primary Key:**
```java
Pattern pkPattern = Pattern.compile(
    "PRIMARY\\s+KEY\\s*\\(([^)]+)\\)",
    Pattern.CASE_INSENSITIVE
);
```
Captures everything inside `PRIMARY KEY (...)`. The group is then split on `,` to get individual column names. This naturally handles composite PKs like `PRIMARY KEY (order_id, line_num)`.

**Foreign Key:**
```java
Pattern fkPattern = Pattern.compile(
    "FOREIGN\\s+KEY\\s*\\(([^)]+)\\)",
    Pattern.CASE_INSENSITIVE
);
```
Same approach. Note: the `REFERENCES users(id)` part of a FK definition is currently **not captured** — only the referencing column is recorded. This is intentional for Sprint 1; the reference extraction will come in Sprint 2 or 3.

---

## 7. SchemaService

`SchemaService` is the **orchestrator** — it sequences the operations and contains the business rules.

```java
@Service
public class SchemaService {
    private final MigrationRunRepository migrationRunRepository;
    private final SqlParser sqlParser;

    public SchemaService(MigrationRunRepository migrationRunRepository, SqlParser sqlParser) { ... }
```

**Constructor injection** (not `@Autowired` field injection): This is the recommended Spring Boot 3.x pattern. It makes the class testable without a Spring context (you can `new SchemaService(mockRepo, mockParser)` in tests).

### `uploadAndParse(MultipartFile file, String fileNameOverride)`

**Guard 1 — Null/empty file:**
```java
if (file == null || file.isEmpty()) throw new IllegalArgumentException("Uploaded file is empty.");
```

**Guard 2 — Extension check:**
```java
if (!originalFilename.toLowerCase().endsWith(".sql")) throw new IllegalArgumentException(...)
```
Note: `toLowerCase()` ensures `.SQL` (uppercase) is also accepted. This is important for Windows file systems where extensions are often uppercase.

**File name override logic:**
```java
String fileName = (fileNameOverride != null && !fileNameOverride.isEmpty())
    ? fileNameOverride
    : originalFilename;
```
The `file_name` request parameter lets the client supply a custom display name. This is useful when the client renames the file before upload or is sending it programmatically.

**Parsing and metric calculation:**
```java
String content = new String(file.getBytes(), StandardCharsets.UTF_8);
ParsedSchema schema = sqlParser.parse(content);
int tableCount = schema.getTables().size();
int colCount = schema.getTables().stream().mapToInt(t -> t.getColumns().size()).sum();
```
`StandardCharsets.UTF_8` is explicit — never rely on the platform default charset, which varies by OS.

**Persistence:**
```java
MigrationRun run = new MigrationRun();
run.setFileName(fileName);
run.setStatus("PARSED");
run.setTableCount(tableCount);
run.setColumnCount(colCount);
run = migrationRunRepository.save(run);
```
After `save()`, the returned `run` object is **the same object but now hydrated** — it has `id` and `createdAt` populated (set by JPA + the `@PrePersist` hook).

---

## 8. MigrationController

```java
@RestController
@RequestMapping("/api/v1/migrations")
public class MigrationController {

    @PostMapping("/upload")
    public ResponseEntity<MigrationRun> uploadSqlFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "file_name", required = false) String fileName) {

        MigrationRun run = schemaService.uploadAndParse(file, fileName);
        return new ResponseEntity<>(run, HttpStatus.CREATED);
    }
}
```

**Design notes:**

- `@RestController` = `@Controller` + `@ResponseBody`. Every return value is automatically serialized to JSON by Jackson (no need to call `response.getWriter()`).
- `@RequestMapping("/api/v1/migrations")` sets the base path. All methods inside inherit this prefix.
- `required = false` on `file_name` means this parameter is optional — omitting it from the request is perfectly valid.
- **`HttpStatus.CREATED` (201)** is the correct status code for a resource-creation endpoint. Using 200 OK would be semantically wrong — we're not fetching data, we're creating a `MigrationRun` record.
- The controller contains **zero business logic**. It delegates entirely to `SchemaService`. This is the strict layered architecture rule.

**Why is `MigrationRun` returned directly?** This is a minor Sprint 1 shortcut — the entity is returned directly from the controller. In Sprint 4, this will be replaced with a proper DTO (`MigrationRunDto`) to avoid exposing JPA internals.

---

## 9. MigrationRunRepository

```java
@Repository
public interface MigrationRunRepository extends JpaRepository<MigrationRun, UUID> {
}
```

This is deliberately empty. `JpaRepository<MigrationRun, UUID>` gives us:
- `save(entity)` — INSERT or UPDATE
- `findById(UUID id)` — SELECT by PK
- `findAll()` — SELECT *
- `delete(entity)` — DELETE
- `count()` — SELECT COUNT(*)
- And many more...

Spring Data JPA generates the implementation automatically at startup using proxy classes — there is no SQL to write for basic CRUD. Custom query methods (e.g., `findByStatus(String status)`) will be added in later sprints as needed.

---

## 10. Exception System

### `ApiErrorResponse.java`

The **standardized error envelope** returned for every failure:

```json
{
  "timestamp": "2026-04-12T11:47:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Uploaded file is not a valid SQL file.",
  "path": "/api/v1/migrations/upload"
}
```

Fields:
| Field | Purpose |
|---|---|
| `timestamp` | When the error occurred — essential for log correlation |
| `status` | HTTP status code as integer (mirrors the HTTP response status) |
| `error` | Machine-readable error type code |
| `message` | Human-readable message — safe to show in UI |
| `path` | Which endpoint was called — helps frontend routing decisions |

Uses a hand-written Builder (`ApiErrorResponse.builder().timestamp(...).build()`) — same pattern as `Column`.

### `GlobalExceptionHandler.java`

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(...) → HTTP 400

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxSizeException(...) → HTTP 413

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAllExceptions(...) → HTTP 500
}
```

**`@ControllerAdvice`** intercepts exceptions thrown from any `@Controller` or `@RestController` in the application. The most-specific handler wins — so `IllegalArgumentException` (400) is caught by its specific handler before the catch-all `Exception.class` handler (500).

**Why this matters:** Without this, Spring Boot's default error handling returns a Whitelabel Error Page (HTML) or a `BasicErrorController` JSON, which is inconsistent. The `GlobalExceptionHandler` ensures every error — from validation to I/O failures — returns exactly the same `ApiErrorResponse` shape.

---

## 11. Test Suite

`SqlParserTest.java` tests the `SqlParser` **in complete isolation** — no Spring context, no mocks, no database. This is a pure unit test.

```java
@BeforeEach
void setUp() {
    sqlParser = new SqlParser();
}
```

A fresh `SqlParser` instance is created before each test. Since `SqlParser` is stateless, this is equivalent to reusing the same instance — but `@BeforeEach` is good practice.

| Test | ID | What It Verifies |
|---|---|---|
| `testParseSingleTable_P01` | P-01 | Basic two-column table: correct table name, column names, and types |
| `testParseMultipleTables_P02` | P-02 | Three tables in one SQL string: all three are found in order |
| `testParsePrimaryKey_P03` | P-03 | `PRIMARY KEY (id)` creates a `PRIMARY_KEY` Constraint with the correct column |
| `testParseCompositePrimaryKey_P04` | P-04 | `PRIMARY KEY (order_id, line_num)` creates a constraint with 2 columns in the correct order |
| `testParseForeignKey_P05` | P-05 | `FOREIGN KEY (user_id) REFERENCES users(id)` creates a `FOREIGN_KEY` Constraint |
| `testParseNotNull_P06` | P-06 | `VARCHAR2(100) NOT NULL` sets `nullable = false` on the column |
| `testParseInlineComments_P07` | P-07 | `-- This is a comment\n` before CREATE TABLE does not break parsing |
| `testParseBlockComments_P08` | P-08 | `/* block comment */` before CREATE TABLE does not break parsing |
| `testParseCRLFLineEndings_P09` | P-09 | `\r\n` Windows line endings in the SQL string are handled correctly |
| `testParseQuotedIdentifiers_P10` | P-10 | `"My Table"` and `"My Column"` are stripped of quotes and returned as plain strings |
| `testEmptyInput_P11` | P-11 | Empty string input throws `IllegalArgumentException` with "empty" in the message |

**P-12** was listed in the original test plan but not implemented yet — likely reserved for a `null` input test or a malformed SQL edge case.

**What's NOT tested (intentionally left for later sprints):**
- `SchemaService` (requires mock of `MigrationRunRepository` and `SqlParser` — a service-layer test)
- `MigrationController` (requires MockMvc — a web-layer test)
- `GlobalExceptionHandler` (integration test)
- `MigrationRunRepository` (Testcontainers integration test against real PostgreSQL)

---

## 12. Empty Packages

Three packages exist but contain no Java files yet:

| Package | Sprint | Purpose |
|---|---|---|
| `analyzer/` | Sprint 2 | Will hold `CompatibilityAnalyzer.java` — reads the `ParsedSchema` and produces `AnalysisReport` with HIGH/MEDIUM/LOW severity issues |
| `converter/` | Sprint 3 | Will hold `SqlConverter.java` — converts Oracle SQL strings to PostgreSQL-compatible SQL (`NVL` → `COALESCE`, `ROWNUM` → `LIMIT`, etc.) |
| `dto/` | Sprint 4 | Will hold DTOs like `MigrationRunDto` to decouple the API response shape from the JPA entity structure |

These empty packages are **intentional scaffolding** — they communicate the planned architecture to future developers without adding code prematurely.

---

## 13. How Everything Connects (Dependency Map)

```
                    ┌─────────────────────────────────────────────┐
                    │           Spring IoC Container               │
                    │                                              │
                    │  ┌─────────────────────┐                    │
HTTP Request ──────►│  │  MigrationController│                    │
                    │  └─────────┬───────────┘                    │
                    │            │ depends on                      │
                    │  ┌─────────▼───────────┐                    │
                    │  │   SchemaService      │                    │
                    │  └──┬──────────────┬───┘                    │
                    │     │              │   depends on            │
                    │  ┌──▼────────┐  ┌─▼───────────────────┐    │
                    │  │ SqlParser │  │MigrationRunRepository│    │
                    │  │(@Component│  │  (JPA interface)      │    │
                    │  └──┬────────┘  └─────────────┬────────┘    │
                    │     │                          │             │
                    │  ┌──▼──────────────────────┐  │             │
                    │  │   Model Layer (POJOs)    │  │             │
                    │  │  ParsedSchema            │  │             │
                    │  │    └─ Table              │  │             │
                    │  │        ├─ Column         │  │             │
                    │  │        └─ Constraint     │  │             │
                    │  └─────────────────────────-┘  │             │
                    │                                │             │
                    │                    ┌───────────▼──────────┐  │
                    │                    │  MigrationRun        │  │
                    │                    │  (@Entity → DB)      │  │
                    │                    └──────────────────────┘  │
                    │                                              │
                    │  ┌────────────────────────────────────────┐ │
                    │  │       GlobalExceptionHandler           │ │
                    │  │  (intercepts all thrown exceptions)    │ │
                    │  └────────────────────────────────────────┘ │
                    └─────────────────────────────────────────────┘
                                            │
                                   PostgreSQL (port 5432)
                                   migration_runs table
```

**Key rules enforced in Sprint 1:**
1. **Controller → Service only** (never Controller → Repository or Controller → Parser)
2. **Service → Parser + Repository** (service orchestrates everything)
3. **Parser → Model only** (parser has no DB awareness whatsoever)
4. **Repository → Entity only** (repository only knows about `MigrationRun`, not about `ParsedSchema`)
5. **GlobalExceptionHandler** is cross-cutting — catches exceptions from any layer

---

## 14. The Postman Collection

**File:** `SchemaForge.postman_collection.json` (repo root)

### What is a Postman Collection?

A Postman collection is a **JSON file that describes your API endpoints** — the URL, HTTP method, headers, request body, and example responses for each call. It is not just documentation; it is **executable documentation**. Anyone on the team imports it into Postman (or a compatible tool like Insomnia) and instantly has every API call ready to fire against a running server.

You do **not** need to install Postman to commit or maintain the `.json` file itself — it is plain JSON. But to actually run the requests interactively, you (or a teammate) needs Postman installed.

### How to Import and Use

1. Install [Postman](https://www.postman.com/downloads/) (free desktop app)
2. Open Postman → click **Import** (top left)
3. Select `SchemaForge.postman_collection.json` from the repo root
4. The collection appears in your left sidebar under **"SchemaForge — Sprint 1"**
5. Start the backend (`mvn spring-boot:run` inside `/backend`)
6. Run any request — the `{{base_url}}` variable defaults to `http://localhost:8080`

> **Tip:** To change the base URL (e.g. for a staging server), click the collection → **Variables** tab → update `base_url`.

---

### The Four Test Cases (API-01 to API-04)

All four target the same endpoint: `POST /api/v1/migrations/upload`

#### API-01 — Happy Path (Upload valid `.sql` file)

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `{{base_url}}/api/v1/migrations/upload` |
| Body | `form-data`: key=`file`, value=any `.sql` file |
| Expected status | `201 Created` |

This is the core success scenario. You attach `sql/samples/sample_01_basic_ddl.sql` as the `file` field. The backend parses all `CREATE TABLE` blocks, counts tables and columns, saves a `MigrationRun` to PostgreSQL, and returns it as JSON.

**Example response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fileName": "sample_01_basic_ddl.sql",
  "status": "PARSED",
  "tableCount": 3,
  "columnCount": 12,
  "createdAt": "2026-04-12T11:47:00Z"
}
```

---

#### API-02 — Custom `file_name` Override

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `{{base_url}}/api/v1/migrations/upload?file_name=my_custom_name.sql` |
| Body | `form-data`: key=`file`, value=any `.sql` file |
| Expected status | `201 Created` |

The optional `file_name` query parameter overrides the name stored in the `MigrationRun` record. Without it, the original file name is used. This is useful when the client renames the file before uploading, or when calling the API programmatically from a pipeline.

**What to check:** The `fileName` field in the response should be `my_custom_name.sql`, not the original file name.

---

#### API-03 — Non-`.sql` File → 400 Bad Request

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `{{base_url}}/api/v1/migrations/upload` |
| Body | `form-data`: key=`file`, value=any non-`.sql` file (e.g. `README.md`) |
| Expected status | `400 Bad Request` |

`SchemaService` checks the file extension **before** any parsing happens. If the extension is not `.sql` (case-insensitive), it throws an `IllegalArgumentException`. The `GlobalExceptionHandler` catches it and returns a structured 400 response.

**Example error response:**
```json
{
  "timestamp": "2026-04-12T11:49:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Uploaded file is not a valid SQL file.",
  "path": "/api/v1/migrations/upload"
}
```

**Why this matters:** Without this guard, someone could upload a binary file (e.g. a `.exe`) and the regex parser would either silently produce zero tables or blow up with a confusing error. The explicit extension check gives a clean, user-friendly error instead.

---

#### API-04 — File Exceeds 10MB → 413 Payload Too Large

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `{{base_url}}/api/v1/migrations/upload` |
| Body | `form-data`: key=`file`, value=any file larger than 10MB |
| Expected status | `413 Payload Too Large` |

The `application.properties` sets:
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

When either limit is breached, Spring Boot throws `MaxUploadSizeExceededException` **before the request even reaches the controller**. The `GlobalExceptionHandler` has a dedicated handler for this exception:

```java
@ExceptionHandler(MaxUploadSizeExceededException.class)
public ResponseEntity<ApiErrorResponse> handleMaxSizeException(...) {
    return buildErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE",
            "File size exceeds the 10MB limit.", request.getRequestURI());
}
```

**Example error response:**
```json
{
  "timestamp": "2026-04-12T11:50:00Z",
  "status": 413,
  "error": "PAYLOAD_TOO_LARGE",
  "message": "File size exceeds the 10MB limit.",
  "path": "/api/v1/migrations/upload"
}
```

**Why `max-request-size` also needs to be set:** The request size includes all `multipart/form-data` overhead (headers, boundaries, etc.) in addition to the raw file bytes. If only `max-file-size` is set, a slightly-over-limit file might slip through on the total request size. Both must match.

---

### Why You Need This Collection Right Now

Currently, the stack looks like this:
`[Postman] ←→ [Spring Boot API @ localhost:8080] ←→ [PostgreSQL]`

Because the **React Frontend won't be built until Sprint 4**, Postman is currently the only "UI" you have. Without it, you cannot manually test your endpoints, upload SQL files, or see what the backend responses look like.

### Why Keep This File in Version Control?

- **Shared test harness** — every dev gets the same API calls without rebuilding them manually
- **Living documentation** — the collection evolves with the API across sprints
- **CI/CD integration** — the collection can be run headlessly using [Newman](https://github.com/postmanlabs/newman) (`npx newman run SchemaForge.postman_collection.json`) as part of a pipeline
- **Onboarding** — a new team member has a working API explorer in under 2 minutes

---

> **Sprint 1 is complete.** The parser engine is proven by 11 passing JUnit tests. The REST endpoint is wired end-to-end. The database persistence layer is live. The Postman collection documents and demonstrates all four upload scenarios. Sprint 2 will add the `CompatibilityAnalyzer` on top of the `ParsedSchema` produced by this parser.
