package com.schemaforge.repository;

import com.schemaforge.model.ConvertedScript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConvertedScriptRepository extends JpaRepository<ConvertedScript, UUID> {
}
