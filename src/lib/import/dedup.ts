// ============================================================
// Deduplication — source_hash computation for import pipeline
// Phase 18: Admin import pipeline
//
// Computes a stable hash from question fields to detect duplicates
// across import runs. The hash uses only fields that identify a
// unique question from a given source.
// ============================================================

import { createHash } from "crypto";
import type { ParsedQuestion } from "./parsed-question-schema";

// -----------------------------------------------------------
// Normalization helpers
// -----------------------------------------------------------

/**
 * Normalize a string for hashing:
 * - Trim leading/trailing whitespace
 * - Collapse internal whitespace to single space
 * - Normalize non-breaking spaces
 */
function normalizeString(str: string): string {
  return str
    .replace(/\u00A0/g, " ") // non-breaking space → space
    .replace(/\u00AD/g, "") // soft hyphen → remove
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize an array of options for hashing:
 * - Sort by id (stable ordering)
 * - Trim text
 */
function normalizeOptions(
  options: Array<{ id: string; text: string }> | undefined
): string {
  if (!options || options.length === 0) return "";
  const sorted = [...options].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  return sorted.map((o) => `${o.id}:${normalizeString(o.text)}`).join("|");
}

// -----------------------------------------------------------
// Source hash computation
// -----------------------------------------------------------

/**
 * Compute a deterministic source_hash for a parsed question.
 *
 * Uses stable fields that identify a unique question from a given source:
 * - courseId
 * - source
 * - sourceUrl or externalId (whichever is present)
 * - prompt normalized
 * - options normalized (if present)
 *
 * The hash is SHA-256 hex digest.
 *
 * Two questions from the same source with the same prompt and options
 * will produce the same hash, regardless of whether their answers or
 * explanations differ. This prevents re-importing the same question.
 */
export function computeSourceHash(question: ParsedQuestion): string {
  const parts: string[] = [];

  // Course and source identify the context
  parts.push(`course:${question.courseId}`);
  parts.push(`source:${question.source}`);

  // Source URL or external ID identifies the origin
  if (question.sourceUrl) {
    parts.push(`url:${question.sourceUrl}`);
  } else if (question.externalId) {
    parts.push(`ext:${question.externalId}`);
  }

  // Prompt is the primary content identifier
  parts.push(`prompt:${normalizeString(question.prompt)}`);

  // Options help distinguish questions with the same prompt but different choices
  if (question.options && question.options.length > 0) {
    parts.push(`opts:${normalizeOptions(question.options)}`);
  }

  // Exam number helps distinguish same-topic questions
  if (question.examNumber !== undefined) {
    parts.push(`exam:${question.examNumber}`);
  }

  const raw = parts.join("\n");
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/**
 * Compute source hashes for an array of parsed questions.
 * Returns a Map from hash to question index for dedup lookups.
 */
export function computeSourceHashes(
  questions: ParsedQuestion[]
): Map<string, number> {
  const hashMap = new Map<string, number>();
  for (let i = 0; i < questions.length; i++) {
    const hash = computeSourceHash(questions[i]);
    hashMap.set(hash, i);
  }
  return hashMap;
}

/**
 * Find duplicates within a batch of questions (by source_hash).
 * Returns array of duplicate groups (indices that share the same hash).
 */
export function findInternalDuplicates(
  questions: ParsedQuestion[]
): Array<{ hash: string; indices: number[] }> {
  const hashToIndices = new Map<string, number[]>();

  for (let i = 0; i < questions.length; i++) {
    const hash = computeSourceHash(questions[i]);
    const existing = hashToIndices.get(hash);
    if (existing) {
      existing.push(i);
    } else {
      hashToIndices.set(hash, [i]);
    }
  }

  const duplicates: Array<{ hash: string; indices: number[] }> = [];
  for (const [hash, indices] of hashToIndices) {
    if (indices.length > 1) {
      duplicates.push({ hash, indices });
    }
  }

  return duplicates;
}
