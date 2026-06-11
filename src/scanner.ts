import fs from "node:fs";
import path from "node:path";

import { globSync } from "glob";

import { ScanFile, ScanLanguage, ScanOptions } from "./types";
import { normalizePath } from "./rules/shared";

const CODE_PATTERNS = ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.cjs", "**/*.py"];
const META_PATTERNS = ["**/.env*", "**/.gitignore", "**/package.json", "**/requirements.txt"];
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/__pycache__/**",
  "**/.venv*/**",
  "**/venv*/**",
  // NOTE: never add "**/.env/**" here. glob's ignore handling treats
  // "<dir>/**" as also excluding the path itself, so "**/.env/**" silently
  // excluded .env FILES and broke the .env/.gitignore rules entirely.
  "**/env/lib/**",
  "**/env/bin/**",
  "**/env/Scripts/**",
  "**/.next/**",
  "**/coverage/**",
  "**/__tests__/**",
  "**/tests/**",
  "**/test/**",
  "**/*.test.*",
  "**/*.spec.*",
  "**/fixtures/**",
  "**/vulnservers/**",
  "**/testdata/**",
];

export function discoverFiles(projectRoot: string, options: ScanOptions): ScanFile[] {
  const matches = new Set<string>();

  [...CODE_PATTERNS, ...META_PATTERNS].forEach((pattern) => {
    const results = globSync(pattern, {
      cwd: projectRoot,
      absolute: true,
      nodir: true,
      dot: true,
      ignore: IGNORE_PATTERNS,
    });

    results.forEach((result) => matches.add(result));
  });

  return [...matches]
    .sort((left, right) => left.localeCompare(right))
    .map((absolutePath) => loadScanFile(projectRoot, absolutePath, options.maxFileSizeBytes))
    .filter((file): file is ScanFile => Boolean(file))
    .filter((file) => shouldIncludeForLanguage(file, options.language));
}

export function summarizeLanguages(files: ScanFile[]): string[] {
  const languages = new Set<string>();

  files.forEach((file) => {
    if (file.language === "javascript") {
      languages.add("javascript");
    }

    if (file.language === "typescript") {
      languages.add("typescript");
    }

    if (file.language === "python") {
      languages.add("python");
    }
  });

  return [...languages];
}

function loadScanFile(projectRoot: string, absolutePath: string, maxFileSizeBytes: number): ScanFile | null {
  const stats = fs.statSync(absolutePath);
  if (stats.size > maxFileSizeBytes) {
    return null;
  }

  const buffer = fs.readFileSync(absolutePath);
  if (buffer.includes(0)) {
    return null;
  }

  const relativePath = normalizePath(path.relative(projectRoot, absolutePath));
  return {
    absolutePath,
    relativePath,
    language: detectLanguage(relativePath),
    content: buffer.toString("utf8"),
    size: stats.size,
  };
}

function shouldIncludeForLanguage(file: ScanFile, language: ScanOptions["language"]): boolean {
  if (language === "all") {
    return true;
  }

  if (language === "js") {
    return file.language !== "python" && !file.relativePath.endsWith("requirements.txt");
  }

  if (language === "python") {
    return (
      file.language !== "javascript" &&
      file.language !== "typescript" &&
      !file.relativePath.endsWith("package.json")
    );
  }

  return true;
}

function detectLanguage(relativePath: string): ScanLanguage {
  const value = relativePath.toLowerCase();
  if (value.endsWith(".py")) {
    return "python";
  }

  if (value.endsWith(".ts") || value.endsWith(".tsx")) {
    return "typescript";
  }

  if (/\.(js|jsx|mjs|cjs)$/.test(value)) {
    return "javascript";
  }

  return "config";
}
