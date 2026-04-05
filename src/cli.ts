import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";
import { Command } from "commander";

import { renderTerminalReport, scanProject } from "./index";
import { LanguageFilter } from "./types";

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name("vibe-scan-lite")
    .description("Free security scanner for AI-generated JavaScript, TypeScript, and Python projects.")
    .argument("<project>", "Path to the project you want to scan")
    .option("--lang <language>", "Limit scanning to js or python", "all")
    .option("--json", "Print JSON only to stdout")
    .option("--verbose", "Show every scanned file")
    .action(async (projectPath: string, flags: { lang: string; json?: boolean; verbose?: boolean }) => {
      const resolvedProjectPath = path.resolve(projectPath);
      if (!fs.existsSync(resolvedProjectPath) || !fs.statSync(resolvedProjectPath).isDirectory()) {
        throw new Error(`Project directory not found: ${projectPath}`);
      }

      const language = normalizeLanguage(flags.lang);
      const result = await scanProject({
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

      process.stdout.write(
        `${renderTerminalReport(result.report, result.outputPath, result.scannedFiles, Boolean(flags.verbose))}\n`
      );
    });

  try {
    await program.parseAsync(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${chalk.redBright("Vibe Scan Lite failed:")} ${message}\n`);
    process.exitCode = 1;
  }
}

function normalizeLanguage(value: string): LanguageFilter {
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
