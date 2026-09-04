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

export type ChessGameMode = 'couple' | 'pass_and_play';

export interface ChessFirestoreDoc {
  boardJson: string;
  turn: 'w' | 'b';
  whiteUid: string;
  blackUid: string;
  whiteName: string;
  blackName: string;
  capturedByWhite: { type: string; color: string }[];
  capturedByBlack: { type: string; color: string }[];
  winner: 'w' | 'b' | 'draw' | null;
  moveCount: number;
  lastMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
  lastMoveBy?: string;
  updatedAt?: any;
}

