import { COUPLE_WORD_LIST } from './wordList';

export type LetterFeedback = 'correct' | 'present' | 'absent' | 'empty';

const WORDS_API_KEY = process.env.EXPO_PUBLIC_WORDSAPI_KEY ?? '';
const WORDS_API_BASE = 'https://wordsapiv1.p.mashape.com/words';

// In-memory cache so we don't re-fetch the same word twice per session
const wordValidityCache = new Map<string, boolean>();

/**
 * Returns true if the word exists in the English dictionary (via WordsAPI).
 * Caches results to avoid duplicate network calls.
 * Fails open on network error so the game isn't blocked offline.
 */
export async function checkWordValid(word: string): Promise<boolean> {
  const lower = word.toLowerCase();
  if (lower.length !== 5) return false;
  if (wordValidityCache.has(lower)) return wordValidityCache.get(lower)!;

  try {
    const res = await fetch(`${WORDS_API_BASE}/${lower}`, {
      headers: {
        'X-Mashape-Key': WORDS_API_KEY,
        'Accept': 'application/json',
      },
    });
    const valid = res.status === 200;
    wordValidityCache.set(lower, valid);
    return valid;
  } catch {
    // Network unavailable — fail open so the game isn't blocked offline
    wordValidityCache.set(lower, true);
    return true;
  }
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
