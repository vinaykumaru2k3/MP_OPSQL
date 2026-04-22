CREATE TABLE validation_results (
    migration_run_id UUID PRIMARY KEY REFERENCES migration_runs(id) ON DELETE CASCADE,
    validation_status VARCHAR(50) NOT NULL,
    tables_validated_count INTEGER NOT NULL DEFAULT 0,
    tables_matched_count INTEGER NOT NULL DEFAULT 0,
    validated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE table_validation_metrics (
    id BIGSERIAL PRIMARY KEY,
    migration_run_id UUID NOT NULL REFERENCES validation_results(migration_run_id) ON DELETE CASCADE,
    table_name VARCHAR(255) NOT NULL,
    source_row_count BIGINT,
    target_row_count BIGINT,
    row_count_match BOOLEAN,
    data_type_match BOOLEAN,
    null_count_match BOOLEAN
);
