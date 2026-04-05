"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTerminalReport = void 0;
exports.scanProject = scanProject;
const node_path_1 = __importDefault(require("node:path"));
const grader_1 = require("./grader");
const report_1 = require("./report");
Object.defineProperty(exports, "renderTerminalReport", { enumerable: true, get: function () { return report_1.renderTerminalReport; } });
const rules_1 = require("./rules");
const shared_1 = require("./rules/shared");
const scanner_1 = require("./scanner");
const types_1 = require("./types");
async function scanProject(options) {
    const projectRoot = node_path_1.default.resolve(options.projectPath);
    const files = (0, scanner_1.discoverFiles)(projectRoot, options);
    const gitignorePatterns = collectGitignorePatterns(files);
    const context = {
        projectRoot,
        options,
        files,
        gitignorePatterns,
        getFile: (relativePath) => files.find((file) => (0, shared_1.normalizePath)(file.relativePath) === (0, shared_1.normalizePath)(relativePath)),
        isIgnoredByGitignore: (relativePath) => isIgnoredByGitignore(relativePath, gitignorePatterns),
    };
    const findings = files.flatMap((file) => rules_1.allRules.flatMap((rule) => {
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
    }));
    const dedupedFindings = dedupeFindings(findings).sort(compareFindings);
    const summary = {
        filesScanned: files.length,
        languages: (0, scanner_1.summarizeLanguages)(files),
        critical: dedupedFindings.filter((finding) => finding.severity === "critical").length,
        high: dedupedFindings.filter((finding) => finding.severity === "high").length,
        medium: dedupedFindings.filter((finding) => finding.severity === "medium").length,
        low: dedupedFindings.filter((finding) => finding.severity === "low").length,
        total: dedupedFindings.length,
    };
    const grade = (0, grader_1.calculateGrade)(summary);
    const report = {
        project: options.projectDisplayPath,
        timestamp: new Date().toISOString(),
        grade: grade.grade,
        gradeMessage: grade.message,
        summary,
        findings: dedupedFindings,
    };
    const outputPath = node_path_1.default.join(projectRoot, "vibe-scan-report.json");
    if (!options.jsonOnly) {
        await (0, report_1.writeJsonReport)(outputPath, report);
    }
    return {
        report,
        outputPath,
        scannedFiles: files.map((file) => file.relativePath),
    };
}
function collectGitignorePatterns(files) {
    return files
        .filter((file) => file.relativePath.endsWith(".gitignore"))
        .flatMap((file) => file.content.split(/\r?\n/))
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map((line) => (0, shared_1.normalizePath)(line));
}
function isIgnoredByGitignore(relativePath, patterns) {
    const normalizedPath = (0, shared_1.normalizePath)(relativePath);
    const baseName = node_path_1.default.posix.basename(normalizedPath);
    let ignored = false;
    for (const pattern of patterns) {
        const isNegation = pattern.startsWith("!");
        const raw = isNegation ? pattern.slice(1) : pattern;
        const normalizedPattern = (0, shared_1.normalizePath)(raw.replace(/\/$/, ""));
        if (!normalizedPattern) {
            continue;
        }
        let matches = false;
        if (normalizedPattern === normalizedPath || normalizedPattern === baseName) {
            matches = true;
        }
        else if (normalizedPattern === ".env" && baseName === ".env") {
            matches = true;
        }
        else if ((normalizedPattern === ".env.*" || normalizedPattern === ".env*") && baseName.startsWith(".env")) {
            matches = true;
        }
        else if (normalizedPattern.endsWith("*")) {
            const prefix = normalizedPattern.slice(0, -1);
            matches = normalizedPath.startsWith(prefix) || baseName.startsWith(prefix);
        }
        if (matches) {
            ignored = !isNegation;
        }
    }
    return ignored;
}
function dedupeFindings(findings) {
    const seen = new Set();
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
function compareFindings(left, right) {
    const severityDelta = types_1.severityOrder.indexOf(left.severity) - types_1.severityOrder.indexOf(right.severity);
    if (severityDelta !== 0) {
        return severityDelta;
    }
    return (left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.column - right.column ||
        left.rule.localeCompare(right.rule));
}
