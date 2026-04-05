import { rules as envRules } from "./env";
import { rules as injectionRules } from "./injection";
import { rules as secretRules } from "./secrets";

export const allRules = [
  ...secretRules,
  ...injectionRules,
  ...envRules,
];
