export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  coupleId: string | null;
  createdAt: any;
  updatedAt?: any;
}

export interface Couple {
  id: string;
  memberUids: [string, string];
  createdAt: any;
  timezone: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  deck?: string;
  subtitle?: string;
  order: number;
}

export interface DailyAnswer {
  uid: string;
  text: string;
  answeredAt: any;
}

export interface DailyQuestionState {
  dateId: string;
  question: Question | null;
  myAnswer: DailyAnswer | null;
  partnerAnswer: DailyAnswer | null;
  isRevealed: boolean;
}

export interface Moment {
  id: string;
  authorUid: string;
  imageURL: string;
  caption: string;
  createdAt: any;
}

export interface ChatReplyReference {
  type?: 'card' | 'daily' | 'message';
  deckTitle?: string;
  questionText?: string;
  answerText?: string;
  authorName?: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string | null;
  imageURL: string | null;
  audioURL?: string | null;
  audioDuration?: number | null;
  createdAt: any;
  replyTo?: ChatReplyReference | null;
  reaction?: string | null;
  // Local-only state for optimistic UI
  pending?: boolean;
  error?: boolean;
}

export interface CoupleEvent {
  id: string;
  title: string;
  date: string; // "MM-DD" for recurring or "YYYY-MM-DD" for one-off
  recurringYearly: boolean;
  notes: string | null;
  createdAt: any;
}

export * from './games';

