import { CoupleEvent } from '../../types';

/**
 * Validates date string format (either "MM-DD" or "YYYY-MM-DD") and valid calendar dates.
 */
export function isValidEventDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const mmDdRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  const yyyyMmDdRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

  if (!mmDdRegex.test(trimmed) && !yyyyMmDdRegex.test(trimmed)) {
    return false;
  }

  const parts = trimmed.split('-').map((p) => parseInt(p, 10));
  const month = parts.length === 2 ? parts[0] : parts[1];
  const day = parts.length === 2 ? parts[1] : parts[2];
  const year = parts.length === 3 ? parts[0] : 2024; // 2024 is a leap year to allow Feb 29 for recurring dates

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const testDate = new Date(year, month - 1, day);
  return testDate.getMonth() === month - 1 && testDate.getDate() === day;
}

/**
 * Parses date string (either "MM-DD" or "YYYY-MM-DD") into month (0-11) and day (1-31).
 */
export function parseEventDateParts(dateStr: string): { month: number; day: number; year?: number } {
  if (!isValidEventDate(dateStr)) {
    // If not strictly valid, fallback safely to current month & day
    const now = new Date();
    return { month: now.getMonth(), day: now.getDate() };
  }

  const parts = dateStr.trim().split('-').map((p) => parseInt(p, 10));

  if (parts.length === 2) {
    // Format: MM-DD
    return { month: parts[0] - 1, day: parts[1] };
  } else if (parts.length === 3) {
    // Format: YYYY-MM-DD
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }

  const now = new Date();
  return { month: now.getMonth(), day: now.getDate() };
}

/**
 * Computes the next occurrence of an event relative to a reference date.
 * If recurringYearly is true, auto-rolls to next year if already passed this year.
 */
export function getNextEventDate(event: CoupleEvent, referenceDate: Date = new Date()): Date {
  const { month, day, year } = parseEventDateParts(event.date);

  const refYear = referenceDate.getFullYear();
  const refStartOfDay = new Date(refYear, referenceDate.getMonth(), referenceDate.getDate()).getTime();

  if (event.recurringYearly || year === undefined) {
    // Calculate date in current reference year
    let candidate = new Date(refYear, month, day);

    // If already passed today, roll to next year
    if (candidate.getTime() < refStartOfDay) {
      candidate = new Date(refYear + 1, month, day);
    }
    return candidate;
  }

  // One-off event
  return new Date(year, month, day);
}

/**
 * Calculates days remaining until the target date.
 */
export function getDaysUntil(targetDate: Date, referenceDate: Date = new Date()): number {
  const refStartOfDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const targetStartOfDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  ).getTime();

  const diffMs = targetStartOfDay - refStartOfDay;
  return Math.round(diffMs / 86400000);
}

/**
 * Formats countdown string.
 */
export function formatEventCountdown(daysUntil: number): { text: string; isToday: boolean; isPast: boolean } {
  if (daysUntil === 0) {
    return { text: 'Today! 🎉', isToday: true, isPast: false };
  } else if (daysUntil === 1) {
    return { text: 'Tomorrow', isToday: false, isPast: false };
  } else if (daysUntil > 1) {
    return { text: `In ${daysUntil} days`, isToday: false, isPast: false };
  } else {
    return { text: `${Math.abs(daysUntil)} days ago`, isToday: false, isPast: true };
  }
}

/**
 * Sorts events by next upcoming date occurrence.
 */
export function sortEventsByNextOccurrence(events: CoupleEvent[], referenceDate: Date = new Date()): CoupleEvent[] {
  return [...events].sort((a, b) => {
    const nextA = getNextEventDate(a, referenceDate).getTime();
    const nextB = getNextEventDate(b, referenceDate).getTime();
    return nextA - nextB;
  });
}
