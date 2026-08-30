import { getDateId, getQuestionIndexForDate } from '../src/features/dailyQuestion/pickTodaysQuestion';

describe('pickTodaysQuestion logic', () => {
  it('formats date to YYYY-MM-DD correctly', () => {
    const testDate = new Date(2026, 7, 29); // August 29, 2026
    const dateId = getDateId(testDate);
    expect(dateId).toBe('2026-08-29');
  });

  it('pads single-digit month and day with zero', () => {
    const testDate = new Date(2026, 0, 5); // January 5, 2026
    const dateId = getDateId(testDate);
    expect(dateId).toBe('2026-01-05');
  });

  it('computes deterministic index for both partners on the same date', () => {
    const totalQuestions = 50;
    const datePartner1 = new Date(2026, 7, 29, 9, 30, 0); // 9:30 AM
    const datePartner2 = new Date(2026, 7, 29, 22, 15, 0); // 10:15 PM

    const index1 = getQuestionIndexForDate(datePartner1, totalQuestions);
    const index2 = getQuestionIndexForDate(datePartner2, totalQuestions);

    expect(index1).toBe(index2);
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(totalQuestions);
  });

  it('computes consistent dateId and question index using couple timezone', () => {
    const totalQuestions = 50;
    const utcDate = new Date('2026-08-29T23:30:00Z'); // 11:30 PM UTC
    
    // In Tokyo (UTC+9), it's already August 30
    const tokyoDateId = getDateId(utcDate, 'Asia/Tokyo');
    expect(tokyoDateId).toBe('2026-08-30');

    // In New York (UTC-4), it's August 29
    const nyDateId = getDateId(utcDate, 'America/New_York');
    expect(nyDateId).toBe('2026-08-29');

    // When couple shares timezone 'America/New_York', both partners get identical index
    const partnerA = getQuestionIndexForDate(utcDate, totalQuestions, 'America/New_York');
    const partnerB = getQuestionIndexForDate(utcDate, totalQuestions, 'America/New_York');
    expect(partnerA).toBe(partnerB);
  });

  it('increments index sequentially day by day and wraps modulo count', () => {
    const totalQuestions = 5;
    const day1 = new Date(2026, 7, 29);
    const day2 = new Date(2026, 7, 30);
    const day3 = new Date(2026, 7, 31);
    const day4 = new Date(2026, 8, 1);

    const idx1 = getQuestionIndexForDate(day1, totalQuestions);
    const idx2 = getQuestionIndexForDate(day2, totalQuestions);
    const idx3 = getQuestionIndexForDate(day3, totalQuestions);
    const idx4 = getQuestionIndexForDate(day4, totalQuestions);

    expect(idx2).toBe((idx1 + 1) % totalQuestions);
    expect(idx3).toBe((idx2 + 1) % totalQuestions);
    expect(idx4).toBe((idx3 + 1) % totalQuestions);
  });

  it('handles edge case when totalQuestions is 0 or negative', () => {
    expect(getQuestionIndexForDate(new Date(), 0)).toBe(0);
    expect(getQuestionIndexForDate(new Date(), -1)).toBe(0);
  });
});
