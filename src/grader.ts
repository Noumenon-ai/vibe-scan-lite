import { GradeResult, ScanSummary } from "./types";

export function calculateGrade(summary: ScanSummary): GradeResult {
  const { critical, high, medium } = summary;

  if (critical >= 3 || (critical >= 1 && high >= 5)) {
    return {
      grade: "F",
      message: "Do not ship this",
    };
  }

  if (critical >= 1) {
    return {
      grade: "D",
      message: "Serious issues found",
    };
  }

  if (high === 0 && medium <= 2) {
    return {
      grade: "A",
      message: "Your code looks solid",
    };
  }

  if (high <= 2 && medium <= 5) {
    return {
      grade: "B",
      message: "Good but some things to fix",
    };
  }

  if (high <= 5) {
    return {
      grade: "C",
      message: "Needs attention before shipping",
    };
  }

  return {
    grade: "D",
    message: "Serious issues found",
  };
}
