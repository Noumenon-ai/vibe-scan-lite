"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = runCli;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const index_1 = require("./index");
async function runCli(argv = process.argv) {
    const program = new commander_1.Command();
    program
        .name("vibe-scan-lite")
        .description("Free security scanner for AI-generated JavaScript, TypeScript, and Python projects.")
        .argument("<project>", "Path to the project you want to scan")
        .option("--lang <language>", "Limit scanning to js or python", "all")
        .option("--json", "Print JSON only to stdout")
        .option("--verbose", "Show every scanned file")
        .action(async (projectPath, flags) => {
        const resolvedProjectPath = node_path_1.default.resolve(projectPath);
        if (!node_fs_1.default.existsSync(resolvedProjectPath) || !node_fs_1.default.statSync(resolvedProjectPath).isDirectory()) {
            throw new Error(`Project directory not found: ${projectPath}`);
        }
        const language = normalizeLanguage(flags.lang);
        const result = await (0, index_1.scanProject)({
            projectPath: resolvedProjectPath,
            projectDisplayPath: projectPath,
            language,
            jsonOnly: Boolean(flags.json),
            verbose: Boolean(flags.verbose),
            maxFileSizeBytes: 1024 * 1024,
        });
        if (flags.json) {
            process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
            return;
        }
        process.stdout.write(`${(0, index_1.renderTerminalReport)(result.report, result.outputPath, result.scannedFiles, Boolean(flags.verbose))}\n`);
    });
    try {
        await program.parseAsync(argv);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${chalk_1.default.redBright("Vibe Scan Lite failed:")} ${message}\n`);
        process.exitCode = 1;
    }
}
function normalizeLanguage(value) {
    if (value === "js") {
        return "js";
    }
    if (value === "python") {
        return "python";
    }
    if (value === "all") {
        return "all";
    }
    throw new Error(`Unsupported language filter: ${value}. Use "all", "js", or "python".`);
}
if (require.main === module) {
    void runCli(process.argv);
}
