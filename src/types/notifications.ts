export type NotificationCategory = 'feature' | 'app_nudge';

export type NotificationType =
  // Feature Specific
  | 'daily_answered'
  | 'daily_revealed'
  | 'moment_new'
  | 'chat_message'
  | 'note_gratitude'
  | 'note_list_item'
  | 'calendar_reminder'
  | 'game_challenge'
  | 'game_turn'
  // App Nudges & Habits
  | 'nudge_write_note'
  | 'nudge_send_photo'
  | 'nudge_thinking_of_you'
  | 'habit_morning_note'
  | 'habit_evening_gratitude'
  | 'habit_daily_question'
  | 'habit_what_are_you_doing_now';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    route?: string;
    senderUid?: string;
    referenceId?: string;
    gameId?: string;
  };
  recipientUid: string;
  senderUid?: string;
  read: boolean;
  createdAt: any;
}

export interface NotificationPreferences {
  // Feature alerts
  chatMessages: boolean;
  dailyQuestions: boolean;
  moments: boolean;
  coupleNotes: boolean;
  calendarReminders: boolean;
  gameAlerts: boolean;
  // Habit & Nudge alerts
  morningLoveNote: boolean;
  morningLoveNoteTime: string; // "08:30"
  eveningGratitude: boolean;
  eveningGratitudeTime: string; // "20:30"
  spontaneousPhotoPrompt: boolean; // "What are you doing now?"
  dailyQuestionReminder: boolean;
  dailyQuestionReminderTime: string; // "17:30"
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:30"
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  chatMessages: true,
  dailyQuestions: true,
  moments: true,
  coupleNotes: true,
  calendarReminders: true,
  gameAlerts: true,
  morningLoveNote: true,
  morningLoveNoteTime: '08:30',
  eveningGratitude: true,
  eveningGratitudeTime: '20:30',
  spontaneousPhotoPrompt: true,
  dailyQuestionReminder: true,
  dailyQuestionReminderTime: '17:30',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:30',
};
