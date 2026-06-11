"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonReport = writeJsonReport;
exports.renderTerminalReport = renderTerminalReport;
const promises_1 = __importDefault(require("node:fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
const types_1 = require("./types");
const severityLabel = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
};
const severityColor = {
    critical: chalk_1.default.redBright,
    high: chalk_1.default.hex("#ff8c42"),
    medium: chalk_1.default.yellow,
    low: chalk_1.default.cyan,
};
const gradeColor = {
    A: chalk_1.default.greenBright,
    B: chalk_1.default.green,
    C: chalk_1.default.yellowBright,
    D: chalk_1.default.hex("#ff8c42"),
    F: chalk_1.default.redBright,
};
async function writeJsonReport(outputPath, report) {
    await promises_1.default.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
function renderTerminalReport(report, outputPath, scannedFiles, verbose) {
    const lines = [];
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
    lines.push(`  ${formatCount("critical", report.summary.critical)}  ${formatCount("high", report.summary.high)}  ${formatCount("medium", report.summary.medium)}  ${formatCount("low", report.summary.low)}`);
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
        lines.push(`  ${chalk_1.default.greenBright("No issues found.")}`);
    }
    else {
        types_1.severityOrder.forEach((severity) => {
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
    lines.push(chalk_1.default.dim("  Want all 35+ security rules? Get the full version:"));
    lines.push(chalk_1.default.dim("  https://noumenon6.gumroad.com/l/vibe-scan"));
    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
function renderFinding(finding) {
    const label = severityColor[finding.severity](severityLabel[finding.severity]);
    const location = `${finding.file}:${finding.line}:${finding.column}`;
    const snippet = chalk_1.default.dim(`  > ${finding.snippet}`);
    return [
        `  ${label}  ${finding.title}`,
        `  ${location}`,
        snippet,
        `  ${finding.description}`,
        `  Fix: ${finding.fix}`,
    ].join("\n");
}
function formatCount(severity, count) {
    const colorize = severityColor[severity];
    return colorize(`■ ${count} ${severityLabel[severity]}`);
}
function formatLanguages(languages) {
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
function separator() {
    return "──────────────────────────────────────────────────────";
}
function boxTop() {
    return "╔══════════════════════════════════════════════════════╗";
}
function boxDivider() {
    return "╠══════════════════════════════════════════════════════╣";
}
function boxBottom() {
    return "╚══════════════════════════════════════════════════════╝";
}
function boxLine(value) {
    const trimmed = value.length > 50 ? `${value.slice(0, 47)}...` : value;
    return `║  ${trimmed.padEnd(50, " ")}║`;
}
