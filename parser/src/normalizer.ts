// ============================================================
// Text normalizer — cleans extracted text from FIPI HTML
// Phase 19: FIPI parser MVP
//
// Normalizes:
// - whitespace
// - non-breaking spaces
// - soft hyphens
// - weird punctuation
// - option labels
// - text numbering
// ============================================================

/**
 * Normalize a text string extracted from FIPI HTML.
 *
 * Applies the following transformations:
 * 1. Non-breaking spaces → regular spaces
 * 2. Soft hyphens → removed
 * 3. Zero-width spaces → removed
 * 4. Multiple spaces → single space
 * 5. Leading/trailing whitespace → trimmed
 * 6. Various dash types → standard hyphen-minus
 * 7. Fancy quotes → straight quotes
 * 8. Ellipsis character → three dots
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/\u00AD/g, "") // soft hyphen
    .replace(/\u200B/g, "") // zero-width space
    .replace(/\u200C/g, "") // zero-width non-joiner
    .replace(/\u200D/g, "") // zero-width joiner
    .replace(/\uFEFF/g, "") // BOM
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-") // various dashes → hyphen
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // fancy single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // fancy double quotes
    .replace(/\u2026/g, "...") // ellipsis
    .replace(/\u00AB/g, "<<") // left double angle quote
    .replace(/\u00BB/g, ">>") // right double angle quote
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Normalize option labels.
 * FIPI often uses labels like "1)", "2)", "А)", "Б)", "A)", "B)" etc.
 * We standardize to lowercase letter IDs: "a", "b", "c", "d", etc.
 */
export function normalizeOptionLabel(label: string): string {
  const cleaned = label.replace(/[).]/g, "").trim();

  // Numeric labels: 1→a, 2→b, 3→c, etc.
  const numericMatch = cleaned.match(/^(\d+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    if (num >= 1 && num <= 26) {
      return String.fromCharCode(96 + num); // 1→a, 2→b, ...
    }
  }

  // Cyrillic labels: А→a, Б→b, В→c, Г→d, Д→e, Е→f, Ж→g, З→h
  const cyrillicMap: Record<string, string> = {
    А: "a",
    Б: "b",
    В: "c",
    Г: "d",
    Д: "e",
    Е: "f",
    Ж: "g",
    З: "h",
    И: "i",
    К: "j",
    Л: "k",
    М: "l",
    Н: "m",
    О: "n",
    П: "o",
    Р: "p",
  };

  const upper = cleaned.toUpperCase();
  if (cyrillicMap[upper]) {
    return cyrillicMap[upper];
  }

  // Latin letter labels
  const latinMatch = cleaned.match(/^([A-Za-z])$/);
  if (latinMatch) {
    return latinMatch[1].toLowerCase();
  }

  // Fallback: just use the cleaned label
  return cleaned.toLowerCase();
}

/**
 * Remove leading numbering from text.
 * Examples: "1. Text" → "Text", "1) Text" → "Text"
 */
export function removeLeadingNumbering(text: string): string {
  return text
    .replace(/^\d+[\.\)]\s*/, "")
    .replace(/^[А-ЯA-Z][\.\)]\s*/i, "")
    .trim();
}

/**
 * Clean HTML to plain text.
 * Strips all tags and normalizes the result.
 */
export function htmlToPlainText(html: string): string {
  return normalizeText(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&laquo;/g, "<<")
      .replace(/&raquo;/g, ">>")
  );
}

/**
 * Normalize a FIPI section/group name for use as a topic.
 */
export function normalizeTopicName(topic: string): string {
  return normalizeText(topic)
    .replace(/^\d+\.\s*/, "") // Remove "1. " prefix
    .replace(/\s*\(.*?\)\s*$/, "") // Remove trailing parenthetical
    .trim();
}

/**
 * Normalize an exam task number from FIPI text.
 * FIPI often displays "Задание 4" or "Задание №4" or just "4".
 * Returns the number, or undefined if not parseable.
 */
export function normalizeExamNumber(
  text: string
): number | undefined {
  // Try "Задание №4", "Задание 4", "Task 4"
  const match = text.match(/(?:задание|task|№)\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Try just a number
  const numMatch = text.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return undefined;
}
