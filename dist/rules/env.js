"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const shared_1 = require("./shared");
exports.rules = [
    {
        id: "env-file-not-ignored",
        title: ".env File Not In .gitignore",
        severity: "critical",
        appliesTo: (file) => (0, shared_1.getBaseName)(file.relativePath).startsWith(".env") && (0, shared_1.getBaseName)(file.relativePath) !== ".env.example",
        check: (file, context) => {
            if (context.isIgnoredByGitignore(file.relativePath)) {
                return [];
            }
            return [
                (0, shared_1.createFileMatch)(file, "An environment file is present in the project but does not appear to be ignored by Git.", "Add .env and .env.* to .gitignore so secrets do not get committed."),
            ];
        },
    },
];
