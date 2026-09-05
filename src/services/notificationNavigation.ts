import { createNavigationContainerRef } from '@react-navigation/native';
import { AppNotification, NotificationType } from '../types/notifications';

export const navigationRef = createNavigationContainerRef<any>();

export interface NotificationTarget {
  tabName: 'TodayTab' | 'CardsTab' | 'GamesTab' | 'MomentsTab' | 'ChatTab' | 'CalendarTab' | 'NotesTab';
  params?: Record<string, any>;
}

// Handler to trigger global Notes modal when outside component tree
let globalOpenNotesHandler: ((tab?: 'gratitude' | 'list' | 'partner') => void) | null = null;

export function registerGlobalOpenNotes(handler: ((tab?: 'gratitude' | 'list' | 'partner') => void) | null) {
  globalOpenNotesHandler = handler;
}

export function openNotesGlobally(tab?: 'gratitude' | 'list' | 'partner') {
  if (globalOpenNotesHandler) {
    globalOpenNotesHandler(tab);
    return true;
  }
  return false;
}

// Active multiplayer game tracking (so notifications for the currently active game can be auto-read and toasts suppressed)
let currentActiveGameId: string | null = null;

export function setActiveGameId(gameId: string | null) {
  currentActiveGameId = gameId;
}

export function getActiveGameId(): string | null {
  return currentActiveGameId;
}

/**
 * Resolves any notification (in-app notification or remote push payload)
 * into a concrete tab name and navigation parameters.
 */
export function resolveNotificationTarget(item: {
  type?: NotificationType | string;
  data?: Record<string, any>;
}): NotificationTarget {
  const explicitRoute = item.data?.route;
  const type = item.type;
  const data = item.data || {};

  // 1. If explicit route is provided
  if (explicitRoute) {
    if (explicitRoute === 'NotesTab' || explicitRoute === 'Notes') {
      return { tabName: 'NotesTab', params: data };
    }
    if (explicitRoute === 'TodayTab') {
      return { tabName: 'TodayTab', params: data };
    }
    if (explicitRoute === 'CardsTab') {
      return { tabName: 'CardsTab', params: data };
    }
    if (explicitRoute === 'GamesTab') {
      return { tabName: 'GamesTab', params: data };
    }
    if (explicitRoute === 'MomentsTab') {
      return { tabName: 'MomentsTab', params: data };
    }
    if (explicitRoute === 'ChatTab') {
      return { tabName: 'ChatTab', params: data };
    }
    if (explicitRoute === 'CalendarTab') {
      return { tabName: 'CalendarTab', params: data };
    }
  }

  // 2. Map by notification type
  switch (type) {
    case 'chat_message':
    case 'nudge_thinking_of_you':
      return { tabName: 'ChatTab', params: data };

    case 'daily_answered':
    case 'daily_revealed':
    case 'habit_daily_question':
      return { tabName: 'TodayTab', params: data };

    case 'moment_new':
      return { tabName: 'MomentsTab', params: data };

    case 'nudge_send_photo':
    case 'habit_what_are_you_doing_now':
      return { tabName: 'MomentsTab', params: { ...data, action: 'snap' } };

    case 'note_gratitude':
    case 'habit_evening_gratitude':
      return { tabName: 'NotesTab', params: { ...data, tab: 'gratitude' } };

    case 'note_list_item':
      return { tabName: 'NotesTab', params: { ...data, tab: 'list' } };

    case 'nudge_write_note':
    case 'habit_morning_note':
      return { tabName: 'NotesTab', params: { ...data, tab: 'gratitude' } };

    case 'game_challenge':
    case 'game_turn':
      return { tabName: 'GamesTab', params: data };

    case 'calendar_reminder':
      return { tabName: 'CalendarTab', params: data };

    default:
      return { tabName: 'TodayTab', params: data };
  }
}

/**
 * Perform actual navigation to the target tab/screen.
 */
export function navigateFromNotification(
  tabName: NotificationTarget['tabName'],
  params?: Record<string, any>
): boolean {
  if (tabName === 'NotesTab') {
    return openNotesGlobally(params?.tab || 'gratitude');
  }

  if (navigationRef.isReady()) {
    navigationRef.navigate(tabName, params);
    return true;
  } else {
    // If navigation container is not yet ready, retry shortly
    const timer = setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(tabName, params);
      }
    }, 300);
    return false;
  }
}
