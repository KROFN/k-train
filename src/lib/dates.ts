// ============================================================
// Date helpers for EGE Russian Trainer
// Used by streak logic and scoring
// ============================================================

/**
 * Get a date string in YYYY-MM-DD format using the user's local timezone.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date string in YYYY-MM-DD format.
 */
export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayString(): string {
  return toLocalDateString(new Date());
}

/**
 * Check if a date string (YYYY-MM-DD) is yesterday relative to today.
 */
export function isYesterday(dateStr: string): boolean {
  return dateStr === getYesterdayString();
}

/**
 * Check if a date string (YYYY-MM-DD) is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

/**
 * Calculate the new streak based on the last practice date.
 *
 * Logic:
 * - if lastPracticeDate is today → streak does not change
 * - if lastPracticeDate is yesterday → streak + 1
 * - if lastPracticeDate is older than yesterday → streak = 1
 * - if lastPracticeDate is null → streak = 1
 */
export function calculateNewStreak(
  currentStreak: number,
  lastPracticeDate: string | null
): number {
  if (!lastPracticeDate) return 1;

  if (isToday(lastPracticeDate)) return currentStreak;
  if (isYesterday(lastPracticeDate)) return currentStreak + 1;

  // Gap of 2+ days — reset streak
  return 1;
}
