# Phase 2: Codebase Explained
## System Hardening & Enterprise Upgrades

Phase 2 of the SchemaForge (Migration Playground) project focused on transforming the initial prototype into a secure, robust, and enterprise-ready application. We addressed technical debt, completely overhauled the parsing architecture, implemented stateless authentication, and modernized the frontend state management.

This document breaks down the major architectural changes implemented during Sprints 7 and 8.

---

### 1. Security & Configuration Extraction
In the initial prototype, database credentials and secret keys were hardcoded into `application.properties`. 
- **The Change**: All sensitive values were stripped and replaced with parameterised environment variables (e.g., `${DB_URL}`, `${JWT_SECRET}`).
- **Impact**: The application can now be securely deployed to cloud environments (like Railway) via environment injection without leaking credentials to version control. `application.properties` was added to `.gitignore` and an `.example` template was provided for local developer onboarding.

### 2. Service Layer Decoupling (Destroying the God Class)
The `SchemaService` had grown too large, handling everything from database persistence to PDF generation and file orchestration.
- **The Change**: The class was aggressively refactored.
  - `MigrationRunService`: Now strictly handles the database lifecycle, persistence, and retrieval of `MigrationRun` entities.
  - `ReportService`: Encapsulates all logic for aggregating data and generating JSON/PDF export files.
  - `SchemaService`: Retained purely as an orchestration layer, calling the specialized services in sequence.
- **Impact**: Separation of concerns, dramatically improved testability, and adherence to the Single Responsibility Principle.

### 3. JSqlParser AST Integration (Parser v2.0)
Phase 1 relied on a fragile, Regex-based `SqlParser` which struggled with complex constructs, multi-schema variables, and nested quotes.
- **The Change**: We integrated `JSqlParser`, a robust Java SQL parser that generates an Abstract Syntax Tree (AST).
- **Impact**: The engine now natively and securely processes complex dot-qualified names and edge cases, guaranteeing that the structural definitions extracted from the source SQL are accurate before being fed into the Compatibility Analyzer.

### 4. Spring Security & JWT Authentication
The application previously lacked any access control, making the history endpoint and upload pipelines public.
- **The Change**: Implemented Spring Security with JSON Web Tokens (JWT). We created a stateless `JwtAuthFilter` that intercepts all `/api/v1/migrations/**` traffic, verifying the token signature against an admin role.
- **Impact**: Endpoints are now locked down. Only authenticated clients can upload schemas, view history, or trigger conversions.

### 5. Frontend Modernization: React Query (TanStack)
The React frontend suffered from overly complex manual `useState` and `useEffect` hooks, leading to silent error swallowing, race conditions, and excessive re-rendering.
- **The Change**: We integrated `@tanstack/react-query` into the `Dashboard.tsx` component.
- **Impact**: React Query now handles robust data-caching, fetch deduplication, background refetching, and structured retries natively. Error states are explicitly exposed to the UI, allowing us to gracefully handle API failures.

### 6. Migration History Diffing UI
Users lacked visibility into how their schema files evolved over multiple iterations.
- **The Change**: We built a "History" tab within the Dashboard that fetches data from the `/history` endpoint. 
- **Impact**: Users can now see a differential breakdown of their past uploads, providing a clear audit trail of migration iterations.

### 7. CI/CD Quality Gates
To ensure code quality doesn't degrade as new features are added:
- **The Change**: We updated `pom.xml` to include a JaCoCo test coverage enforcement policy.
- **Impact**: The Maven build will automatically fail if the unit test coverage drops below 70%, forcing developers to maintain high testing standards.

---

### Conclusion
By the end of Phase 2, SchemaForge successfully transitioned from a static file-parser into a secure, hardened, AST-backed engine capable of reliable scaling and safe deployment.
