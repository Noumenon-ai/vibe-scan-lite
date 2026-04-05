import { Rule } from "../types";

import { createFileMatch, getBaseName } from "./shared";

export const rules: Rule[] = [
  {
    id: "env-file-not-ignored",
    title: ".env File Not In .gitignore",
    severity: "critical",
    appliesTo: (file) => getBaseName(file.relativePath).startsWith(".env") && getBaseName(file.relativePath) !== ".env.example",
    check: (file, context) => {
      if (context.isIgnoredByGitignore(file.relativePath)) {
        return [];
      }

      return [
        createFileMatch(
          file,
          "An environment file is present in the project but does not appear to be ignored by Git.",
          "Add .env and .env.* to .gitignore so secrets do not get committed."
        ),
      ];
    },
  },
];
