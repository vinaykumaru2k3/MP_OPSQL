CREATE TABLE migration_runs (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    table_count INTEGER,
    column_count INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    raw_sql TEXT
);

CREATE TABLE analysis_reports (
    migration_run_id UUID PRIMARY KEY REFERENCES migration_runs(id) ON DELETE CASCADE,
    high_severity_count INTEGER NOT NULL DEFAULT 0,
    medium_severity_count INTEGER NOT NULL DEFAULT 0,
    low_severity_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE analysis_issues (
    report_id UUID NOT NULL REFERENCES analysis_reports(migration_run_id) ON DELETE CASCADE,
    construct VARCHAR(255),
    severity VARCHAR(50),
    description TEXT
);

CREATE TABLE converted_scripts (
    migration_run_id UUID PRIMARY KEY REFERENCES migration_runs(id) ON DELETE CASCADE,
    original_sql TEXT,
    converted_sql TEXT
);
