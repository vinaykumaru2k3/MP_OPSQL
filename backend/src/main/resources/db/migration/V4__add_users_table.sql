CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE migration_runs ADD COLUMN user_id UUID;

ALTER TABLE migration_runs ADD CONSTRAINT fk_migration_run_user FOREIGN KEY (user_id) REFERENCES users(id);
