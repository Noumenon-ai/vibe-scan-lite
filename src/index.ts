import path from "node:path";

import { calculateGrade } from "./grader";
import { renderTerminalReport, writeJsonReport } from "./report";
import { allRules } from "./rules";
import { normalizePath } from "./rules/shared";
import { discoverFiles, summarizeLanguages } from "./scanner";
import { Finding, RuleContext, ScanOptions, ScanReport, ScanResult, severityOrder } from "./types";

export async function scanProject(options: ScanOptions): Promise<ScanResult> {
  const projectRoot = path.resolve(options.projectPath);
  const files = discoverFiles(projectRoot, options);
  const gitignorePatterns = collectGitignorePatterns(files);
  const context: RuleContext = {
    projectRoot,
    options,
    files,
    gitignorePatterns,
    getFile: (relativePath) =>
      files.find((file) => normalizePath(file.relativePath) === normalizePath(relativePath)),
    isIgnoredByGitignore: (relativePath) => isIgnoredByGitignore(relativePath, gitignorePatterns),
  };

  const findings: Finding[] = files.flatMap((file) =>
    allRules.flatMap((rule) => {
      if (!rule.appliesTo(file)) {
        return [];
      }

      return rule.check(file, context).map((match) => ({
        severity: rule.severity,
        rule: rule.id,
        title: rule.title,
        file: file.relativePath,
        line: match.line,
        column: match.column,
        snippet: match.snippet,
        description: match.description,
        fix: match.fix,
      }));
    })
  );

  const dedupedFindings = dedupeFindings(findings).sort(compareFindings);
  const summary = {
    filesScanned: files.length,
    languages: summarizeLanguages(files),
    critical: dedupedFindings.filter((finding) => finding.severity === "critical").length,
    high: dedupedFindings.filter((finding) => finding.severity === "high").length,
    medium: dedupedFindings.filter((finding) => finding.severity === "medium").length,
    low: dedupedFindings.filter((finding) => finding.severity === "low").length,
    total: dedupedFindings.length,
  };
  const grade = calculateGrade(summary);
  const report: ScanReport = {
    project: options.projectDisplayPath,
    timestamp: new Date().toISOString(),
    grade: grade.grade,
    gradeMessage: grade.message,
    summary,
    findings: dedupedFindings,
  };
  const outputPath = path.join(projectRoot, "vibe-scan-report.json");

  if (!options.jsonOnly) {
    await writeJsonReport(outputPath, report);
  }

  return {
    report,
    outputPath,
    scannedFiles: files.map((file) => file.relativePath),
  };
}

export { renderTerminalReport };

function collectGitignorePatterns(files: RuleContext["files"]): string[] {
  return files
    .filter((file) => file.relativePath.endsWith(".gitignore"))
    .flatMap((file) => file.content.split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => normalizePath(line));
}

function isIgnoredByGitignore(relativePath: string, patterns: string[]): boolean {
  const normalizedPath = normalizePath(relativePath);
  const baseName = path.posix.basename(normalizedPath);
  let ignored = false;

  for (const pattern of patterns) {
    const isNegation = pattern.startsWith("!");
    const raw = isNegation ? pattern.slice(1) : pattern;
    const normalizedPattern = normalizePath(raw.replace(/\/$/, ""));
    if (!normalizedPattern) {
      continue;
    }

    let matches = false;

    if (normalizedPattern === normalizedPath || normalizedPattern === baseName) {
      matches = true;
    } else if (normalizedPattern === ".env" && baseName === ".env") {
      matches = true;
    } else if ((normalizedPattern === ".env.*" || normalizedPattern === ".env*") && baseName.startsWith(".env")) {
      matches = true;
    } else if (normalizedPattern.endsWith("*")) {
      const prefix = normalizedPattern.slice(0, -1);
      matches = normalizedPath.startsWith(prefix) || baseName.startsWith(prefix);
    }

    if (matches) {
      ignored = !isNegation;
    }
  }

  return ignored;
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = [
      finding.rule,
      finding.file,
      finding.line,
      finding.column,
      finding.snippet,
      finding.fix,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareFindings(left: Finding, right: Finding): number {
  const severityDelta =
    severityOrder.indexOf(left.severity) - severityOrder.indexOf(right.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }

  return (
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.column - right.column ||
    left.rule.localeCompare(right.rule)
  );
}
