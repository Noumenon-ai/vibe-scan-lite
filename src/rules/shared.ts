import path from "node:path";

import { RuleMatch, ScanFile } from "../types";

export interface LinePattern {
  regex: RegExp;
  description: string;
  fix: string;
  predicate?: (
    line: string,
    lineNumber: number,
    lines: string[],
    file: ScanFile,
    match: RegExpExecArray
  ) => boolean;
}

export interface FindLineMatchOptions {
  includeComments?: boolean;
}

export function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function getBaseName(value: string): string {
  return path.posix.basename(normalizePath(value));
}

export function isCommentLine(file: ScanFile, line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }

  if (
    file.relativePath.endsWith(".py") ||
    getBaseName(file.relativePath).startsWith(".env") ||
    file.relativePath.endsWith(".gitignore")
  ) {
    return trimmed.startsWith("#");
  }

  if (file.relativePath.endsWith(".json")) {
    return false;
  }

  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("*/") ||
    trimmed.startsWith("<!--")
  );
}

export function createLineMatch(
  lineNumber: number,
  line: string,
  matchIndex: number,
  description: string,
  fix: string
): RuleMatch {
  return {
    line: lineNumber,
    column: matchIndex + 1,
    snippet: line.trim().slice(0, 220),
    description,
    fix,
  };
}

export function createFileMatch(
  file: ScanFile,
  description: string,
  fix: string,
  needle?: RegExp | string
): RuleMatch {
  const lines = file.content.split(/\r?\n/);
  let lineNumber = 1;
  let lineText = lines[0] ?? file.relativePath;

  if (needle) {
    const index = lines.findIndex((line) =>
      typeof needle === "string" ? line.includes(needle) : needle.test(line)
    );
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

export function findLineMatches(
  file: ScanFile,
  patterns: LinePattern[],
  options: FindLineMatchOptions = {}
): RuleMatch[] {
  const lines = file.content.split(/\r?\n/);
  const results: RuleMatch[] = [];

  lines.forEach((line, index) => {
    if (!options.includeComments && isCommentLine(file, line)) {
      return;
    }

    patterns.forEach((pattern) => {
      const flags = pattern.regex.flags.includes("g") ? pattern.regex.flags : `${pattern.regex.flags}g`;
      const regex = new RegExp(pattern.regex.source, flags);
      let match: RegExpExecArray | null = regex.exec(line);

      while (match) {
        if (!pattern.predicate || pattern.predicate(line, index + 1, lines, file, match)) {
          results.push(
            createLineMatch(index + 1, line, match.index ?? 0, pattern.description, pattern.fix)
          );
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

export function isJavaScriptFile(file: ScanFile): boolean {
  return file.language === "javascript" || file.language === "typescript";
}

export function dedupeMatches(matches: RuleMatch[]): RuleMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.line}:${match.column}:${match.snippet}:${match.description}:${match.fix}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
