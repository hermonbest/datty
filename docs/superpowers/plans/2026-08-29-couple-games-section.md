# Couple Games Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, beautifully designed Games Hub in the app with interactive games tailored for couples: Chess, Word Game (Wordle Couple Edition), Truth or Dare (with animated bottle spin), Couple Trivia ("Who Knows Who Best?"), and Love Tic-Tac-Toe.

**Architecture:** A dedicated Games navigation module with a polished Games Hub lobby displaying game cards, badges, and quick-launch modal screens. Pure, modular game engines with full test coverage handle game rules (Chess move validation & check detection, Wordle letter matching & dictionary validation, Truth or Dare prompt generation with customizable spicy/romantic decks, and couple scorecard mechanics).

**Tech Stack:** React Native, Lucide React Native, TypeScript, Jest, React Native Animated / Gesture interactions.

**Spec:** Couple Games Suite with Pass & Play / Challenge modes, romantic forfeits, animated interactions, and seamless navigation in `src/navigation/RootNavigator.tsx`.

## Global Constraints
- Must use existing theme tokens (`src/theme/index.ts`) for colors, shadows, border radii, and typography.
- Zero external native binary dependencies (keep it compatible with Expo managed workflow).
- All game engines must be covered by comprehensive Jest unit tests before UI integration.
- Graceful handling of both local pass-and-play and responsive touch interactions.

---

### Task 1: Game Data Types and Truth or Dare Engine

**Files:**
- Create: `src/types/games.ts`
- Modify: `src/types/index.ts`
- Create: `src/features/games/truthOrDare/truthOrDareData.ts`
- Test: `tests/truthOrDare.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `GameType`, `TruthOrDareItem`, `TruthOrDareCategory`, `getRandomPrompt()`, `TRUTH_OR_DARE_DATA`

- [ ] **Step 1: Write the failing test for Truth or Dare engine**

```typescript
// tests/truthOrDare.test.ts
import { getRandomPrompt, TRUTH_OR_DARE_DATA } from '../src/features/games/truthOrDare/truthOrDareData';

describe('Truth or Dare Game Engine', () => {
  it('contains valid categories with non-empty prompts', () => {
    expect(TRUTH_OR_DARE_DATA.romantic.truths.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.romantic.dares.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.spicy.truths.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.spicy.dares.length).toBeGreaterThan(5);
  });

  it('returns a random truth or dare prompt from specified category', () => {
    const prompt = getRandomPrompt('romantic', 'truth');
    expect(prompt).toBeDefined();
    expect(typeof prompt.text).toBe('string');
    expect(prompt.category).toBe('romantic');
    expect(prompt.type).toBe('truth');
  });

  it('avoids returning duplicate prompt immediately when excludeIds are provided', () => {
    const firstPrompt = getRandomPrompt('deep', 'truth');
    const secondPrompt = getRandomPrompt('deep', 'truth', [firstPrompt.id]);
    expect(secondPrompt.id).not.toBe(firstPrompt.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/truthOrDare.test.ts`
Expected: FAIL with missing module error.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/types/games.ts
export type GameId = 'truth_or_dare' | 'word_guess' | 'chess' | 'couple_trivia' | 'tic_tac_toe';

export type TruthOrDareCategory = 'romantic' | 'spicy' | 'deep' | 'fun';
export type PromptType = 'truth' | 'dare';

export interface TruthOrDareItem {
  id: string;
  category: TruthOrDareCategory;
  type: PromptType;
  text: string;
  intensity: 1 | 2 | 3;
}

export interface GameMetadata {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  badgeColor: string;
  iconName: string;
  players: string;
  duration: string;
}
```

```typescript
// src/features/games/truthOrDare/truthOrDareData.ts
import { TruthOrDareCategory, PromptType, TruthOrDareItem } from '../../../types/games';

export const TRUTH_OR_DARE_DATA: Record<
  TruthOrDareCategory,
  { name: string; icon: string; description: string; truths: TruthOrDareItem[]; dares: TruthOrDareItem[] }
> = {
  romantic: {
    name: 'Romantic & Sweet',
    icon: 'Heart',
    description: 'Heartwarming truths and tender romantic gestures.',
    truths: [
      { id: 'rt1', category: 'romantic', type: 'truth', text: 'What was the exact moment you knew you had feelings for me?', intensity: 1 },
      { id: 'rt2', category: 'romantic', type: 'truth', text: 'What is your favorite memory of us together so far?', intensity: 1 },
      { id: 'rt3', category: 'romantic', type: 'truth', text: 'What small everyday thing do I do that makes your heart melt?', intensity: 1 },
      { id: 'rt4', category: 'romantic', type: 'truth', text: 'If we could relive any single day in our relationship, which one would it be?', intensity: 2 },
      { id: 'rt5', category: 'romantic', type: 'truth', text: 'What is your favorite physical feature of mine?', intensity: 1 },
      { id: 'rt6', category: 'romantic', type: 'truth', text: 'What is something you secretly love about how we cuddle?', intensity: 1 },
    ],
    dares: [
      { id: 'rd1', category: 'romantic', type: 'dare', text: 'Look into my eyes for 60 seconds without speaking or laughing.', intensity: 1 },
      { id: 'rd2', category: 'romantic', type: 'dare', text: 'Give me a slow, gentle 2-minute shoulder and neck massage.', intensity: 1 },
      { id: 'rd3', category: 'romantic', type: 'dare', text: 'Whisper three genuine compliments in my ear with your sweetest voice.', intensity: 1 },
      { id: 'rd4', category: 'romantic', type: 'dare', text: 'Play our song (or a romantic slow song) and dance with me right now.', intensity: 2 },
      { id: 'rd5', category: 'romantic', type: 'dare', text: 'Kiss me on 5 different places on my face.', intensity: 1 },
      { id: 'rd6', category: 'romantic', type: 'dare', text: 'Hold my hands and make a cute, sincere promise to me for this week.', intensity: 1 },
    ],
  },
  spicy: {
    name: 'Spicy & Flirty',
    icon: 'Flame',
    description: 'Sensual questions and seductive dares to turn up the heat.',
    truths: [
      { id: 'st1', category: 'spicy', type: 'truth', text: 'What is your absolute favorite intimate moment we have ever shared?', intensity: 3 },
      { id: 'st2', category: 'spicy', type: 'truth', text: 'What is an unfulfilled romantic fantasy or scenario you think about?', intensity: 3 },
      { id: 'st3', category: 'spicy', type: 'truth', text: 'Where is your favorite place on your body to be kissed or touched?', intensity: 2 },
      { id: 'st4', category: 'spicy', type: 'truth', text: 'What outfit or look of mine drives you the wildest?', intensity: 2 },
      { id: 'st5', category: 'spicy', type: 'truth', text: 'What is something I do unexpectedly that instantly turns you on?', intensity: 3 },
      { id: 'st6', category: 'spicy', type: 'truth', text: 'Rate our kissing chemistry from 1 to 10 and tell me why.', intensity: 2 },
    ],
    dares: [
      { id: 'sd1', category: 'spicy', type: 'dare', text: 'Give me a passionate 15-second kiss that leaves us breathless.', intensity: 3 },
      { id: 'sd2', category: 'spicy', type: 'dare', text: 'Gently trace your lips along my neck without kissing it for 30 seconds.', intensity: 3 },
      { id: 'sd3', category: 'spicy', type: 'dare', text: 'Send me a flirty/spicy text right now as if we were across the room from each other.', intensity: 2 },
      { id: 'sd4', category: 'spicy', type: 'dare', text: 'Feed me a treat or fruit in the most seductive way possible.', intensity: 2 },
      { id: 'sd5', category: 'spicy', type: 'dare', text: 'Give me a lap massage for the next 90 seconds.', intensity: 3 },
      { id: 'sd6', category: 'spicy', type: 'dare', text: 'Whisper your most forbidden secret desire into my ear.', intensity: 3 },
    ],
  },
  deep: {
    name: 'Deep & Vulnerable',
    icon: 'Sparkles',
    description: 'Soulful questions and emotional connection builders.',
    truths: [
      { id: 'dt1', category: 'deep', type: 'truth', text: 'What is a personal fear you rarely share with anyone else?', intensity: 2 },
      { id: 'dt2', category: 'deep', type: 'truth', text: 'In what ways do you feel I have helped you grow as a person?', intensity: 2 },
      { id: 'dt3', category: 'deep', type: 'truth', text: 'When do you feel most safe and understood with me?', intensity: 1 },
      { id: 'dt4', category: 'deep', type: 'truth', text: 'What is a dream for our future that excites you the most?', intensity: 2 },
      { id: 'dt5', category: 'deep', type: 'truth', text: 'What is one thing you wish we did more often together?', intensity: 2 },
      { id: 'dt6', category: 'deep', type: 'truth', text: 'What is a lesson from your past that shaped how you love today?', intensity: 2 },
    ],
    dares: [
      { id: 'dd1', category: 'deep', type: 'dare', text: 'Share one thing you appreciate about me today that you haven’t said out loud yet.', intensity: 1 },
      { id: 'dd2', category: 'deep', type: 'dare', text: 'Hold me close and synchronize our breathing for 1 minute in silence.', intensity: 1 },
      { id: 'dd3', category: 'deep', type: 'dare', text: 'Show me your favorite photo of us on your phone and tell me the story behind it.', intensity: 1 },
      { id: 'dd4', category: 'deep', type: 'dare', text: 'Write a 3-line mini love poem or haiku about our bond on a piece of paper or notes app.', intensity: 2 },
      { id: 'dd5', category: 'deep', type: 'dare', text: 'Tell me something I did recently that made you proud of me.', intensity: 1 },
      { id: 'dd6', category: 'deep', type: 'dare', text: 'Give me the warmest bear hug for 45 seconds straight.', intensity: 1 },
    ],
  },
  fun: {
    name: 'Fun & Playful',
    icon: 'Laugh',
    description: 'Lighthearted laughs, goofy challenges, and couple trivia.',
    truths: [
      { id: 'ft1', category: 'fun', type: 'truth', text: 'What is the funniest or most embarrassing thing you did to impress me?', intensity: 1 },
      { id: 'ft2', category: 'fun', type: 'truth', text: 'If I were an animal or food, what would I be and why?', intensity: 1 },
      { id: 'ft3', category: 'fun', type: 'truth', text: 'What is a weird habit of mine that you find secretly adorable?', intensity: 1 },
      { id: 'ft4', category: 'fun', type: 'truth', text: 'Who is the bigger drama queen when sick — you or me?', intensity: 1 },
      { id: 'ft5', category: 'fun', type: 'truth', text: 'What is the worst date idea you could ever imagine us having?', intensity: 1 },
      { id: 'ft6', category: 'fun', type: 'truth', text: 'If we were in a zombie apocalypse, who survives longer and how?', intensity: 1 },
    ],
    dares: [
      { id: 'fd1', category: 'fun', type: 'dare', text: 'Do your best, most dramatic impression of how I talk or walk.', intensity: 1 },
      { id: 'fd2', category: 'fun', type: 'dare', text: 'Let me style your hair however I want for the next 10 minutes.', intensity: 1 },
      { id: 'fd3', category: 'fun', type: 'dare', text: 'Sing the chorus of a silly love song like an opera singer.', intensity: 1 },
      { id: 'fd4', category: 'fun', type: 'dare', text: 'Make the funniest face you can and let me take a goofy snapshot.', intensity: 1 },
      { id: 'fd5', category: 'fun', type: 'dare', text: 'Speak in a fake accent of my choice for the next 3 rounds.', intensity: 1 },
      { id: 'fd6', category: 'fun', type: 'dare', text: 'Try not to smile while I do everything I can to make you laugh for 30 seconds.', intensity: 1 },
    ],
  },
};

export function getRandomPrompt(
  category: TruthOrDareCategory,
  type: PromptType,
  excludeIds: string[] = []
): TruthOrDareItem {
  const pool = TRUTH_OR_DARE_DATA[category][type === 'truth' ? 'truths' : 'dares'];
  const candidates = pool.filter((p) => !excludeIds.includes(p.id));
  const selectedList = candidates.length > 0 ? candidates : pool;
  const randomIndex = Math.floor(Math.random() * selectedList.length);
  return selectedList[randomIndex];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/truthOrDare.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/games.ts src/types/index.ts src/features/games/truthOrDare/truthOrDareData.ts tests/truthOrDare.test.ts
git commit -m "feat(games): add game types and truth or dare engine with test coverage"
```

---

### Task 2: Word Guess / Wordle Couple Edition Logic

**Files:**
- Create: `src/features/games/word/wordGameLogic.ts`
- Create: `src/features/games/word/wordList.ts`
- Test: `tests/wordGameLogic.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `LetterState`, `evaluateGuess()`, `getDailyCoupleWord()`, `isValidWord()`, `COUPLE_WORD_LIST`

- [ ] **Step 1: Write the failing test for Word Game logic**

```typescript
// tests/wordGameLogic.test.ts
import { evaluateGuess, getDailyCoupleWord, isValidWord } from '../src/features/games/word/wordGameLogic';

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
    const feedback = evaluateGuess('SPEED', 'HEART');
    expect(feedback[2]).toBe('correct');
    expect(feedback[3]).toBe('absent');
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/wordGameLogic.test.ts`
Expected: FAIL with missing module error.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/games/word/wordList.ts
export const COUPLE_WORD_LIST: string[] = [
  'HEART', 'SWEET', 'LOVER', 'SMILE', 'DREAM', 'TRUST', 'DATES', 'BLUSH',
  'KISSY', 'MAGIC', 'CHARM', 'HONEY', 'ANGEL', 'CANDY', 'SPARK', 'WARMTH',
  'PEACE', 'ROSES', 'TOUCH', 'DEVOT', 'ADORE', 'BLOOM', 'FLAME', 'UNITY',
  'BLISS', 'CHAPS', 'SOULS', 'BEAMS', 'LIGHT', 'DANCE', 'HAPPY', 'SHINE'
];

export const VALID_GUESS_DICTIONARY = new Set([
  ...COUPLE_WORD_LIST,
  'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONE', 'ALONG', 'AMONG', 'BEACH',
  'BEGIN', 'BLACK', 'BRAIN', 'BREAD', 'BRING', 'BROWN', 'BUILD', 'CARRY',
  'CAUSE', 'CHAIN', 'CHAIR', 'CHECK', 'CHILD', 'CLEAN', 'CLEAR', 'CLOCK',
  'CLOSE', 'CLOUD', 'COACH', 'COAST', 'COLOR', 'COULD', 'COVER', 'CRAFT',
  'CROSS', 'CROWD', 'CROWN', 'DAILY', 'DEATH', 'DRIVE', 'EARTH', 'EARLY',
  'EMPTY', 'ENTER', 'EQUAL', 'EVENT', 'EVERY', 'FAITH', 'FIELD', 'FIFTH',
  'FIGHT', 'FINAL', 'FIRST', 'FLOOR', 'FOCUS', 'FORCE', 'FRONT', 'GIVEN',
  'GLASS', 'GRAND', 'GRASS', 'GREAT', 'GREEN', 'GROUP', 'GUARD', 'GUESS',
  'HABIT', 'HANDS', 'HEAVY', 'HELLO', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE',
  'HUMAN', 'IMAGE', 'JEWEL', 'JUDGE', 'KNIFE', 'LAUGH', 'LAYER', 'LEARN',
  'LEAVE', 'LEVEL', 'LUNCH', 'MARRY', 'MATCH', 'MAYBE', 'MONEY', 'MONTH',
  'MOUTH', 'MUSIC', 'NIGHT', 'NOBLE', 'NORTH', 'NURSE', 'OCEAN', 'OFFER',
  'ORDER', 'OTHER', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER',
  'PHONE', 'PHOTO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE',
  'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE',
  'PRIZE', 'PROOF', 'QUEEN', 'QUICK', 'QUIET', 'RADIO', 'RAISE', 'RANGE',
  'REACH', 'READY', 'RIVER', 'ROUND', 'ROUTE', 'ROYAL', 'SCENE', 'SCORE',
  'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHARE', 'SHIRT', 'SHOCK', 'SHOOT',
  'SHORT', 'SIGHT', 'SKILL', 'SLEEP', 'SMART', 'SOLID', 'SOUND', 'SOUTH',
  'SPACE', 'SPEAK', 'SPEED', 'SPEND', 'SPORT', 'STAFF', 'STAGE', 'STAND',
  'START', 'STATE', 'STEAM', 'STEEL', 'STICK', 'STILL', 'STOCK', 'STONE',
  'STORE', 'STORM', 'STORY', 'STYLE', 'SUGAR', 'TABLE', 'TASTE', 'TEACH',
  'THANK', 'THEME', 'THERE', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE',
  'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOWER',
  'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TRUCK', 'TRULY', 'TRUTH', 'TWICE',
  'UNDER', 'UNION', 'UNTIL', 'VALUE', 'VIDEO', 'VISIT', 'VOICE', 'WASTE',
  'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE',
  'WOMAN', 'WORLD', 'WORRY', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'YEARS',
  'YOUTH'
]);
```

```typescript
// src/features/games/word/wordGameLogic.ts
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

  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
    } else {
      targetLetterCounts[t[i]] = (targetLetterCounts[t[i]] || 0) + 1;
    }
  }

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/wordGameLogic.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/games/word/wordList.ts src/features/games/word/wordGameLogic.ts tests/wordGameLogic.test.ts
git commit -m "feat(games): implement word guess validation and feedback logic with tests"
```

---

### Task 3: Chess Engine Logic for 2-Player Pass-and-Play

**Files:**
- Create: `src/features/games/chess/chessEngine.ts`
- Test: `tests/chessEngine.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `PieceColor`, `PieceType`, `ChessBoard`, `GameState`, `initialBoard()`, `getLegalMoves()`, `makeMove()`, `isKingInCheck()`, `isGameOver()`

- [ ] **Step 1: Write the failing test for Chess Engine**

```typescript
// tests/chessEngine.test.ts
import {
  initialBoard,
  getLegalMoves,
  makeMove,
  isKingInCheck,
  ChessBoard
} from '../src/features/games/chess/chessEngine';

describe('Chess Engine for Couples', () => {
  it('initializes standard 8x8 chessboard with pieces in proper spots', () => {
    const board = initialBoard();
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(8);
    expect(board[0][0]).toEqual({ type: 'r', color: 'b' });
    expect(board[0][4]).toEqual({ type: 'k', color: 'b' });
    expect(board[7][4]).toEqual({ type: 'k', color: 'w' });
    expect(board[6][0]).toEqual({ type: 'p', color: 'w' });
  });

  it('calculates initial white pawn opening moves (1 or 2 steps forward)', () => {
    const board = initialBoard();
    const e2Moves = getLegalMoves(board, 6, 4, 'w');
    expect(e2Moves).toContainEqual({ row: 5, col: 4 });
    expect(e2Moves).toContainEqual({ row: 4, col: 4 });
    expect(e2Moves.length).toBe(2);
  });

  it('calculates knight legal jump moves over pawns', () => {
    const board = initialBoard();
    const knightMoves = getLegalMoves(board, 7, 1, 'w');
    expect(knightMoves).toContainEqual({ row: 5, col: 0 });
    expect(knightMoves).toContainEqual({ row: 5, col: 2 });
    expect(knightMoves.length).toBe(2);
  });

  it('correctly executes a move and updates board state', () => {
    const board = initialBoard();
    const nextState = makeMove(board, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    expect(nextState.board[6][4]).toBeNull();
    expect(nextState.board[4][4]).toEqual({ type: 'p', color: 'w' });
  });

  it('detects check on king', () => {
    const emptyBoard: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    emptyBoard[0][4] = { type: 'k', color: 'b' };
    emptyBoard[7][4] = { type: 'r', color: 'w' };
    expect(isKingInCheck(emptyBoard, 'b')).toBe(true);
    expect(isKingInCheck(emptyBoard, 'w')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/chessEngine.test.ts`
Expected: FAIL with missing module error.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/games/chess/chessEngine.ts
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type ChessCell = ChessPiece | null;
export type ChessBoard = ChessCell[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export function initialBoard(): ChessBoard {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRank[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
  }

  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: backRank[c], color: 'w' };
  }

  return board;
}

export function isInside(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getRawMoves(board: ChessBoard, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: Position[] = [];
  const { type, color } = piece;
  const forward = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;

  if (type === 'p') {
    if (isInside(row + forward, col) && !board[row + forward][col]) {
      moves.push({ row: row + forward, col });
      if (row === startRow && isInside(row + 2 * forward, col) && !board[row + 2 * forward][col]) {
        moves.push({ row: row + 2 * forward, col });
      }
    }
    for (const dc of [-1, 1]) {
      const nr = row + forward;
      const nc = col + dc;
      if (isInside(nr, nc) && board[nr][nc] && board[nr][nc]?.color !== color) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'n') {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInside(nr, nc)) {
        if (!board[nr][nc] || board[nr][nc]?.color !== color) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const directions: number[][] = [];
    if (type === 'r' || type === 'q') {
      directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
    }
    if (type === 'b' || type === 'q') {
      directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    for (const [dr, dc] of directions) {
      let step = 1;
      while (true) {
        const nr = row + dr * step;
        const nc = col + dc * step;
        if (!isInside(nr, nc)) break;
        const target = board[nr][nc];
        if (!target) {
          moves.push({ row: nr, col: nc });
        } else {
          if (target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
        step++;
      }
    }
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (isInside(nr, nc)) {
          if (!board[nr][nc] || board[nr][nc]?.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    }
  }

  return moves;
}

export function isKingInCheck(board: ChessBoard, color: PieceColor): boolean {
  let kingPos: Position | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
  }
  if (!kingPos) return false;

  const opponentColor: PieceColor = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === opponentColor) {
        const moves = getRawMoves(board, r, c);
        if (moves.some((m) => m.row === kingPos!.row && m.col === kingPos!.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getLegalMoves(board: ChessBoard, row: number, col: number, turn: PieceColor): Position[] {
  const piece = board[row][col];
  if (!piece || piece.color !== turn) return [];

  const rawMoves = getRawMoves(board, row, col);
  return rawMoves.filter((m) => {
    const newBoard = board.map((r) => [...r]);
    newBoard[m.row][m.col] = newBoard[row][col];
    newBoard[row][col] = null;
    return !isKingInCheck(newBoard, turn);
  });
}

export function makeMove(board: ChessBoard, move: Move): { board: ChessBoard; capturedPiece: ChessPiece | null } {
  const newBoard = board.map((r) => [...r]);
  const capturedPiece = newBoard[move.to.row][move.to.col];
  const movingPiece = newBoard[move.from.row][move.from.col];

  if (!movingPiece) return { board, capturedPiece: null };

  if (movingPiece.type === 'p' && (move.to.row === 0 || move.to.row === 7)) {
    newBoard[move.to.row][move.to.col] = { type: 'q', color: movingPiece.color };
  } else {
    newBoard[move.to.row][move.to.col] = movingPiece;
  }
  newBoard[move.from.row][move.from.col] = null;

  return { board: newBoard, capturedPiece };
}

export function isGameOver(board: ChessBoard, turn: PieceColor): { over: boolean; winner: PieceColor | 'draw' | null } {
  let hasLegalMove = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === turn) {
        if (getLegalMoves(board, r, c, turn).length > 0) {
          hasLegalMove = true;
          break;
        }
      }
    }
    if (hasLegalMove) break;
  }

  if (!hasLegalMove) {
    if (isKingInCheck(board, turn)) {
      return { over: true, winner: turn === 'w' ? 'b' : 'w' };
    }
    return { over: true, winner: 'draw' };
  }

  return { over: false, winner: null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/chessEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/games/chess/chessEngine.ts tests/chessEngine.test.ts
git commit -m "feat(games): implement complete chess engine and move validation with unit tests"
```

---

### Task 4: Couple Trivia & Tic-Tac-Toe Game Data & Logics

**Files:**
- Create: `src/features/games/trivia/triviaData.ts`
- Create: `src/features/games/tictactoe/ticTacToeLogic.ts`
- Test: `tests/triviaAndTicTacToe.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `TriviaQuestion`, `TRIVIA_PACKS`, `checkTicTacToeWinner()`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/triviaAndTicTacToe.test.ts
import { checkTicTacToeWinner } from '../src/features/games/tictactoe/ticTacToeLogic';
import { TRIVIA_PACKS } from '../src/features/games/trivia/triviaData';

describe('Trivia & TicTacToe Engines', () => {
  it('has comprehensive relationship trivia packs with questions', () => {
    expect(TRIVIA_PACKS.length).toBeGreaterThanOrEqual(2);
    expect(TRIVIA_PACKS[0].questions.length).toBeGreaterThanOrEqual(6);
  });

  it('detects 3-in-a-row winner for TicTacToe', () => {
    const board = [
      'X', 'X', 'X',
      null, 'O', null,
      'O', null, null
    ];
    const res = checkTicTacToeWinner(board);
    expect(res.winner).toBe('X');
    expect(res.winningLine).toEqual([0, 1, 2]);
  });

  it('detects diagonal win and draw', () => {
    const diagBoard = [
      'O', null, null,
      null, 'O', null,
      null, null, 'O'
    ];
    expect(checkTicTacToeWinner(diagBoard).winner).toBe('O');

    const drawBoard = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X'
    ];
    expect(checkTicTacToeWinner(drawBoard).isDraw).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/triviaAndTicTacToe.test.ts`
Expected: FAIL with missing modules.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/games/tictactoe/ticTacToeLogic.ts
export type TicTacToeCell = 'X' | 'O' | null;

export interface TicTacToeResult {
  winner: 'X' | 'O' | null;
  winningLine: number[] | null;
  isDraw: boolean;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function checkTicTacToeWinner(board: TicTacToeCell[]): TicTacToeResult {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combo, isDraw: false };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  return { winner: null, winningLine: null, isDraw: isFull };
}
```

```typescript
// src/features/games/trivia/triviaData.ts
export interface TriviaQuestion {
  id: string;
  question: string;
  category: string;
  options: [string, string, string, string];
  forfeit: string;
}

export interface TriviaPack {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: TriviaQuestion[];
}

export const TRIVIA_PACKS: TriviaPack[] = [
  {
    id: 'love_story',
    title: 'Our Love Story',
    description: 'How well do you remember the cute details of how we started?',
    icon: 'HeartHandshake',
    questions: [
      {
        id: 'ls1',
        question: 'What was the exact venue or setting of our very first date?',
        category: 'Firsts',
        options: ['Cozy Cafe / Coffee Shop', 'Nice Dinner Restaurant', 'Walk in the Park / Outdoors', 'Cinema or Event'],
        forfeit: 'Give your partner a 1-minute hand massage!'
      },
      {
        id: 'ls2',
        question: 'Who initiated the very first message or contact?',
        category: 'Firsts',
        options: ['You did', 'I did', 'A mutual friend introduced us', 'It was spontaneous'],
        forfeit: 'Say three things you secretly thought when you first saw them!'
      },
      {
        id: 'ls3',
        question: 'What was the first movie or show we binged together?',
        category: 'Memories',
        options: ['A Romantic Comedy', 'A Thriller / Sci-Fi', 'An Animated Movie', 'A Reality / Sitcom Show'],
        forfeit: 'Sing the opening theme of any show together!'
      },
      {
        id: 'ls4',
        question: 'Where was our first ever road trip or weekend getaway?',
        category: 'Travel',
        options: ['Beach / Coast', 'Mountains / Cabin', 'Vibrant City Trip', 'Cozy Staycation'],
        forfeit: 'Plan our next dream weekend getaway spot!'
      },
      {
        id: 'ls5',
        question: 'What meal or dish did we first cook together?',
        category: 'Food',
        options: ['Homemade Pasta / Pizza', 'Breakfast Pancakes / Eggs', 'BBQ / Grilled Dinner', 'Dessert / Baking'],
        forfeit: 'Promise to cook your partner breakfast this weekend!'
      },
      {
        id: 'ls6',
        question: 'What is our song or the song that always reminds you of us?',
        category: 'Music',
        options: ['A Soft Acoustic Ballad', 'A Pop Love Anthem', 'An R&B Smooth Track', 'An Indie Classic'],
        forfeit: 'Play the song and slow dance together right now!'
      }
    ]
  },
  {
    id: 'favorites_quirks',
    title: 'Favorites & Quirks',
    description: 'Test your knowledge about each other’s habits and preferences!',
    icon: 'Sparkles',
    questions: [
      {
        id: 'fq1',
        question: 'What is your partner’s ultimate comfort food after a tiring day?',
        category: 'Habits',
        options: ['Warm Pizza / Pasta', 'Ice Cream & Sweets', 'Spicy Noodles / Ramen', 'Fresh Burger & Fries'],
        forfeit: 'Get your partner a glass of water or favorite snack!'
      },
      {
        id: 'fq2',
        question: 'What is your partner’s primary Love Language?',
        category: 'Love',
        options: ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service / Gifts'],
        forfeit: 'Express their love language immediately!'
      },
      {
        id: 'fq3',
        question: 'How does your partner prefer their morning coffee or tea?',
        category: 'Mornings',
        options: ['Sweet & Creamy', 'Strong & Black', 'Herbal / Green Tea', 'Iced Latte'],
        forfeit: 'Make them their favorite beverage next morning!'
      },
      {
        id: 'fq4',
        question: 'What is their biggest pet peeve?',
        category: 'Quirks',
        options: ['Being late / Waiting', 'Loud chewing / Noise', 'Cluttered spaces', 'Indecision on what to eat'],
        forfeit: 'Do an impression of them when they are mildly annoyed!'
      },
      {
        id: 'fq5',
        question: 'If they won a free vacation tomorrow, where would they fly?',
        category: 'Dreams',
        options: ['Tropical Island Overwater Villa', 'Historic European City', 'Cozy Alpine Mountain Lodge', 'Vibrant Asian Metropolis'],
        forfeit: 'Show them 3 photos of their dream destination on your phone!'
      },
      {
        id: 'fq6',
        question: 'What is their favorite way to spend a lazy Sunday?',
        category: 'Relaxation',
        options: ['Cuddled in bed watching movies', 'Exploring outdoors & brunch', 'Cooking and relaxing with music', 'Shopping & café hopping'],
        forfeit: 'Give a 2-minute foot or head massage!'
      }
    ]
  }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/triviaAndTicTacToe.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/games/trivia/triviaData.ts src/features/games/tictactoe/ticTacToeLogic.ts tests/triviaAndTicTacToe.test.ts
git commit -m "feat(games): add couple trivia packs and tic-tac-toe engine with tests"
```

---

### Task 5: Game Screen UI Components (Truth or Dare, Wordle, Chess, Trivia, Tic-Tac-Toe)

**Files:**
- Create: `src/features/games/truthOrDare/TruthOrDareScreen.tsx`
- Create: `src/features/games/word/WordGameScreen.tsx`
- Create: `src/features/games/chess/ChessGameScreen.tsx`
- Create: `src/features/games/trivia/CoupleTriviaScreen.tsx`
- Create: `src/features/games/tictactoe/TicTacToeScreen.tsx`
- Create: `src/features/games/GamesScreen.tsx`

**Interfaces:**
- Consumes: Theme tokens, Lucide icons, Game engines (`truthOrDareData`, `wordGameLogic`, `chessEngine`, `triviaData`, `ticTacToeLogic`)
- Produces: Beautiful, interactive, haptic-friendly couple game screens with forfeit modals, player switchers, and game reset.

- [ ] **Step 1: Implement Truth or Dare Screen with animated bottle spin / card pick**
- [ ] **Step 2: Implement Wordle Couple Edition with virtual keyboard and color feedback tiles**
- [ ] **Step 3: Implement Chess Game Screen with visual board, turn indicators, move highlights, captured pieces tray**
- [ ] **Step 4: Implement Couple Trivia Screen with 2-player score comparison and compatibility meter**
- [ ] **Step 5: Implement Tic-Tac-Toe with couple emojis (❤️ vs 💖) and streak trackers**
- [ ] **Step 6: Implement GamesScreen Hub lobby featuring cards for all 5 games**
- [ ] **Step 7: Verify types and bundle build**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/games/
git commit -m "feat(games): implement complete interactive UI screens for all couple games"
```

---

### Task 6: Navigation Integration & Tab Bar Polish

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `GamesScreen`, `RootNavigator`
- Produces: Integrated 6-tab navigation or clean Games Tab with `Gamepad2` icon and smooth routing to individual games.

- [ ] **Step 1: Add GamesTab to RootNavigator**
- [ ] **Step 2: Ensure all tabs have balanced spacing, labels, and responsive layout**
- [ ] **Step 3: Run full Jest test suite and type check**

Run: `npm test && npm run typecheck`
Expected: All tests PASS and 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/RootNavigator.tsx src/types/index.ts
git commit -m "feat(navigation): integrate Games Hub into main navigation tab bar"
```

---

### Task 7: Comprehensive Verification & End-to-End Walkthrough

**Files:**
- Test: Full automated test suite
- Verify: Interactive game mechanics, visual layout, animations, error states, and responsive styling.

- [ ] **Step 1: Run all unit tests**
- [ ] **Step 2: Verify zero linter or TypeScript errors**
- [ ] **Step 3: Document walkthrough and gameplay details**
