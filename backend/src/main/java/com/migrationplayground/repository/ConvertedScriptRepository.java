package com.migrationplayground.repository;

import com.migrationplayground.model.ConvertedScript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConvertedScriptRepository extends JpaRepository<ConvertedScript, UUID> {
}
