// ============================================================
// Safety module — rate limiting, delays, retries
// Phase 19: FIPI parser MVP
//
// Do not spam FIPI. Add delays, rate limits, retries,
// and graceful failure handling.
// ============================================================

/** Default delay between page loads in milliseconds */
export const DEFAULT_DELAY_MS = 2000;

/** Default maximum retries for page load failures */
export const DEFAULT_MAX_RETRIES = 3;

/** Default timeout for page navigation in milliseconds */
export const DEFAULT_NAVIGATION_TIMEOUT = 30000;

/** Maximum requests per minute (rate limit) */
export const MAX_REQUESTS_PER_MINUTE = 20;

// -----------------------------------------------------------
// Rate limiter
// -----------------------------------------------------------

const requestTimestamps: number[] = [];

/**
 * Wait if we've exceeded the rate limit.
 * Call this before each request to FIPI.
 */
export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestInWindow = requestTimestamps[0];
    const waitMs = 60000 - (now - oldestInWindow) + 100; // +100ms buffer
    if (waitMs > 0) {
      console.log(
        `   ⏳ Rate limit reached. Waiting ${(waitMs / 1000).toFixed(1)}s...`
      );
      await delay(waitMs);
    }
  }

  requestTimestamps.push(Date.now());
}

// -----------------------------------------------------------
// Delay
// -----------------------------------------------------------

/**
 * Wait for a specified number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for the configured delay between page loads.
 */
export async function waitForPageDelay(
  customDelayMs?: number
): Promise<void> {
  const delayMs = customDelayMs ?? DEFAULT_DELAY_MS;
  await delay(delayMs);
}

// -----------------------------------------------------------
// Retry wrapper
// -----------------------------------------------------------

/**
 * Execute an async function with retries.
 * On failure, waits with exponential backoff before retrying.
 * Returns the result on success, or throws on final failure.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    label?: string;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? 3000;
  const label = options.label ?? "operation";

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt <= maxRetries) {
        const backoffMs = baseDelayMs * Math.pow(2, attempt - 1);
        const jitterMs = Math.random() * 1000;
        const totalDelay = backoffMs + jitterMs;

        console.warn(
          `   ⚠️  ${label} failed (attempt ${attempt}/${maxRetries + 1}). ` +
            `Retrying in ${(totalDelay / 1000).toFixed(1)}s...`
        );
        console.warn(`   Error: ${err instanceof Error ? err.message : String(err)}`);
        await delay(totalDelay);
      } else {
        console.error(
          `   ❌ ${label} failed after ${maxRetries + 1} attempts.`
        );
      }
    }
  }

  throw lastError;
}

// -----------------------------------------------------------
// Resume tracking
// -----------------------------------------------------------

/** Set of visited page URLs for resume support */
const visitedPages = new Set<string>();

/**
 * Mark a page as visited.
 */
export function markVisited(url: string): void {
  visitedPages.add(url);
}

/**
 * Check if a page has been visited.
 */
export function isVisited(url: string): boolean {
  return visitedPages.has(url);
}

/**
 * Get the count of visited pages.
 */
export function getVisitedCount(): number {
  return visitedPages.size;
}

/**
 * Clear the visited pages set.
 */
export function clearVisited(): void {
  visitedPages.clear();
}
