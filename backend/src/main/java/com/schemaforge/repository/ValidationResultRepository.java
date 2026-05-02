package com.schemaforge.repository;

import com.schemaforge.model.ValidationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ValidationResultRepository extends JpaRepository<ValidationResult, UUID> {
    boolean existsByMigrationRunId(UUID migrationRunId);
}
