#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const cliPath = path.join(__dirname, "..", "dist", "cli.js");

if (!fs.existsSync(cliPath)) {
  console.error("Build output not found. Run npm install && npm run build first.");
  process.exit(1);
}

const { runCli } = require(cliPath);

Promise.resolve(runCli(process.argv)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
