import { evaluateGuess, getDailyCoupleWord, checkWordValid, getRandomCoupleWord } from '../src/features/games/word/wordGameLogic';

// Mock fetch so tests don't hit the network
const mockFetch = (status: number) =>
  jest.fn().mockResolvedValue({ status } as Response);

describe('Wordle Couple Edition Logic', () => {
  it('correctly evaluates exact matches (correct / green)', () => {
    const feedback = evaluateGuess('HEART', 'HEART');
    expect(feedback).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('correctly evaluates present letters in wrong position (present / yellow)', () => {
    const feedback = evaluateGuess('EARTH', 'HEART');
    expect(feedback).toEqual(['present', 'present', 'present', 'present', 'present']);
  });

  it('correctly evaluates absent letters (absent / gray)', () => {
    const feedback = evaluateGuess('CLOUD', 'HEART');
    expect(feedback).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('handles duplicate letters properly without over-crediting', () => {
    // Target HEART has one 'E'. Guess STEEL has two 'E's at index 2 and 3.
    const feedback = evaluateGuess('STEEL', 'HEART');
    expect(feedback[0]).toBe('absent');
    expect(feedback[1]).toBe('present');
    expect(feedback[2]).toBe('present');
    expect(feedback[3]).toBe('absent');
    expect(feedback[4]).toBe('absent');
  });

  it('checkWordValid returns true when API returns 200', async () => {
    global.fetch = mockFetch(200);
    const result = await checkWordValid('heart');
    expect(result).toBe(true);
  });

  it('checkWordValid returns false when API returns 404', async () => {
    global.fetch = mockFetch(404);
    // Clear cache for this word first by testing a unique word
    const result = await checkWordValid('xyzqw');
    expect(result).toBe(false);
  });

  it('checkWordValid fails open on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const result = await checkWordValid('zzzzz');
    expect(result).toBe(true); // fail open
  });

  it('returns a valid daily couple word based on date', () => {
    const word1 = getDailyCoupleWord('2026-08-29');
    const word2 = getDailyCoupleWord('2026-08-29');
    const wordNextDay = getDailyCoupleWord('2026-08-30');

    expect(word1).toHaveLength(5);
    expect(word1).toBe(word2);
    expect(typeof wordNextDay).toBe('string');
  });

  it('returns a valid random couple word with length 5', () => {
    const randomWord = getRandomCoupleWord();
    expect(randomWord).toHaveLength(5);
  });
});
