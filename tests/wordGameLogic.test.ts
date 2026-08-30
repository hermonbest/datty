import { evaluateGuess, getDailyCoupleWord, isValidWord, getRandomCoupleWord } from '../src/features/games/word/wordGameLogic';

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
    // S(absent), T(present), E(present), E(absent), L(absent)
    expect(feedback[0]).toBe('absent');
    expect(feedback[1]).toBe('present');
    expect(feedback[2]).toBe('present');
    expect(feedback[3]).toBe('absent');
    expect(feedback[4]).toBe('absent');
  });


  it('validates 5-letter word entries correctly', () => {
    expect(isValidWord('HEART')).toBe(true);
    expect(isValidWord('SWEET')).toBe(true);
    expect(isValidWord('XYZQW')).toBe(false);
  });

  it('returns a valid daily couple word based on date', () => {
    const word1 = getDailyCoupleWord('2026-08-29');
    const word2 = getDailyCoupleWord('2026-08-29');
    const wordNextDay = getDailyCoupleWord('2026-08-30');

    expect(word1).toHaveLength(5);
    expect(word1).toBe(word2);
    expect(typeof wordNextDay).toBe('string');
  });

  it('returns a valid random couple word', () => {
    const randomWord = getRandomCoupleWord();
    expect(randomWord).toHaveLength(5);
    expect(isValidWord(randomWord)).toBe(true);
  });
});
