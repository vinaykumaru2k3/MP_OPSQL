package com.migrationplayground.repository;

import com.migrationplayground.model.AnalysisReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AnalysisReportRepository extends JpaRepository<AnalysisReport, UUID> {
}
