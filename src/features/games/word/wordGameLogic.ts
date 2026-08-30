import { COUPLE_WORD_LIST, VALID_GUESS_DICTIONARY } from './wordList';

export type LetterFeedback = 'correct' | 'present' | 'absent' | 'empty';

export function isValidWord(word: string): boolean {
  if (word.length !== 5) return false;
  return VALID_GUESS_DICTIONARY.has(word.toUpperCase());
}

export function evaluateGuess(guess: string, target: string): LetterFeedback[] {
  const g = guess.toUpperCase().split('');
  const t = target.toUpperCase().split('');
  const result: LetterFeedback[] = Array(5).fill('absent');
  const targetLetterCounts: Record<string, number> = {};

  // First pass: mark correct positions and tally non-exact match letters in target
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
    } else {
      targetLetterCounts[t[i]] = (targetLetterCounts[t[i]] || 0) + 1;
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    const letter = g[i];
    if (targetLetterCounts[letter] && targetLetterCounts[letter] > 0) {
      result[i] = 'present';
      targetLetterCounts[letter]--;
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}

export function getDailyCoupleWord(dateString: string): string {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COUPLE_WORD_LIST.length;
  return COUPLE_WORD_LIST[index];
}

export function getRandomCoupleWord(): string {
  const index = Math.floor(Math.random() * COUPLE_WORD_LIST.length);
  return COUPLE_WORD_LIST[index];
}
