# Vibe Scan Lite -- Free Security Scanner for AI-Generated Code

Stop shipping security holes. Vibe Scan Lite catches the **5 most dangerous patterns** that AI coding tools love to generate -- hardcoded secrets, injection vulnerabilities, and exposed environment files.

Zero config. Zero cloud. Runs entirely offline on your machine.

```
npx vibe-scan-lite ./my-project
```

## What It Catches

| # | Rule | Severity | What It Finds |
|---|------|----------|---------------|
| 1 | **Hardcoded API Keys** | CRITICAL | AWS keys (`AKIA...`), Stripe keys (`sk_live_...`), OpenAI keys, SendGrid, Twilio, and more baked directly into source code |
| 2 | **eval() / exec() usage** | CRITICAL | JavaScript `eval()`, `new Function()`, and Python `eval()`/`exec()` -- the fastest path to remote code execution |
| 3 | **SQL Injection** | CRITICAL | Raw SQL queries built with string interpolation or concatenation instead of parameterized queries |
| 4 | **.env not in .gitignore** | CRITICAL | Environment files containing secrets that will get committed to your repo |
| 5 | **Missing .gitignore for .env** | CRITICAL | Projects where `.env` files exist but aren't being git-ignored |

## Example Output

```
╔══════════════════════════════════════════════════════╗
║  VIBE SCAN LITE -- Security Report                  ║
╠══════════════════════════════════════════════════════╣
║  Project: ./my-ai-app                               ║
║  Files scanned: 47                                  ║
║  Languages: TypeScript, Python                      ║
╚══════════════════════════════════════════════════════╝

  Grade: D  Serious issues found

  Found 4 issues:
  ■ 4 CRITICAL  ■ 0 HIGH  ■ 0 MEDIUM  ■ 0 LOW

──────────────────────────────────────────────────────

  CRITICAL  Hardcoded API Key
  src/api/openai.ts:3:1
  > const OPENAI_API_KEY = "sk_live_abc123def456ghi789..."
  An API credential is hardcoded in source code.
  Fix: Move the credential into an environment variable.

  CRITICAL  Dynamic eval() Or Function Constructor
  src/utils/parser.js:12:5
  > eval(userInput)
  Dynamic JavaScript evaluation runs attacker-controlled code.
  Fix: Remove eval() and replace it with explicit parsing.

  CRITICAL  SQL Injection
  src/db/users.ts:8:3
  > db.query(`SELECT * FROM users WHERE id = ${userId}`)
  A SQL query is built with string interpolation.
  Fix: Use parameterized queries instead of string building.

  CRITICAL  .env File Not In .gitignore
  .env:1:1
  > DATABASE_URL=postgres://admin:password@localhost/mydb
  An environment file is not ignored by Git.
  Fix: Add .env and .env.* to .gitignore.

──────────────────────────────────────────────────────
  Full report saved to: ./my-ai-app/vibe-scan-report.json
```

## Install

```bash
# Clone and build
git clone https://github.com/YOURREPO/vibe-scan-lite.git
cd vibe-scan-lite
npm install && npm run build

# Scan any project
node bin/vibe-scan.js /path/to/your/project
```

## Usage

```bash
# Scan a project (default: all languages)
node bin/vibe-scan.js ./my-project

# Scan only JavaScript/TypeScript files
node bin/vibe-scan.js ./my-project --lang js

# Scan only Python files
node bin/vibe-scan.js ./my-project --lang python

# JSON output (pipe to other tools)
node bin/vibe-scan.js ./my-project --json

# Verbose mode (list all scanned files)
node bin/vibe-scan.js ./my-project --verbose
```

## How It Works

1. Discovers all JS, TS, and Python files in your project (skips node_modules, dist, .git, etc.)
2. Runs 5 security rules against every file
3. Grades your project A through F
4. Saves a detailed JSON report to `vibe-scan-report.json`

Entirely offline. No data leaves your machine. No API calls. No telemetry.

---

## Want All 35+ Rules?

Vibe Scan Lite covers the 5 most critical patterns. The **full version** includes everything you need to ship AI-generated code with confidence:

- **Secrets** -- Hardcoded passwords, JWT secrets, private keys, database credentials, client-side secret exposure
- **Injection** -- Command injection, template injection, plus the eval/SQL rules you already have
- **XSS** -- `dangerouslySetInnerHTML`, `innerHTML`, unsanitized rendering
- **Auth** -- Missing authentication, broken access control, session mismanagement
- **Crypto** -- Weak algorithms (MD5, SHA1), missing HTTPS, hardcoded salts
- **Dependencies** -- Known vulnerable packages, outdated lockfiles
- **Network** -- CORS misconfig, SSRF, open redirects
- **File Security** -- Path traversal, unrestricted uploads
- **Python** -- pickle deserialization, subprocess shell=True, and more

**Get the full version: (https://noumenon6.gumroad.com/l/vibe-scan)**

---

## License

MIT License. Use it, fork it, ship it.
---
Built by [Noumenon](https://github.com/Noumenon-ai)