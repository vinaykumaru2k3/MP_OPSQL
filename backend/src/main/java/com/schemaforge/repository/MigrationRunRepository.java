package com.schemaforge.repository;

import com.schemaforge.model.MigrationRun;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MigrationRunRepository extends JpaRepository<MigrationRun, UUID> {
    java.util.List<MigrationRun> findByUserIdAndFileNameOrderByCreatedAtDesc(UUID userId, String fileName);
    java.util.List<MigrationRun> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
