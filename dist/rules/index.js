"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRules = void 0;
const env_1 = require("./env");
const injection_1 = require("./injection");
const secrets_1 = require("./secrets");
exports.allRules = [
    ...secrets_1.rules,
    ...injection_1.rules,
    ...env_1.rules,
];
