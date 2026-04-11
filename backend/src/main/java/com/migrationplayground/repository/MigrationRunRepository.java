package com.migrationplayground.repository;

import com.migrationplayground.model.MigrationRun;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MigrationRunRepository extends JpaRepository<MigrationRun, UUID> {
}
