// ============================================================
// Question extractor — extracts question data from FIPI HTML
// Phase 19: FIPI parser MVP
//
// This module contains heuristics for extracting question content
// from FIPI's HTML structure. FIPI's HTML may change over time,
// so these heuristics are designed to be flexible and log warnings
// when they can't find expected elements.
// ============================================================

import type { Page, Locator } from "playwright";
import { normalizeText, htmlToPlainText, normalizeOptionLabel, removeLeadingNumbering, normalizeTopicName, normalizeExamNumber } from "./normalizer.js";
import { computeConfidenceScore, determineAnswerStatus, answerLooksComplete } from "./confidence.js";
import { waitForRateLimit, waitForPageDelay, withRetry, markVisited, isVisited } from "./safety.js";
import type { FipiSourceConfig } from "../config/sources.js";
import { mapTopicName } from "../config/sources.js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type ExtractedQuestion = {
  externalId?: string;
  sourceUrl: string;
  examNumber?: number;
  topic: string;
  type: string;
  prompt: string;
  options?: Array<{ id: string; text: string }>;
  pairs?: Array<{ leftId: string; leftText: string; rightId: string; rightText: string }>;
  correctAnswer?: unknown;
  explanation?: { short: string; detailed?: string; rule?: string };
  answerStatus: "parsed" | "missing" | "needs_manual_review" | "verified";
  confidenceScore: number;
  rawHtml?: string; // For debugging
};

export type ParseResult = {
  questions: ExtractedQuestion[];
  totalPagesVisited: number;
  errors: Array<{ url: string; message: string }>;
};

// -----------------------------------------------------------
// FIPI page content extraction
// -----------------------------------------------------------

/**
 * Extract the list of task group links from the current FIPI bank page.
 * FIPI shows groups like "Задание 1", "Задание 2", etc.
 */
export async function extractTaskGroupLinks(
  page: Page,
  config: FipiSourceConfig,
  options?: { numbers?: number[] }
): Promise<Array<{ label: string; url: string; examNumber?: number }>> {
  await waitForRateLimit();

  const links: Array<{ label: string; url: string; examNumber?: number }> = [];

  try {
    // Wait for the task group navigation to load
    // FIPI uses various CSS selectors that may change
    // We look for links that contain "Задание" or task numbers
    await page.waitForSelector("a", { timeout: 10000 });

    // Find all links in the content area
    const allLinks = await page.locator("a").all();

    for (const link of allLinks) {
      const text = normalizeText(await link.textContent() ?? "");
      const href = await link.getAttribute("href") ?? "";

      // Filter for task group links
      if (text && (text.includes("Задание") || /^\d+$/.test(text))) {
        const examNum = normalizeExamNumber(text);
        const fullUrl = href.startsWith("http")
          ? href
          : `${config.baseUrl}${href.replace(/^\//, "")}`;

        // If specific numbers requested, filter
        if (options?.numbers && examNum !== undefined) {
          if (!options.numbers.includes(examNum)) continue;
        }

        links.push({
          label: text,
          url: fullUrl,
          examNumber: examNum,
        });
      }
    }
  } catch (err) {
    console.warn(
      `   ⚠️  Could not extract task group links: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return links;
}

/**
 * Extract questions from a FIPI task page.
 * This is the core extraction logic that tries to parse question content
 * from the FIPI HTML structure.
 */
export async function extractQuestionsFromPage(
  page: Page,
  url: string,
  config: FipiSourceConfig,
  options?: { debug?: boolean; delayMs?: number }
): Promise<ExtractedQuestion[]> {
  if (isVisited(url)) {
    return [];
  }

  const questions: ExtractedQuestion[] = [];

  try {
    await withRetry(
      async () => {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
      },
      { label: `Loading page: ${url}`, maxRetries: 3 }
    );

    markVisited(url);
    await waitForPageDelay(options?.delayMs);

    // Wait for question content to render
    await page.waitForTimeout(1000);

    // Save raw HTML snapshot for debugging
    let rawHtml = "";
    if (options?.debug) {
      rawHtml = await page.content();
    }

    // Try to find question elements on the page
    // FIPI structure varies, so we try multiple selectors
    const questionSelectors = [
      ".question",       // Common class
      ".task",           // Task class
      ".problem",        // Problem class
      "[class*='question']",
      "[class*='task']",
      "[class*='zadanie']", // Russian: задание
      "#content .item",
      ".test-item",
    ];

    let questionElements: Locator[] = [];

    for (const selector of questionSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        questionElements = elements;
        break;
      }
    }

    // If no specific question elements found, try to extract from the whole page
    if (questionElements.length === 0) {
      // Fallback: look for the main content area
      const mainContent = page.locator("#content, .content, main, [role='main']").first();
      if (await mainContent.count() > 0) {
        const text = normalizeText(await mainContent.textContent() ?? "");
        if (text.length > 10) {
          // Extract a single question from the entire content
          const q = await extractSingleQuestion(page, url, config, rawHtml);
          if (q) {
            questions.push(q);
          }
        }
      }
    } else {
      // Extract each question element
      for (const element of questionElements) {
        try {
          const q = await extractFromElement(element, page, url, config);
          if (q) {
            questions.push(q);
          }
        } catch (err) {
          console.warn(
            `   ⚠️  Failed to extract question: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  } catch (err) {
    console.warn(
      `   ⚠️  Failed to process page ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return questions;
}

// -----------------------------------------------------------
// Single question extraction
// -----------------------------------------------------------

/**
 * Extract a single question from a page element.
 */
async function extractFromElement(
  element: Locator,
  page: Page,
  url: string,
  config: FipiSourceConfig
): Promise<ExtractedQuestion | null> {
  try {
    const elementHtml = await element.innerHTML();
    const elementText = normalizeText(await element.textContent() ?? "");

    if (!elementText || elementText.length < 5) {
      return null;
    }

    // Extract prompt
    const prompt = elementText;

    // Try to extract options (choice questions)
    const options = await extractOptions(element);

    // Try to extract pairs (matching questions)
    const pairs = await extractPairs(element);

    // Try to extract answer
    const answer = await extractAnswer(element);

    // Try to extract explanation
    const explanation = await extractExplanation(element);

    // Determine question type
    const questionType = determineQuestionType(options, pairs, answer);

    // Get topic from page context
    const topic = await extractTopicFromPage(page) || "Общие вопросы";

    // Get exam number from URL or page context
    const examNumber = normalizeExamNumber(url) || await extractExamNumberFromPage(page);

    // Compute confidence
    const confidenceScore = computeConfidenceScore({
      hasPrompt: prompt.length > 0,
      hasOptions: options.length >= 2,
      expectsOptions: ["single_choice", "multi_choice", "formula_gap"].includes(questionType),
      hasAnswer: answer !== null,
      hasExamNumber: examNumber !== undefined,
      hasTopic: topic !== "Общие вопросы",
      hasExplanation: explanation !== null,
      hasPairs: pairs.length >= 2,
      expectsPairs: questionType === "matching",
    });

    // Determine answer status
    const answerStatus = determineAnswerStatus({
      hasAnswer: answer !== null,
      confidenceScore,
      answerLooksComplete: answer ? answerLooksComplete(answer, questionType) : false,
    });

    const result: ExtractedQuestion = {
      sourceUrl: url,
      topic: mapTopicName(config.courseId, normalizeTopicName(topic)),
      type: questionType,
      prompt,
      answerStatus,
      confidenceScore,
    };

    if (examNumber !== undefined) result.examNumber = examNumber;
    if (options.length >= 2) result.options = options;
    if (pairs.length >= 2) result.pairs = pairs;
    if (answer !== null) result.correctAnswer = answer;
    if (explanation !== null) result.explanation = explanation;

    return result;
  } catch {
    return null;
  }
}

/**
 * Extract a single question from the entire page content.
 * Used as fallback when specific question elements are not found.
 */
async function extractSingleQuestion(
  page: Page,
  url: string,
  config: FipiSourceConfig,
  rawHtml: string
): Promise<ExtractedQuestion | null> {
  // Get the main content text
  const contentElement = page.locator("#content, .content, main, [role='main']").first();
  if (await contentElement.count() === 0) return null;

  const text = normalizeText(await contentElement.textContent() ?? "");
  if (!text || text.length < 10) return null;

  // Try to extract options
  const options = await extractOptions(contentElement);
  const pairs = await extractPairs(contentElement);
  const answer = await extractAnswer(contentElement);
  const explanation = await extractExplanation(contentElement);

  const questionType = determineQuestionType(options, pairs, answer);
  const topic = await extractTopicFromPage(page) || "Общие вопросы";
  const examNumber = normalizeExamNumber(url) || await extractExamNumberFromPage(page);

  const confidenceScore = computeConfidenceScore({
    hasPrompt: text.length > 0,
    hasOptions: options.length >= 2,
    expectsOptions: ["single_choice", "multi_choice", "formula_gap"].includes(questionType),
    hasAnswer: answer !== null,
    hasExamNumber: examNumber !== undefined,
    hasTopic: topic !== "Общие вопросы",
    hasExplanation: explanation !== null,
    hasPairs: pairs.length >= 2,
    expectsPairs: questionType === "matching",
  });

  const answerStatus = determineAnswerStatus({
    hasAnswer: answer !== null,
    confidenceScore,
    answerLooksComplete: answer ? answerLooksComplete(answer, questionType) : false,
  });

  const result: ExtractedQuestion = {
    sourceUrl: url,
    topic: mapTopicName(config.courseId, normalizeTopicName(topic)),
    type: questionType,
    prompt: text,
    answerStatus,
    confidenceScore,
  };

  if (examNumber !== undefined) result.examNumber = examNumber;
  if (options.length >= 2) result.options = options;
  if (pairs.length >= 2) result.pairs = pairs;
  if (answer !== null) result.correctAnswer = answer;
  if (explanation !== null) result.explanation = explanation;
  if (rawHtml) result.rawHtml = rawHtml;

  return result;
}

// -----------------------------------------------------------
// Sub-extractors
// -----------------------------------------------------------

/**
 * Extract choice options from an element.
 * Looks for patterns like: "1) Option text", "А) Option text", etc.
 */
async function extractOptions(
  element: Locator
): Promise<Array<{ id: string; text: string }>> {
  const options: Array<{ id: string; text: string }> = [];

  try {
    // Look for list items that might be options
    const listItems = await element.locator("li, .option, [class*='option'], [class*='answer']").all();

    for (const item of listItems) {
      const text = normalizeText(await item.textContent() ?? "");
      if (!text) continue;

      // Try to split label from text: "1) Text" or "А) Text"
      const match = text.match(/^([А-ЯA-Z0-9])[).]\s*(.+)$/);
      if (match) {
        const label = normalizeOptionLabel(match[1]);
        const optionText = removeLeadingNumbering(text);
        options.push({ id: label, text: optionText });
      } else if (text.length > 1 && text.length < 500) {
        // Just use index-based ID
        options.push({ id: String(options.length + 1), text });
      }
    }

    // If no structured options found, try regex on the full text
    if (options.length === 0) {
      const fullText = await element.textContent() ?? "";
      const optionPattern = /([А-ЯA-Z0-9])[).]\s*([^\n]+)/g;
      let match;
      while ((match = optionPattern.exec(fullText)) !== null) {
        const label = normalizeOptionLabel(match[1]);
        const text = normalizeText(match[2]);
        if (text.length > 0) {
          options.push({ id: label, text });
        }
      }
    }
  } catch {
    // Extraction failed, return empty
  }

  return options;
}

/**
 * Extract matching pairs from an element.
 */
async function extractPairs(
  element: Locator
): Promise<Array<{ leftId: string; leftText: string; rightId: string; rightText: string }>> {
  const pairs: Array<{ leftId: string; leftText: string; rightId: string; rightText: string }> = [];

  try {
    // Look for table-like structures that might contain matching pairs
    const rows = await element.locator("tr, [class*='pair'], [class*='match']").all();

    for (let i = 0; i < rows.length; i++) {
      const cells = await rows[i].locator("td, [class*='col'], [class*='cell']").all();
      if (cells.length >= 2) {
        const leftText = normalizeText(await cells[0].textContent() ?? "");
        const rightText = normalizeText(await cells[1].textContent() ?? "");
        if (leftText && rightText) {
          pairs.push({
            leftId: `l${i + 1}`,
            leftText,
            rightId: `r${i + 1}`,
            rightText,
          });
        }
      }
    }
  } catch {
    // Extraction failed
  }

  return pairs;
}

/**
 * Extract the correct answer from an element.
 * FIPI often shows answers in hidden/collapsed sections.
 */
async function extractAnswer(
  element: Locator
): Promise<unknown | null> {
  try {
    // Look for answer sections
    const answerSelectors = [
      ".answer",
      "[class*='answer']",
      "[class*='correct']",
      "[class*='result']",
      "[class*='key']",
      "[class*='otvet']", // Russian: ответ
    ];

    for (const selector of answerSelectors) {
      const answerEl = element.locator(selector).first();
      if (await answerEl.count() > 0) {
        const text = normalizeText(await answerEl.textContent() ?? "");
        if (text) {
          // Try to parse the answer text
          return parseAnswerText(text);
        }
      }
    }

    // Check if there's a hidden/expandable answer section
    const expandButton = element.locator("[class*='show'], [class*='toggle'], [class*='expand']").first();
    if (await expandButton.count() > 0) {
      await expandButton.click();
      await element.page().waitForTimeout(500);

      // Try again after expanding
      for (const selector of answerSelectors) {
        const answerEl = element.locator(selector).first();
        if (await answerEl.count() > 0) {
          const text = normalizeText(await answerEl.textContent() ?? "");
          if (text) {
            return parseAnswerText(text);
          }
        }
      }
    }
  } catch {
    // Answer extraction failed
  }

  return null;
}

/**
 * Parse answer text into a structured answer object.
 */
function parseAnswerText(text: string): unknown | null {
  // Try to detect the answer format
  const cleanText = text.replace(/^Ответ:\s*/i, "").replace(/^Answer:\s*/i, "").trim();

  if (!cleanText) return null;

  // Single digit/letter answer (single choice)
  if (/^[А-ЯA-Z0-9]$/i.test(cleanText)) {
    return { type: "single", value: normalizeOptionLabel(cleanText) };
  }

  // Multiple letters/digits (multi choice)
  const multiMatch = cleanText.match(/^([А-ЯA-Z0-9])([;,]?\s*([А-ЯA-Z0-9]))+$/i);
  if (multiMatch) {
    const values = cleanText.split(/[;,]\s*/).map((v) => normalizeOptionLabel(v.trim()));
    return { type: "multiple", value: values };
  }

  // Numeric answer
  const numMatch = cleanText.match(/^([\d.,]+)\s*(.*)$/);
  if (numMatch) {
    const num = parseFloat(numMatch[1].replace(",", "."));
    if (!isNaN(num)) {
      return { type: "numeric", value: num };
    }
  }

  // Text answer (fallback)
  return { type: "text", value: cleanText };
}

/**
 * Extract explanation from an element.
 */
async function extractExplanation(
  element: Locator
): Promise<{ short: string; detailed?: string; rule?: string } | null> {
  try {
    const explainSelectors = [
      ".explanation",
      "[class*='explanation']",
      "[class*='hint']",
      "[class*='comment']",
      "[class*='podskazka']", // Russian: подсказка
      "[class*='obyasnenie']", // Russian: объяснение
    ];

    for (const selector of explainSelectors) {
      const el = element.locator(selector).first();
      if (await el.count() > 0) {
        const text = normalizeText(await el.textContent() ?? "");
        if (text && text.length > 5) {
          return { short: text.slice(0, 200) };
        }
      }
    }
  } catch {
    // Explanation extraction failed
  }

  return null;
}

/**
 * Extract the topic name from the page context.
 */
async function extractTopicFromPage(page: Page): Promise<string> {
  try {
    // Look for breadcrumbs or section headers
    const breadcrumb = page.locator(".breadcrumb, [class*='breadcrumb'], [class*='nav-path']").last();
    if (await breadcrumb.count() > 0) {
      const text = normalizeText(await breadcrumb.textContent() ?? "");
      if (text) return text;
    }

    // Look for section header
    const header = page.locator("h1, h2, .section-title").first();
    if (await header.count() > 0) {
      const text = normalizeText(await header.textContent() ?? "");
      if (text) return text;
    }
  } catch {
    // Topic extraction failed
  }

  return "";
}

/**
 * Extract exam task number from the page context.
 */
async function extractExamNumberFromPage(page: Page): Promise<number | undefined> {
  try {
    const bodyText = await page.locator("body").textContent();
    if (bodyText) {
      return normalizeExamNumber(bodyText);
    }
  } catch {
    // Exam number extraction failed
  }

  return undefined;
}

// -----------------------------------------------------------
// Question type detection
// -----------------------------------------------------------

/**
 * Determine the question type based on extracted content.
 */
function determineQuestionType(
  options: Array<{ id: string; text: string }>,
  pairs: Array<{ leftId: string; leftText: string; rightId: string; rightText: string }>,
  answer: unknown | null
): string {
  if (pairs.length >= 2) {
    return "matching";
  }

  if (options.length >= 2 && answer) {
    const a = answer as Record<string, unknown>;
    if (a.type === "multiple") {
      return "multi_choice";
    }
    return "single_choice";
  }

  if (options.length >= 2) {
    // Default to single_choice if options exist but answer is unknown
    return "single_choice";
  }

  if (answer) {
    const a = answer as Record<string, unknown>;
    if (a.type === "numeric") {
      return "numeric_input";
    }
    if (a.type === "text") {
      return "text_input";
    }
  }

  // Default: text_input as the most generic type
  return "text_input";
}
