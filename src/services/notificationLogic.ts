import { NotificationType } from '../types/notifications';

/**
 * Checks whether a given Date falls within the user's quiet hours.
 * quietHoursStart and quietHoursEnd are strings formatted as "HH:mm" (24h).
 */
export function isQuietHours(date: Date, quietStart: string, quietEnd: string): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes < endMinutes) {
    // Normal window: e.g. 13:00 to 15:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window: e.g. 22:00 to 07:30
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Calculates the next trigger timestamp for a daily habit given a "HH:mm" string.
 */
export function calculateNextHabitDate(timeStr: string, fromDate: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date(fromDate);
  target.setHours(hours, minutes, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (target.getTime() <= fromDate.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Checks whether a nudge request is allowed or throttled by cooldown.
 */
export function isNudgeThrottled(lastNudgeTimeMs: number | null | undefined, cooldownMs: number, nowMs: number = Date.now()): boolean {
  if (!lastNudgeTimeMs) return false;
  return nowMs - lastNudgeTimeMs < cooldownMs;
}

export const NUDGE_COOLDOWNS = {
  thinking_of_you: 3 * 60 * 1000, // 3 minutes
  write_note: 60 * 60 * 1000, // 1 hour
  send_photo: 60 * 60 * 1000, // 1 hour
};

/**
 * Generates copy for each notification type.
 */
export function getNotificationCopy(
  type: NotificationType,
  partnerName: string = 'Partner',
  extra?: { preview?: string; gameName?: string; eventTitle?: string }
): { title: string; body: string } {
  switch (type) {
    case 'daily_answered':
      return {
        title: 'Daily Question 💌',
        body: `${partnerName} answered today's question! Answer yours to unlock both answers.`,
      };
    case 'daily_revealed':
      return {
        title: 'Answers Revealed! ✨',
        body: `Both of you answered! Tap to see what ${partnerName} wrote.`,
      };
    case 'moment_new':
      return {
        title: 'New Moment 📸',
        body: extra?.preview
          ? `${partnerName} shared a moment: "${extra.preview}"`
          : `${partnerName} shared a new moment with you!`,
      };
    case 'chat_message':
      return {
        title: partnerName,
        body: extra?.preview || 'Sent you a new message 💬',
      };
    case 'note_gratitude':
      return {
        title: 'Gratitude Note 💕',
        body: extra?.preview
          ? `${partnerName} wrote: "${extra.preview}"`
          : `${partnerName} added a new sweet note for you!`,
      };
    case 'note_list_item':
      return {
        title: 'Shared List 📝',
        body: extra?.preview || `${partnerName} updated your couple list!`,
      };
    case 'calendar_reminder':
      return {
        title: 'Upcoming Date 🥂',
        body: extra?.eventTitle ? `Reminder: ${extra.eventTitle}` : 'You have an upcoming event!',
      };
    case 'game_challenge':
      return {
        title: 'Game Challenge! ⚔️',
        body: `${partnerName} challenged you to ${extra?.gameName || 'a game'}! Tap to play.`,
      };
    case 'game_turn':
      return {
        title: "It's Your Turn! ♟️",
        body: `${partnerName} took their turn in ${extra?.gameName || 'your game'}.`,
      };
    case 'nudge_write_note':
      return {
        title: 'Gentle Nudge 💌',
        body: `${partnerName} wants you to write a sweet note today!`,
      };
    case 'nudge_send_photo':
      return {
        title: 'Photo Request 🤳',
        body: `${partnerName} wants to see what you're doing right now! Send a snap.`,
      };
    case 'nudge_thinking_of_you':
      return {
        title: 'Thinking of You 💓',
        body: `${partnerName} sent you a warm heart pulse!`,
      };
    case 'habit_morning_note':
      return {
        title: 'Good Morning ☀️',
        body: `Brighten ${partnerName}'s day — leave a quick sweet note or message!`,
      };
    case 'habit_evening_gratitude':
      return {
        title: 'Evening Reflection 💖',
        body: `What is one thing ${partnerName} did today that made you smile? Add a gratitude note!`,
      };
    case 'habit_daily_question':
      return {
        title: 'Daily Question 💭',
        body: `Today's question is waiting for you and ${partnerName}! Take 30 seconds to answer.`,
      };
    case 'habit_what_are_you_doing_now':
      return {
        title: 'What are you doing now? 📸',
        body: `Snap a quick photo of your current moment and share it with ${partnerName}!`,
      };
    default:
      return {
        title: 'Us Notification',
        body: 'You have a new update from your partner.',
      };
  }
}
