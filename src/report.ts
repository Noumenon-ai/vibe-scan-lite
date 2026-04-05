import fs from "node:fs/promises";

import chalk from "chalk";

import { Finding, Grade, ScanReport, Severity, severityOrder } from "./types";

const severityLabel: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const severityColor: Record<Severity, (value: string) => string> = {
  critical: chalk.redBright,
  high: chalk.hex("#ff8c42"),
  medium: chalk.yellow,
  low: chalk.cyan,
};

const gradeColor: Record<Grade, (value: string) => string> = {
  A: chalk.greenBright,
  B: chalk.green,
  C: chalk.yellowBright,
  D: chalk.hex("#ff8c42"),
  F: chalk.redBright,
};

export async function writeJsonReport(outputPath: string, report: ScanReport): Promise<void> {
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export function renderTerminalReport(
  report: ScanReport,
  outputPath: string,
  scannedFiles: string[],
  verbose: boolean
): string {
  const lines: string[] = [];

  lines.push(boxTop());
  lines.push(boxLine("VIBE SCAN LITE — Security Report"));
  lines.push(boxDivider());
  lines.push(boxLine(`Project: ${report.project}`));
  lines.push(boxLine(`Files scanned: ${String(report.summary.filesScanned)}`));
  lines.push(boxLine(`Languages: ${formatLanguages(report.summary.languages)}`));
  lines.push(boxBottom());
  lines.push("");
  lines.push(`  Grade: ${gradeColor[report.grade](report.grade)}  ${report.gradeMessage}`);
  lines.push("");
  lines.push(`  Found ${report.summary.total} issues:`);
  lines.push(
    `  ${formatCount("critical", report.summary.critical)}  ${formatCount("high", report.summary.high)}  ${formatCount("medium", report.summary.medium)}  ${formatCount("low", report.summary.low)}`
  );

  if (verbose && scannedFiles.length > 0) {
    lines.push("");
    lines.push("  Scanned files:");
    scannedFiles.forEach((file) => {
      lines.push(`  - ${file}`);
    });
  }

  lines.push("");
  lines.push(separator());

  if (report.findings.length === 0) {
    lines.push("");
    lines.push(`  ${chalk.greenBright("No issues found.")}`);
  } else {
    severityOrder.forEach((severity) => {
      const findings = report.findings.filter((finding) => finding.severity === severity);
      if (findings.length === 0) {
        return;
      }

      lines.push("");
      findings.forEach((finding) => {
        lines.push(renderFinding(finding));
        lines.push("");
      });
    });
  }

  lines.push(separator());
  lines.push(`  Full report saved to: ${outputPath}`);
  lines.push("");
  lines.push(chalk.dim("  Want all 35+ security rules? Get the full version:"));
  lines.push(chalk.dim("  https://YOURGUMROAD.com/l/vibe-scan"));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function renderFinding(finding: Finding): string {
  const label = severityColor[finding.severity](severityLabel[finding.severity]);
  const location = `${finding.file}:${finding.line}:${finding.column}`;
  const snippet = chalk.dim(`  > ${finding.snippet}`);
  return [
    `  ${label}  ${finding.title}`,
    `  ${location}`,
    snippet,
    `  ${finding.description}`,
    `  Fix: ${finding.fix}`,
  ].join("\n");
}

function formatCount(severity: Severity, count: number): string {
  const colorize = severityColor[severity];
  return colorize(`■ ${count} ${severityLabel[severity]}`);
}

function formatLanguages(languages: string[]): string {
  if (languages.length === 0) {
    return "None";
  }

  return languages
    .map((language) => {
      if (language === "javascript") {
        return "JavaScript";
      }

      if (language === "typescript") {
        return "TypeScript";
      }

      if (language === "python") {
        return "Python";
      }

      return language;
    })
    .join(", ");
}

function separator(): string {
  return "──────────────────────────────────────────────────────";
}

function boxTop(): string {
  return "╔══════════════════════════════════════════════════════╗";
}

function boxDivider(): string {
  return "╠══════════════════════════════════════════════════════╣";
}

function boxBottom(): string {
  return "╚══════════════════════════════════════════════════════╝";
}

function boxLine(value: string): string {
  const trimmed = value.length > 50 ? `${value.slice(0, 47)}...` : value;
  return `║  ${trimmed.padEnd(50, " ")}║`;
}
