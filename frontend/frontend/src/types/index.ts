export interface MigrationRun {
  id: string;
  fileName: string;
  status: string;
  tableCount: number;
  columnCount: number;
  createdAt: string;
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
