import { Rule } from "../types";

import { findLineMatches, isJavaScriptFile } from "./shared";

export const rules: Rule[] = [
  {
    id: "sql-injection",
    title: "SQL Injection",
    severity: "critical",
    appliesTo: (file) => file.language === "javascript" || file.language === "typescript" || file.language === "python",
    check: (file) =>
      findLineMatches(file, [
        {
          regex: /\b(query|execute|raw)\s*\(/i,
          description:
            "A SQL query appears to be built with string interpolation or concatenation, which can allow attackers to inject arbitrary SQL.",
          fix: "Use parameterized queries or ORM parameter binding instead of string building.",
          predicate: (line) =>
            /(SELECT|INSERT|UPDATE|DELETE)/i.test(line) &&
            (line.includes("${") || /(\+\s*[A-Za-z_][A-Za-z0-9_.]*)/.test(line) || /f["'][^"']*\{/.test(line)),
        },
      ]),
  },
  {
    id: "dynamic-eval",
    title: "Dynamic eval() Or Function Constructor",
    severity: "critical",
    appliesTo: (file) => isJavaScriptFile(file),
    check: (file) =>
      findLineMatches(file, [
        {
          regex: /(?<!\.\$?)\beval\s*\(/,
          description:
            "Dynamic JavaScript evaluation runs attacker-controlled code if untrusted input reaches this line.",
          fix: "Remove eval() and replace it with explicit parsing or a fixed command map.",
        },
        {
          regex: /\bnew Function\s*\(/,
          description:
            "The Function constructor evaluates strings as code and creates the same injection risk as eval().",
          fix: "Replace dynamic code generation with explicit, validated control flow.",
        },
      ]),
  },
  {
    id: "python-eval-exec",
    title: "Python eval()/exec()",
    severity: "critical",
    appliesTo: (file) => file.language === "python",
    check: (file) =>
      findLineMatches(file, [
        {
          regex: /(?<!\w\.)(?<!re\.)(?<!\$)\b(eval|exec)\s*\(/,
          predicate: (line) => {
            const stripped = line.replace(/(["'`])(?:(?!\1).)*\1/g, '""');
            return /(?<!\w\.)(?<!re\.)(?<!\$)\b(eval|exec)\s*\(/.test(stripped);
          },
          description:
            "Python dynamic code execution is present and can become remote code execution if untrusted input reaches it.",
          fix: "Remove dynamic code execution and replace it with explicit parsing or a fixed command map.",
        },
      ]),
  },
];
