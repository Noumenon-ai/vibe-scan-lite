"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const { scanProject } = require("../dist/index.js");

function makeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-scan-test-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }
  return root;
}

async function scan(root) {
  const result = await scanProject({
    projectPath: root,
    projectDisplayPath: root,
    language: "all",
    jsonOnly: true,
    verbose: false,
    maxFileSizeBytes: 1024 * 1024,
  });
  return result.report;
}

test("committed .env with no .gitignore is flagged (rules 4/5)", async () => {
  const root = makeProject({
    ".env": "SECRET=abc\n",
    "src/app.js": 'console.log("hello");\n',
  });

  const report = await scan(root);
  const envFindings = report.findings.filter((f) => f.rule === "env-file-not-ignored");

  assert.equal(envFindings.length, 1);
  assert.equal(envFindings[0].file, ".env");
  assert.equal(envFindings[0].severity, "critical");
  assert.notEqual(report.grade, "A");
});

test(".env ignored by .gitignore is not flagged", async () => {
  const root = makeProject({
    ".env": "SECRET=abc\n",
    ".gitignore": ".env\n.env.*\n",
    "src/app.js": 'console.log("hello");\n',
  });

  const report = await scan(root);
  const envFindings = report.findings.filter((f) => f.rule === "env-file-not-ignored");

  assert.equal(envFindings.length, 0);
});

test("raw OpenAI-style key value in source is flagged", async () => {
  const root = makeProject({
    ".gitignore": ".env\n",
    "src/openai.js": 'const key = "sk-proj-Ab12Cd34Ef56Gh78Ij90Kl12Mn34";\n',
  });

  const report = await scan(root);
  const keyFindings = report.findings.filter((f) => f.rule === "hardcoded-api-key");

  assert.equal(keyFindings.length, 1);
  assert.equal(keyFindings[0].file, "src/openai.js");
});

test("identifiers merely containing sk- are not flagged", async () => {
  const root = makeProject({
    ".gitignore": ".env\n",
    "src/clean.js":
      'const label = "risk-assessment-very-long-identifier-name";\n' +
      'const cssClass = "desk-arrangement-layout-grid-container";\n',
  });

  const report = await scan(root);
  const keyFindings = report.findings.filter((f) => f.rule === "hardcoded-api-key");

  assert.equal(keyFindings.length, 0);
});

test("eval and SQL interpolation rules still fire", async () => {
  const root = makeProject({
    ".gitignore": ".env\n",
    "src/bad.js":
      "function run(userInput, db, userId) {\n" +
      "  eval(userInput);\n" +
      "  return db.query(`SELECT * FROM users WHERE id = ${userId}`);\n" +
      "}\n",
  });

  const report = await scan(root);
  const rules = new Set(report.findings.map((f) => f.rule));

  assert.ok(rules.size >= 2, `expected at least 2 distinct rules, got ${[...rules].join(", ")}`);
});

test("clean project grades A", async () => {
  const root = makeProject({
    ".gitignore": ".env\n.env.*\n",
    "src/app.js": 'const name = process.env.APP_NAME;\nconsole.log(name);\n',
  });

  const report = await scan(root);

  assert.equal(report.findings.length, 0);
  assert.equal(report.grade, "A");
});
