// ============================================================
// Output writer — saves parsed questions to JSON
// Phase 19: FIPI parser MVP
//
// Output must match Phase 18 import contract.
// The output file can be validated with scripts/validate-import.ts
// and imported with scripts/import-questions.ts
// ============================================================

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import type { ExtractedQuestion } from "./extractor.js";
import type { FipiSourceConfig } from "../config/sources.js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

type OutputMeta = {
  source: "fipi";
  courseId: string;
  description: string;
  generatedAt: string;
  parserVersion: string;
};

type OutputQuestion = {
  externalId?: string;
  source: "fipi";
  sourceUrl?: string;
  sourceYear?: number;
  courseId: string;
  subject: string;
  exam: string;
  examNumber?: number;
  topic: string;
  subtopic?: string;
  difficulty?: string;
  type: string;
  prompt: string;
  options?: Array<{ id: string; text: string }>;
  pairs?: Array<{ leftId: string; leftText: string; rightId: string; rightText: string }>;
  correctAnswer?: unknown;
  explanation?: { short: string; detailed?: string; rule?: string };
  tags?: string[];
  answerStatus: "parsed" | "missing" | "needs_manual_review" | "verified";
  confidenceScore: number;
};

type OutputFile = {
  meta: OutputMeta;
  questions: OutputQuestion[];
};

// -----------------------------------------------------------
// Convert extracted question to output format
// -----------------------------------------------------------

/**
 * Convert an ExtractedQuestion to the output format matching Phase 18 contract.
 */
function toOutputQuestion(
  q: ExtractedQuestion,
  config: FipiSourceConfig,
  year?: number
): OutputQuestion {
  const result: OutputQuestion = {
    source: "fipi",
    courseId: config.courseId,
    subject: config.subject,
    exam: config.exam,
    topic: q.topic,
    type: q.type,
    prompt: q.prompt,
    answerStatus: q.answerStatus,
    confidenceScore: Math.round(q.confidenceScore * 100) / 100,
  };

  if (q.externalId) result.externalId = q.externalId;
  if (q.sourceUrl) result.sourceUrl = q.sourceUrl;
  if (year) result.sourceYear = year;
  if (q.examNumber !== undefined) result.examNumber = q.examNumber;
  if (q.options && q.options.length >= 2) result.options = q.options;
  if (q.pairs && q.pairs.length >= 2) result.pairs = q.pairs;
  if (q.correctAnswer) result.correctAnswer = q.correctAnswer;
  if (q.explanation) result.explanation = q.explanation;

  // Add tags based on question type and content
  const tags: string[] = ["fipi"];
  if (q.examNumber !== undefined) tags.push(`задание_${q.examNumber}`);
  if (config.exam === "ege") tags.push("егэ");
  if (config.exam === "oge") tags.push("огэ");
  result.tags = tags;

  return result;
}

// -----------------------------------------------------------
// Write output file
// -----------------------------------------------------------

/**
 * Write parsed questions to a JSON file.
 * The file format matches the Phase 18 import contract.
 */
export function writeOutput(
  questions: ExtractedQuestion[],
  config: FipiSourceConfig,
  outputPath: string,
  options?: { year?: number }
): void {
  const outputQuestions = questions.map((q) =>
    toOutputQuestion(q, config, options?.year)
  );

  const output: OutputFile = {
    meta: {
      source: "fipi",
      courseId: config.courseId,
      description: `FIPI ${config.exam.toUpperCase()} ${config.subjectNameRu} questions parsed on ${new Date().toISOString().split("T")[0]}`,
      generatedAt: new Date().toISOString(),
      parserVersion: "1.0.0",
    },
    questions: outputQuestions,
  };

  // Ensure output directory exists
  const absPath = resolve(outputPath);
  const dir = dirname(absPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(absPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n💾 Output written to: ${absPath}`);
}

// -----------------------------------------------------------
// Dry run report
// -----------------------------------------------------------

/**
 * Print a dry run report without writing to file.
 */
export function printDryRunReport(
  questions: ExtractedQuestion[],
  config: FipiSourceConfig,
  totalPagesVisited: number,
  errors: Array<{ url: string; message: string }>
): void {
  const questionsWithAnswers = questions.filter((q) => q.correctAnswer);
  const questionsMissingAnswers = questions.filter((q) => !q.correctAnswer);

  console.log("\n═".repeat(60));
  console.log("  DRY RUN REPORT");
  console.log("═".repeat(60));

  console.log(`\n   Subject:           ${config.subjectNameRu}`);
  console.log(`   Exam:              ${config.exam.toUpperCase()}`);
  console.log(`   Course:            ${config.courseId}`);
  console.log(`   Total pages:       ${totalPagesVisited}`);
  console.log(`   Total questions:   ${questions.length}`);
  console.log(`   With answers:      ${questionsWithAnswers.length}`);
  console.log(`   Missing answers:   ${questionsMissingAnswers.length}`);
  console.log(`   Errors:            ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n   Errors:");
    for (const err of errors.slice(0, 10)) {
      console.log(`     • ${err.url}: ${err.message}`);
    }
    if (errors.length > 10) {
      console.log(`     ... and ${errors.length - 10} more`);
    }
  }

  // Answer status breakdown
  const statusCounts: Record<string, number> = {};
  for (const q of questions) {
    statusCounts[q.answerStatus] = (statusCounts[q.answerStatus] ?? 0) + 1;
  }
  console.log("\n   Answer Status Breakdown:");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`     ${status}: ${count}`);
  }

  // Average confidence
  if (questions.length > 0) {
    const avgConfidence =
      questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length;
    console.log(`\n   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  }

  console.log("\n   ⚠️  DRY RUN — no file was written");
  console.log("═".repeat(60));
}
