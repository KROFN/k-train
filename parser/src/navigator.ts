// ============================================================
// FIPI Navigator — Playwright-based navigation of FIPI bank
// Phase 19: FIPI parser MVP
//
// Opens the FIPI bank, navigates to the selected subject,
// collects available task groups, and iterates through question pages.
// ============================================================

import { chromium, type Browser, type Page, type BrowserContext } from "playwright";
import { waitForRateLimit, waitForPageDelay, withRetry, markVisited, delay } from "./safety.js";
import type { FipiSourceConfig } from "../config/sources.js";
import { extractTaskGroupLinks, extractQuestionsFromPage, type ExtractedQuestion, type ParseResult } from "./extractor.js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type NavigatorOptions = {
  headless?: boolean;
  debug?: boolean;
  delayMs?: number;
  maxRetries?: number;
  numbers?: number[];
  /** Max pages to visit (for testing/limiting) */
  maxPages?: number;
};

// -----------------------------------------------------------
// Navigator class
// -----------------------------------------------------------

export class FipiNavigator {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: FipiSourceConfig;
  private options: NavigatorOptions;

  constructor(config: FipiSourceConfig, options: NavigatorOptions = {}) {
    this.config = config;
    this.options = {
      headless: true,
      debug: false,
      delayMs: 2000,
      maxRetries: 3,
      ...options,
    };
  }

  /**
   * Initialize the browser.
   */
  async init(): Promise<void> {
    console.log("🌐 Launching browser...");

    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: 100, // Slight slowdown for stability
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "ru-RU",
    });

    this.page = await this.context.newPage();
    console.log("   ✅ Browser launched");
  }

  /**
   * Navigate to the FIPI bank for the configured subject.
   */
  async navigateToProject(): Promise<void> {
    if (!this.page) throw new Error("Browser not initialized");

    console.log(`📄 Navigating to: ${this.config.subjectNameRu} (${this.config.exam.toUpperCase()})`);
    console.log(`   URL: ${this.config.projectUrl}`);

    await withRetry(
      async () => {
        await this.page!.goto(this.config.projectUrl, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
      },
      { label: "Navigate to FIPI project", maxRetries: this.options.maxRetries }
    );

    markVisited(this.config.projectUrl);

    // Wait for content to load
    await this.page.waitForTimeout(2000);

    console.log("   ✅ Project page loaded");
  }

  /**
   * Collect all task group links from the project page.
   */
  async collectTaskGroups(): Promise<Array<{ label: string; url: string; examNumber?: number }>> {
    if (!this.page) throw new Error("Browser not initialized");

    console.log("📋 Collecting task groups...");

    const groups = await extractTaskGroupLinks(this.page, this.config, {
      numbers: this.options.numbers,
    });

    console.log(`   Found ${groups.length} task group(s)`);
    for (const g of groups.slice(0, 10)) {
      console.log(`   - ${g.label} (Задание ${g.examNumber ?? "?"})`);
    }
    if (groups.length > 10) {
      console.log(`   ... and ${groups.length - 10} more`);
    }

    return groups;
  }

  /**
   * Parse all questions by visiting each task group page.
   */
  async parseAllQuestions(
    taskGroups: Array<{ label: string; url: string; examNumber?: number }>
  ): Promise<ParseResult> {
    if (!this.page) throw new Error("Browser not initialized");

    const result: ParseResult = {
      questions: [],
      totalPagesVisited: 0,
      errors: [],
    };

    const maxPages = this.options.maxPages ?? taskGroups.length;

    for (let i = 0; i < Math.min(taskGroups.length, maxPages); i++) {
      const group = taskGroups[i];
      console.log(
        `\n📝 Processing ${i + 1}/${Math.min(taskGroups.length, maxPages)}: ${group.label}`
      );

      try {
        await waitForRateLimit();

        const questions = await extractQuestionsFromPage(
          this.page,
          group.url,
          this.config,
          {
            debug: this.options.debug,
            delayMs: this.options.delayMs,
          }
        );

        // Assign exam number and source URL from group if not already set
        for (const q of questions) {
          if (!q.examNumber && group.examNumber) {
            q.examNumber = group.examNumber;
          }
          if (!q.sourceUrl) {
            q.sourceUrl = group.url;
          }
        }

        result.questions.push(...questions);
        result.totalPagesVisited++;

        console.log(`   Extracted ${questions.length} question(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`   ❌ Failed: ${message}`);
        result.errors.push({ url: group.url, message });
      }
    }

    return result;
  }

  /**
   * Close the browser.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log("\n🌐 Browser closed");
    }
  }
}
