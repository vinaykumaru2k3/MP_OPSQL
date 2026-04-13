export interface MigrationRun {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PARSED' | 'ANALYZED' | 'CONVERTED';
  tableCount: number;
  columnCount: number;
  createdAt: string;
  rawSql?: string;
}

export interface AnalysisIssue {
  construct: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface AnalysisReport {
  migrationRunId: string;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  issues: AnalysisIssue[];
}

export interface ConvertedScript {
  migrationRunId: string;
  convertedSql: string;
}

export interface TableValidationMetric {
  tableName: string;
  sourceRowCount: number;
  targetRowCount: number;
  rowCountMatch: boolean;
  dataTypeMatch: boolean;
  nullCountMatch: boolean;
}

export interface ValidationResult {
  migrationRunId: string;
  validationStatus: 'PASSED' | 'WARNING' | 'FAILED';
  tablesValidatedCount: number;
  tablesMatchedCount: number;
  validatedAt: string;
  metrics: TableValidationMetric[];
}
