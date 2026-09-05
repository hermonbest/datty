jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: () => true,
    navigate: jest.fn(),
  }),
}));

import { resolveNotificationTarget } from '../src/services/notificationNavigation';

describe('resolveNotificationTarget', () => {
  it('routes explicit routes correctly', () => {
    expect(resolveNotificationTarget({ data: { route: 'ChatTab' } })).toEqual({
      tabName: 'ChatTab',
      params: { route: 'ChatTab' },
    });

    expect(resolveNotificationTarget({ data: { route: 'TodayTab', dateId: '2026-09-05' } })).toEqual({
      tabName: 'TodayTab',
      params: { route: 'TodayTab', dateId: '2026-09-05' },
    });

    expect(resolveNotificationTarget({ data: { route: 'NotesTab', tab: 'gratitude' } })).toEqual({
      tabName: 'NotesTab',
      params: { route: 'NotesTab', tab: 'gratitude' },
    });

    expect(resolveNotificationTarget({ data: { route: 'GamesTab', gameId: 'tic_tac_toe' } })).toEqual({
      tabName: 'GamesTab',
      params: { route: 'GamesTab', gameId: 'tic_tac_toe' },
    });
  });

  it('maps notification types to correct destinations when route is omitted', () => {
    // Chat & thinking of you
    expect(resolveNotificationTarget({ type: 'chat_message' })).toEqual({
      tabName: 'ChatTab',
      params: {},
    });
    expect(resolveNotificationTarget({ type: 'nudge_thinking_of_you' })).toEqual({
      tabName: 'ChatTab',
      params: {},
    });

    // Daily question
    expect(resolveNotificationTarget({ type: 'daily_answered' })).toEqual({
      tabName: 'TodayTab',
      params: {},
    });
    expect(resolveNotificationTarget({ type: 'daily_revealed' })).toEqual({
      tabName: 'TodayTab',
      params: {},
    });

    // Moments & Photo prompt
    expect(resolveNotificationTarget({ type: 'moment_new' })).toEqual({
      tabName: 'MomentsTab',
      params: {},
    });
    expect(resolveNotificationTarget({ type: 'nudge_send_photo' })).toEqual({
      tabName: 'MomentsTab',
      params: { action: 'snap' },
    });

    // Notes
    expect(resolveNotificationTarget({ type: 'note_gratitude' })).toEqual({
      tabName: 'NotesTab',
      params: { tab: 'gratitude' },
    });
    expect(resolveNotificationTarget({ type: 'note_list_item' })).toEqual({
      tabName: 'NotesTab',
      params: { tab: 'list' },
    });
    expect(resolveNotificationTarget({ type: 'nudge_write_note' })).toEqual({
      tabName: 'NotesTab',
      params: { tab: 'gratitude' },
    });

    // Games
    expect(resolveNotificationTarget({ type: 'game_challenge', data: { gameId: 'chess' } })).toEqual({
      tabName: 'GamesTab',
      params: { gameId: 'chess' },
    });

    // Calendar
    expect(resolveNotificationTarget({ type: 'calendar_reminder' })).toEqual({
      tabName: 'CalendarTab',
      params: {},
    });
  });
});
