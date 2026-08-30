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
