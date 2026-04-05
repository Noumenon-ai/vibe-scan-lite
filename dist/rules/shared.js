"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = normalizePath;
exports.getBaseName = getBaseName;
exports.isCommentLine = isCommentLine;
exports.createLineMatch = createLineMatch;
exports.createFileMatch = createFileMatch;
exports.findLineMatches = findLineMatches;
exports.isJavaScriptFile = isJavaScriptFile;
exports.dedupeMatches = dedupeMatches;
const node_path_1 = __importDefault(require("node:path"));
function normalizePath(value) {
    return value.replace(/\\/g, "/");
}
function getBaseName(value) {
    return node_path_1.default.posix.basename(normalizePath(value));
}
function isCommentLine(file, line) {
    const trimmed = line.trim();
    if (!trimmed) {
        return true;
    }
    if (file.relativePath.endsWith(".py") ||
        getBaseName(file.relativePath).startsWith(".env") ||
        file.relativePath.endsWith(".gitignore")) {
        return trimmed.startsWith("#");
    }
    if (file.relativePath.endsWith(".json")) {
        return false;
    }
    return (trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("*/") ||
        trimmed.startsWith("<!--"));
}
function createLineMatch(lineNumber, line, matchIndex, description, fix) {
    return {
        line: lineNumber,
        column: matchIndex + 1,
        snippet: line.trim().slice(0, 220),
        description,
        fix,
    };
}
function createFileMatch(file, description, fix, needle) {
    const lines = file.content.split(/\r?\n/);
    let lineNumber = 1;
    let lineText = lines[0] ?? file.relativePath;
    if (needle) {
        const index = lines.findIndex((line) => typeof needle === "string" ? line.includes(needle) : needle.test(line));
        if (index >= 0) {
            lineNumber = index + 1;
            lineText = lines[index];
        }
    }
    if (!lineText.trim()) {
        const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0);
        if (firstNonEmptyIndex >= 0) {
            lineNumber = firstNonEmptyIndex + 1;
            lineText = lines[firstNonEmptyIndex];
        }
    }
    return createLineMatch(lineNumber, lineText || file.relativePath, 0, description, fix);
}
function findLineMatches(file, patterns, options = {}) {
    const lines = file.content.split(/\r?\n/);
    const results = [];
    lines.forEach((line, index) => {
        if (!options.includeComments && isCommentLine(file, line)) {
            return;
        }
        patterns.forEach((pattern) => {
            const flags = pattern.regex.flags.includes("g") ? pattern.regex.flags : `${pattern.regex.flags}g`;
            const regex = new RegExp(pattern.regex.source, flags);
            let match = regex.exec(line);
            while (match) {
                if (!pattern.predicate || pattern.predicate(line, index + 1, lines, file, match)) {
                    results.push(createLineMatch(index + 1, line, match.index ?? 0, pattern.description, pattern.fix));
                    break;
                }
                if (match[0].length === 0) {
                    regex.lastIndex += 1;
                }
                match = regex.exec(line);
            }
        });
    });
    return dedupeMatches(results);
}
function isJavaScriptFile(file) {
    return file.language === "javascript" || file.language === "typescript";
}
function dedupeMatches(matches) {
    const seen = new Set();
    return matches.filter((match) => {
        const key = `${match.line}:${match.column}:${match.snippet}:${match.description}:${match.fix}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
