import { Rule } from "../types";

import { findLineMatches } from "./shared";

export const rules: Rule[] = [
  {
    id: "hardcoded-api-key",
    title: "Hardcoded API Key",
    severity: "critical",
    appliesTo: (file) => !file.relativePath.endsWith(".gitignore"),
    check: (file) =>
      findLineMatches(file, [
        {
          regex: /\b(sk_(live|test)_[0-9A-Za-z]{10,}|AKIA[0-9A-Z]{16}|SG\.[A-Za-z0-9._-]{16,}|AC[a-f0-9]{32}|AIza[0-9A-Za-z\-_]{20,})\b/i,
          description:
            "An API credential is hardcoded in source code, which makes it recoverable by anyone with repo access.",
          fix: "Move the credential into an environment variable or secret manager.",
        },
        {
          regex:
            /\b(OPENAI_API_KEY|STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|TWILIO_AUTH_TOKEN|SENDGRID_API_KEY)\b\s*[:=]\s*['"`][^'"`]{10,}['"`]/i,
          description:
            "A provider secret is assigned directly in code instead of being loaded securely at runtime.",
          fix: "Read the secret from process.env or a secret manager and keep it out of source control.",
        },
      ]),
  },
];
