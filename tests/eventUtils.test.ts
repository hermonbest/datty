import {
  parseEventDateParts,
  isValidEventDate,
  getNextEventDate,
  getDaysUntil,
  formatEventCountdown,
  sortEventsByNextOccurrence,
} from '../src/features/calendar/eventUtils';
import { CoupleEvent } from '../src/types';

describe('eventUtils calculations', () => {
  it('validates event date formats and rejects invalid dates', () => {
    expect(isValidEventDate('10-25')).toBe(true);
    expect(isValidEventDate('2026-12-31')).toBe(true);
    expect(isValidEventDate('02-29')).toBe(true); // Leap year test
    expect(isValidEventDate('abc')).toBe(false);
    expect(isValidEventDate('13-45')).toBe(false);
    expect(isValidEventDate('2026-02-30')).toBe(false);
    expect(isValidEventDate('')).toBe(false);
  });

  it('parses MM-DD and YYYY-MM-DD correctly', () => {
    expect(parseEventDateParts('10-25')).toEqual({ month: 9, day: 25 });
    expect(parseEventDateParts('2026-12-31')).toEqual({ year: 2026, month: 11, day: 31 });
  });

  it('calculates next occurrence for upcoming yearly recurring event in current year', () => {
    const referenceDate = new Date(2026, 7, 29); // August 29, 2026
    const event: CoupleEvent = {
      id: 'anniv',
      title: 'Our Anniversary',
      date: '10-15', // Oct 15
      recurringYearly: true,
      notes: null,
      createdAt: null,
    };

    const nextDate = getNextEventDate(event, referenceDate);
    expect(nextDate.getFullYear()).toBe(2026);
    expect(nextDate.getMonth()).toBe(9); // Oct (0-indexed 9)
    expect(nextDate.getDate()).toBe(15);
  });

  it('auto-rolls yearly recurring event to next year if already passed this year', () => {
    const referenceDate = new Date(2026, 7, 29); // August 29, 2026
    const event: CoupleEvent = {
      id: 'bday',
      title: 'Partner Birthday',
      date: '02-14', // Feb 14 (already passed in 2026)
      recurringYearly: true,
      notes: null,
      createdAt: null,
    };

    const nextDate = getNextEventDate(event, referenceDate);
    expect(nextDate.getFullYear()).toBe(2027); // Next year!
    expect(nextDate.getMonth()).toBe(1); // Feb
    expect(nextDate.getDate()).toBe(14);
  });

  it('calculates days until and countdown label accurately', () => {
    const ref = new Date(2026, 7, 29); // Aug 29

    // Today
    const todayTarget = new Date(2026, 7, 29);
    const days0 = getDaysUntil(todayTarget, ref);
    expect(days0).toBe(0);
    expect(formatEventCountdown(days0).text).toBe('Today! 🎉');
    expect(formatEventCountdown(days0).isToday).toBe(true);

    // Tomorrow
    const tomorrowTarget = new Date(2026, 7, 30);
    const days1 = getDaysUntil(tomorrowTarget, ref);
    expect(days1).toBe(1);
    expect(formatEventCountdown(days1).text).toBe('Tomorrow');

    // In 12 days
    const futureTarget = new Date(2026, 8, 10); // Sep 10
    const days12 = getDaysUntil(futureTarget, ref);
    expect(days12).toBe(12);
    expect(formatEventCountdown(days12).text).toBe('In 12 days');
  });

  it('sorts events in chronological order of next occurrence', () => {
    const ref = new Date(2026, 7, 29); // Aug 29
    const events: CoupleEvent[] = [
      { id: '1', title: 'Valentine (Feb)', date: '02-14', recurringYearly: true, notes: null, createdAt: null },
      { id: '2', title: 'Trip (Sep)', date: '09-15', recurringYearly: true, notes: null, createdAt: null },
      { id: '3', title: 'Halloween (Oct)', date: '10-31', recurringYearly: true, notes: null, createdAt: null },
    ];

    const sorted = sortEventsByNextOccurrence(events, ref);
    expect(sorted[0].id).toBe('2'); // Sep 2026
    expect(sorted[1].id).toBe('3'); // Oct 2026
    expect(sorted[2].id).toBe('1'); // Feb 2027
  });
});
