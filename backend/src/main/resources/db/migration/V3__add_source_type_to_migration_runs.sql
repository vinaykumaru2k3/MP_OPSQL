-- Sprint 9: Add source_type to distinguish FILE uploads from LIVE_DB extractions.
-- Default to 'FILE' to preserve all existing rows transparently.
ALTER TABLE migration_runs ADD COLUMN source_type VARCHAR(20) NOT NULL DEFAULT 'FILE';
