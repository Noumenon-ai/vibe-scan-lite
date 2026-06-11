"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverFiles = discoverFiles;
exports.summarizeLanguages = summarizeLanguages;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const glob_1 = require("glob");
const shared_1 = require("./rules/shared");
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
function discoverFiles(projectRoot, options) {
    const matches = new Set();
    [...CODE_PATTERNS, ...META_PATTERNS].forEach((pattern) => {
        const results = (0, glob_1.globSync)(pattern, {
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
        .filter((file) => Boolean(file))
        .filter((file) => shouldIncludeForLanguage(file, options.language));
}
function summarizeLanguages(files) {
    const languages = new Set();
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
function loadScanFile(projectRoot, absolutePath, maxFileSizeBytes) {
    const stats = node_fs_1.default.statSync(absolutePath);
    if (stats.size > maxFileSizeBytes) {
        return null;
    }
    const buffer = node_fs_1.default.readFileSync(absolutePath);
    if (buffer.includes(0)) {
        return null;
    }
    const relativePath = (0, shared_1.normalizePath)(node_path_1.default.relative(projectRoot, absolutePath));
    return {
        absolutePath,
        relativePath,
        language: detectLanguage(relativePath),
        content: buffer.toString("utf8"),
        size: stats.size,
    };
}
function shouldIncludeForLanguage(file, language) {
    if (language === "all") {
        return true;
    }
    if (language === "js") {
        return file.language !== "python" && !file.relativePath.endsWith("requirements.txt");
    }
    if (language === "python") {
        return (file.language !== "javascript" &&
            file.language !== "typescript" &&
            !file.relativePath.endsWith("package.json"));
    }
    return true;
}
function detectLanguage(relativePath) {
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
