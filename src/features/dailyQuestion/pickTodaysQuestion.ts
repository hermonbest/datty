/**
 * Deterministic date-based calculation for Daily Question.
 * Both partners compute the exact same question index independently with zero backend calls.
 */

const MILLISECONDS_PER_DAY = 86400000;

/**
 * Returns formatted dateId string in YYYY-MM-DD format based on the couple/specified timezone.
 */
export function getDateId(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
      // fallback to local if invalid timezone string
    }
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the question index for a specific date given the total number of questions.
 * Uses days elapsed since epoch modulo total question count for the couple's calendar date.
 */
export function getQuestionIndexForDate(date: Date = new Date(), totalQuestions: number, timeZone?: string): number {
  if (totalQuestions <= 0) return 0;
  
  const dateId = getDateId(date, timeZone);
  const [year, month, day] = dateId.split('-').map((p) => parseInt(p, 10));
  const utcDate = Date.UTC(year, month - 1, day);
  const daysSinceEpoch = Math.floor(utcDate / MILLISECONDS_PER_DAY);
  const index = ((daysSinceEpoch % totalQuestions) + totalQuestions) % totalQuestions;
  return index;
}
