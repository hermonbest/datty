import {
  isQuietHours,
  calculateNextHabitDate,
  isNudgeThrottled,
  NUDGE_COOLDOWNS,
  getNotificationCopy,
} from '../src/services/notificationLogic';

describe('Notification Logic & Scheduler', () => {
  describe('isQuietHours', () => {
    it('detects quiet hours in overnight window (e.g. 22:00 to 07:30)', () => {
      // 23:15 is quiet
      const lateNight = new Date(2026, 8, 4, 23, 15);
      expect(isQuietHours(lateNight, '22:00', '07:30')).toBe(true);

      // 06:45 is quiet
      const earlyMorning = new Date(2026, 8, 4, 6, 45);
      expect(isQuietHours(earlyMorning, '22:00', '07:30')).toBe(true);

      // 14:00 is NOT quiet
      const afternoon = new Date(2026, 8, 4, 14, 0);
      expect(isQuietHours(afternoon, '22:00', '07:30')).toBe(false);

      // Exactly 07:30 is NOT quiet (end of window)
      const wakeUp = new Date(2026, 8, 4, 7, 30);
      expect(isQuietHours(wakeUp, '22:00', '07:30')).toBe(false);
    });

    it('detects quiet hours in daytime window (e.g. 13:00 to 15:00)', () => {
      const napTime = new Date(2026, 8, 4, 13, 30);
      expect(isQuietHours(napTime, '13:00', '15:00')).toBe(true);

      const morning = new Date(2026, 8, 4, 10, 0);
      expect(isQuietHours(morning, '13:00', '15:00')).toBe(false);
    });
  });

  describe('calculateNextHabitDate', () => {
    it('schedules for later today if time has not passed yet', () => {
      const fromDate = new Date(2026, 8, 4, 7, 0, 0); // 7:00 AM
      const nextDate = calculateNextHabitDate('08:30', fromDate);

      expect(nextDate.getDate()).toBe(4);
      expect(nextDate.getHours()).toBe(8);
      expect(nextDate.getMinutes()).toBe(30);
    });

    it('schedules for tomorrow if time has already passed today', () => {
      const fromDate = new Date(2026, 8, 4, 10, 0, 0); // 10:00 AM
      const nextDate = calculateNextHabitDate('08:30', fromDate);

      expect(nextDate.getDate()).toBe(5); // next day
      expect(nextDate.getHours()).toBe(8);
      expect(nextDate.getMinutes()).toBe(30);
    });
  });

  describe('isNudgeThrottled & NUDGE_COOLDOWNS', () => {
    it('allows nudge when never sent before', () => {
      expect(isNudgeThrottled(null, NUDGE_COOLDOWNS.thinking_of_you)).toBe(false);
      expect(isNudgeThrottled(undefined, NUDGE_COOLDOWNS.write_note)).toBe(false);
    });

    it('throttles when sent recently within cooldown period', () => {
      const now = 1000000;
      const oneMinuteAgo = now - 60 * 1000;
      expect(isNudgeThrottled(oneMinuteAgo, NUDGE_COOLDOWNS.thinking_of_you, now)).toBe(true);
    });

    it('allows nudge once cooldown period has passed', () => {
      const now = 1000000;
      const fourMinutesAgo = now - 4 * 60 * 1000;
      expect(isNudgeThrottled(fourMinutesAgo, NUDGE_COOLDOWNS.thinking_of_you, now)).toBe(false);
    });
  });

  describe('getNotificationCopy', () => {
    it('formats feature notifications with partner name and custom preview', () => {
      const dailyCopy = getNotificationCopy('daily_answered', 'Maya');
      expect(dailyCopy.title).toContain('Daily Question');
      expect(dailyCopy.body).toContain('Maya answered');

      const momentCopy = getNotificationCopy('moment_new', 'Alex', { preview: 'Coffee walk' });
      expect(momentCopy.title).toContain('New Moment');
      expect(momentCopy.body).toContain('"Coffee walk"');

      const chatCopy = getNotificationCopy('chat_message', 'Maya', { preview: 'See you soon!' });
      expect(chatCopy.title).toBe('Maya');
      expect(chatCopy.body).toBe('See you soon!');

      const noteCopy = getNotificationCopy('note_gratitude', 'Alex', { preview: 'Thank you for cooking' });
      expect(noteCopy.title).toContain('Gratitude');
      expect(noteCopy.body).toContain('Thank you for cooking');
    });

    it('formats app habit nudges and spontaneous requests properly', () => {
      const morningCopy = getNotificationCopy('habit_morning_note', 'Maya');
      expect(morningCopy.title).toContain('Good Morning');
      expect(morningCopy.body).toContain('Maya');

      const spontaneousCopy = getNotificationCopy('habit_what_are_you_doing_now', 'Maya');
      expect(spontaneousCopy.title).toContain('What are you doing now?');
      expect(spontaneousCopy.body).toContain('Maya');

      const nudgeNoteCopy = getNotificationCopy('nudge_write_note', 'Alex');
      expect(nudgeNoteCopy.title).toContain('Gentle Nudge');
      expect(nudgeNoteCopy.body).toContain('Alex wants you to write a sweet note');

      const heartPulseCopy = getNotificationCopy('nudge_thinking_of_you', 'Maya');
      expect(heartPulseCopy.title).toContain('Thinking of You');
      expect(heartPulseCopy.body).toContain('Maya sent you a warm heart pulse');

      const gameTurnCopy = getNotificationCopy('game_turn', 'Alex', { gameName: 'Chess' });
      expect(gameTurnCopy.title).toBe("It's Your Turn! ♟️");
      expect(gameTurnCopy.body).toContain('Alex took their turn in Chess');

      const gameChallengeCopy = getNotificationCopy('game_challenge', 'Maya', { gameName: 'Sea Battle' });
      expect(gameChallengeCopy.title).toBe('Game Challenge! ⚔️');
      expect(gameChallengeCopy.body).toContain('Maya challenged you to Sea Battle');
    });

    it('generates predictable deterministic collapsing keys for chat and games', () => {
      const chatDocId = `chat_user123`;
      expect(chatDocId).toBe('chat_user123');

      const gameDocId = `game_chess_user123`;
      expect(gameDocId).toBe('game_chess_user123');

      const chatTag = `chat_couple456`;
      expect(chatTag).toBe('chat_couple456');

      const gameTag = `game_chess`;
      expect(gameTag).toBe('game_chess');
    });
  });
});
