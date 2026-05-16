# Phase 3: Codebase Explained
## Live Schema Extraction Engine & DB End-to-End Testing

Phase 3 of the SchemaForge project introduced one of its most powerful features: the ability to bypass static SQL file uploads and connect directly to a live Oracle database to dynamically extract its structural DDL. 

This document details the architecture and implementation of the Live Schema Extraction pipeline built during Sprints 9, 10, and 10.5.

---

### 1. Oracle JDBC & Connectivity Configurations
To interface with live Oracle instances, the backend required dynamic driver support without compromising security.
- **The Implementation**: We imported the `ojdbc11` driver into the Maven `pom.xml`. To handle incoming connection requests, we sculpted a transient `OracleConnectionConfig` DTO.
- **Security Posture**: This DTO holds the host, port, service name, username, password, and schema variables. Crucially, the password is held in ephemeral memory state, utilized solely for the instantaneous JDBC socket connection, and is zeroed out immediately post-extraction to prevent credential leakage.

### 2. Data Hierarchy Upgrades (`ParsedSchema`)
The previous engine was only designed to parse base tables from uploaded SQL.
- **The Implementation**: We massively extended the `ParsedSchema` core domain model. It now natively encapsulates complex Oracle objects:
  - Tables & Columns
  - Primary Key, Foreign Key (including self-referencing), Unique, and Check Constraints
  - Performance Indexes
  - Views (including complex scalar subqueries and OUTER JOINs)
  - Stored Procedures & Triggers
  - Sequences

### 3. The `LiveSchemaExtractor` Engine
This is the core of the Phase 3 upgrade. Instead of using `JSqlParser` to parse text, this engine builds the AST directly from the database metadata.
- **The Implementation**: The engine establishes a JDBC connection and systematically scans Oracle's internal data dictionaries (`ALL_TABLES`, `ALL_TAB_COLUMNS`, `ALL_CONSTRAINTS`, `ALL_INDEXES`, `ALL_VIEWS`, `ALL_SOURCE`, etc.).
- **Data Translation**: It dynamically translates these dictionary records straight into the `ParsedSchema` object hierarchy, seamlessly bridging the gap between a live database state and the SchemaForge analysis pipeline.

### 4. API Routing & Frontend Network Panel
To expose this capability to the user:
- **Backend**: We configured a new controller endpoint `POST /api/v1/migrations/connect`. This route acts as a factory, taking the connection payload, triggering the extractor, saving the resulting `MigrationRun`, and returning it to the client.
- **Frontend**: We added a dedicated "Live Database" tab alongside the "File Upload" tab. This isolates the direct db-socket credential inputs with cleanly separated visual routing hooks, ensuring users understand they are establishing a live connection.

### 5. DDL Downstream Formatting & Compilation Rules
Because the Live Extractor skips the file-upload step, there is no "original SQL string" to convert. The conversion engine had to be taught how to *generate* DDL from scratch.
- **The Implementation**: We rewrote the linear string formatting behavior inside `SqlConverter`. 
- **Compilation Order**: The engine now guarantees that extracted structural environments compile correctly into ordered DDL statements to prevent dependency errors during PostgreSQL import. The strict generation sequence is:
  1. Sequences
  2. Base Tables & Columns
  3. Indexes
  4. Constraints (PK/FK/UQ)
  5. Views & Procedures

### 6. Live Validation & End-to-End Test Emulation
To prove the engine works against real-world, enterprise-grade data structures:
- **Oracle 23c Free Environment**: We constructed a `docker-compose.yml` to spin up a local `gvenzl/oracle-free:23-slim-faststart` instance containing a `FREEPDB1` pluggable database.
- **V1-V7 Seed Scripts**: We injected 7 layers of realistic e-commerce seed data covering sequences, all data types (including BLOB/CLOB), complex indexes, views, PL/SQL stored procedures with EXCEPTION blocks, and triggers.
- **The Result**: The `POST /connect` pipeline successfully extracted all objects, pushed them through the Compatibility Analyzer, and the Converter correctly emitted PostgreSQL-compatible `REFERENCES` clauses for foreign keys.

---

### Conclusion
Phase 3 fundamentally transformed SchemaForge from a static conversion tool into a dynamic database integration platform. It successfully proved the architecture's ability to scan live, complex Oracle environments and pipeline them into PostgreSQL structural definitions seamlessly.
