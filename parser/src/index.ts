// ============================================================
// FIPI Parser MVP — Main entry point
// Phase 19: FIPI parser MVP
//
// Usage:
//   cd parser
//   bun run parse -- --subject russian --exam ege
//   bun run parse:dry -- --subject physics --exam oge
//   bun run parse -- --subject russian --exam ege --numbers 4,5,6,7
//
// This script:
// 1. Parses CLI arguments
// 2. Loads source configuration
// 3. Launches Playwright browser
// 4. Navigates to FIPI bank
// 5. Collects task group links
// 6. Extracts questions from each page
// 7. Outputs JSON file matching Phase 18 contract
// 8. Prints dry run report
//
// IMPORTANT:
// - Do not spam FIPI — delays between page loads
// - Parser outputs JSON, does NOT write to Supabase
// - Run validate-import.ts after parsing
// - Run import-questions.ts after validation
// ============================================================

import { FipiNavigator } from "./navigator.js";
import { getSourceConfig, type FipiSubject, type FipiExam } from "../config/sources.js";
import { writeOutput, printDryRunReport } from "./output.js";
import { clearVisited } from "./safety.js";

// -----------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------

function parseArgs(args: string[]): Record<string, string | boolean | number[] | undefined> {
  const result: Record<string, string | boolean | number[] | undefined> = {
    subject: "russian",
    exam: "ege",
    output: "output/parsed-questions.json",
    dryRun: false,
    headless: true,
    debug: false,
    delayMs: 2000,
    maxRetries: 3,
    maxPages: undefined,
    numbers: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--subject":
        result.subject = args[++i];
        break;
      case "--exam":
        result.exam = args[++i];
        break;
      case "--output":
        result.output = args[++i];
        break;
      case "--numbers": {
        const nums = args[++i]
          .split(",")
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));
        result.numbers = nums;
        break;
      }
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--no-headless":
        result.headless = false;
        break;
      case "--headless":
        result.headless = true;
        break;
      case "--debug":
        result.debug = true;
        break;
      case "--delay":
        result.delayMs = parseInt(args[++i], 10);
        break;
      case "--max-retries":
        result.maxRetries = parseInt(args[++i], 10);
        break;
      case "--max-pages":
        result.maxPages = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
FIPI Parser MVP — Extract questions from the FIPI open task bank

Usage:
  bun run parse -- [options]

Options:
  --subject <subject>     Subject to parse: russian, physics, math (default: russian)
  --exam <exam>           Exam type: ege, oge (default: ege)
  --numbers <n1,n2,...>   Specific exam task numbers to parse (default: all)
  --output <path>         Output file path (default: output/parsed-questions.json)
  --dry-run               Report only, no file output
  --no-headless           Run browser with visible window (for debugging)
  --debug                 Save HTML snapshots for debugging
  --delay <ms>            Delay between page loads in ms (default: 2000)
  --max-retries <n>       Max retries on page load failure (default: 3)
  --max-pages <n>         Max pages to visit (for testing)
  --help, -h              Show this help message

Examples:
  bun run parse -- --subject russian --exam ege
  bun run parse -- --subject physics --exam oge --numbers 1,2,3
  bun run parse:dry -- --subject russian --exam ege
  bun run parse -- --subject russian --exam ege --debug --no-headless
`);
}

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  console.log("═".repeat(60));
  console.log("  FIPI PARSER MVP");
  console.log("═".repeat(60));
  console.log(`\n  Subject:  ${opts.subject}`);
  console.log(`  Exam:     ${opts.exam}`);
  console.log(`  Dry run:  ${opts.dryRun ? "Yes" : "No"}`);
  if (opts.numbers) {
    console.log(`  Numbers:  ${(opts.numbers as number[]).join(", ")}`);
  }
  console.log();

  // Validate subject and exam
  const config = getSourceConfig(
    opts.subject as FipiSubject,
    opts.exam as FipiExam
  );

  if (!config) {
    console.error(
      `❌ Invalid subject/exam combination: ${opts.subject}/${opts.exam}`
    );
    console.error(
      `   Available EGE subjects: russian, physics, math_base, math_profile`
    );
    console.error(`   Available OGE subjects: russian, physics, math`);
    process.exit(1);
  }

  // Reset visited pages tracking
  clearVisited();

  // Create navigator
  const navigator = new FipiNavigator(config, {
    headless: opts.headless as boolean,
    debug: opts.debug as boolean,
    delayMs: opts.delayMs as number,
    maxRetries: opts.maxRetries as number,
    numbers: opts.numbers as number[] | undefined,
    maxPages: opts.maxPages as number | undefined,
  });

  try {
    // Step 1: Launch browser
    await navigator.init();

    // Step 2: Navigate to FIPI project
    await navigator.navigateToProject();

    // Step 3: Collect task group links
    const taskGroups = await navigator.collectTaskGroups();

    if (taskGroups.length === 0) {
      console.log("\n⚠️  No task groups found. FIPI page structure may have changed.");
      console.log("   Try running with --debug --no-headless to inspect the page.");
      await navigator.close();
      return;
    }

    // Step 4: Parse questions from each task group
    const result = await navigator.parseAllQuestions(taskGroups);

    // Step 5: Output results
    if (opts.dryRun) {
      printDryRunReport(
        result.questions,
        config,
        result.totalPagesVisited,
        result.errors
      );
    } else {
      // Write output file
      writeOutput(
        result.questions,
        config,
        opts.output as string,
        { year: new Date().getFullYear() }
      );

      // Print summary
      console.log("\n═".repeat(60));
      console.log("  PARSE COMPLETE");
      console.log("═".repeat(60));
      console.log(`\n   Total pages visited: ${result.totalPagesVisited}`);
      console.log(`   Total questions found: ${result.questions.length}`);
      console.log(
        `   Questions with answers: ${result.questions.filter((q) => q.correctAnswer).length}`
      );
      console.log(
        `   Questions missing answers: ${result.questions.filter((q) => !q.correctAnswer).length}`
      );
      console.log(`   Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log("\n   ⚠️  Some pages had errors. Questions may be incomplete.");
      }

      console.log(
        `\n   📋 Next steps:`
      );
      console.log(
        `   1. Validate: bun run ../scripts/validate-import.ts ${opts.output}`
      );
      console.log(
        `   2. Import:   SUPABASE_SERVICE_ROLE_KEY=xxx bun run ../scripts/import-questions.ts ${opts.output}`
      );
      console.log("═".repeat(60));
    }
  } catch (err) {
    console.error(
      `\n❌ Parser failed: ${err instanceof Error ? err.message : String(err)}`
    );
    if (opts.debug) {
      console.error(err);
    }
  } finally {
    await navigator.close();
  }
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
