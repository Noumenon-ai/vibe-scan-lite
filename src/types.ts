export const severityOrder = ["critical", "high", "medium", "low"] as const;

export type Severity = (typeof severityOrder)[number];
export type LanguageFilter = "all" | "js" | "python";
export type ScanLanguage = "javascript" | "typescript" | "python" | "config";
export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ScanOptions {
  projectPath: string;
  projectDisplayPath: string;
  language: LanguageFilter;
  jsonOnly: boolean;
  verbose: boolean;
  maxFileSizeBytes: number;
}

export interface ScanFile {
  absolutePath: string;
  relativePath: string;
  language: ScanLanguage;
  content: string;
  size: number;
}

export interface RuleMatch {
  line: number;
  column: number;
  snippet: string;
  description: string;
  fix: string;
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  appliesTo: (file: ScanFile) => boolean;
  check: (file: ScanFile, context: RuleContext) => RuleMatch[];
}

export interface RuleContext {
  projectRoot: string;
  options: ScanOptions;
  files: ScanFile[];
  gitignorePatterns: string[];
  getFile: (relativePath: string) => ScanFile | undefined;
  isIgnoredByGitignore: (relativePath: string) => boolean;
}

export interface Finding {
  severity: Severity;
  rule: string;
  title: string;
  file: string;
  line: number;
  column: number;
  snippet: string;
  description: string;
  fix: string;
}

export interface ScanSummary {
  filesScanned: number;
  languages: string[];
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface GradeResult {
  grade: Grade;
  message: string;
}

export interface ScanReport {
  project: string;
  timestamp: string;
  grade: Grade;
  gradeMessage: string;
  summary: ScanSummary;
  findings: Finding[];
}

export interface ScanResult {
  report: ScanReport;
  outputPath: string;
  scannedFiles: string[];
}
