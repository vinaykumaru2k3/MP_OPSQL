# Sprint 4 Codebase Explained: Database Persistence & React UI Scaffold

This document provides a technical deep-dive into the core components implemented during **Sprint 4**. The focus was on transitioning the application from temporary in-memory caching to a persistent PostgreSQL backend and establishing a modern React frontend foundation.

## 1. Backend Persistence Architecture

### 1.1 Database Migration (Flyway)
To ensure schema versioning and consistency across environments, we integrated **Flyway**.
- **`V1__initial_schema.sql`**: Defines the physical tables in PostgreSQL:
    - `migration_runs`: Primary record for uploaded files and metadata.
    - `analysis_reports`: 1:1 relationship with `migration_runs` for high-level metrics.
    - `analysis_issues`: Detailed list of detected Oracle constructs.
    - `converted_scripts`: Stores the generated PostgreSQL output and the original source.

### 1.2 JPA Repository Layer
The previous `ConcurrentHashMap` caches in `SchemaService` were replaced with Spring Data JPA repositories:
- **`MigrationRunRepository`**: Manages the lifecycle of migration runs.
- **`AnalysisReportRepository`**: Persists analysis results and their associated issues.
- **`ConvertedScriptRepository`**: Handles storage and retrieval of converted SQL scripts.

### 1.3 Service Refactoring (`SchemaService`)
`SchemaService` was refactored to prioritize persistence:
- **`uploadAndParse`**: Now saves the `MigrationRun` (including `rawSql` as a `TEXT` blob) to the database immediately.
- **`analyze`**: Retrieves the `rawSql` from the database, performs analysis, and persists the resulting `AnalysisReport`.
- **`convert`**: Generates the PostgreSQL script and saves it to the `converted_scripts` table.

## 2. Frontend Foundation (Vite + React + TS)

The frontend is a modular, type-safe React application built with **Vite** and **TypeScript**.

### 2.1 API Service (`migrationApi.ts`)
A centralized Axios service handles all communication with the backend. It uses a custom type system to ensure that data structures on the frontend exactly match the backend DTOs.

### 2.2 Core Components & Routing
- **`Layout.tsx`**: A consistent wrapper with navigation and branding.
- **`Home.tsx`**: Features a drag-and-drop file upload interface using `react-dropzone`.
- **`Dashboard.tsx`**: A comprehensive analysis view including:
    - **Severity Cards**: Quick metrics for High, Medium, and Low issues.
    - **Recharts Integration**: A PieChart visualizing the severity distribution.
    - **Issue List**: Interactive list of detected incompatibilities with severity filtering.
    - **SQL Preview**: A dark-themed code block for reviewing and downloading the converted script.

## 3. Integration & CORS
To enable development with the Vite dev server (`port 5173`) and the backend (`port 8080`), we implemented **`WebConfig.java`**:
- Configures CORS to allow cross-origin requests from the frontend to the `/api/**` endpoints.

## 4. Verification & Hardening
- **Backend Tests**: All 46 unit tests across `SqlParser`, `CompatibilityAnalyzer`, and `SqlConverter` were executed and passed, ensuring that the move to JPA repositories did not break existing logic.
- **Frontend Build**: The project was verified to build successfully (`npm run build`) after resolving TypeScript type-only import requirements.
