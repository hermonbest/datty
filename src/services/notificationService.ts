import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AppNotification,
  NotificationCategory,
  NotificationType,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notifications';
import {
  getNotificationCopy,
  calculateNextHabitDate,
  isQuietHours,
  isNudgeThrottled,
  NUDGE_COOLDOWNS,
} from './notificationLogic';

// Configure foreground notifications presentation (suppress OS banners/alerts while app is open to show exclusively in-app toasts)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
} catch (e) {
  // Native module not linked in current APK
}

/**
 * Setup Android notification channels
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    if (!Notifications.setNotificationChannelAsync) return;
    await Notifications.setNotificationChannelAsync('partner-activity', {
      name: 'Partner Activity',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E05A6D',
    });

    await Notifications.setNotificationChannelAsync('partner-nudges', {
      name: 'Love & Nudges',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 150, 150, 150, 150],
      lightColor: '#FF6F61',
    });

    await Notifications.setNotificationChannelAsync('game-alerts', {
      name: 'Game Turns & Challenges',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#6B4EFF',
    });

    await Notifications.setNotificationChannelAsync('daily-habits', {
      name: 'Daily Habits',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (err) {
    // Gracefully handle if native channels are unavailable in current binary
  }
}

/**
 * Request permission and register Expo push token to Firestore
 */
export async function registerForPushNotificationsAsync(uid: string): Promise<string | null> {
  try {
    const isExpoGo =
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Constants as any).appOwnership === 'expo';

    if (isExpoGo && Platform.OS === 'android') {
      console.info(
        '[Notifications] Running in Expo Go on Android: remote push notifications require a development build (npx expo run:android). In-app notifications and local reminders remain active.'
      );
      return null;
    }

    if (!Device.isDevice) {
      console.info('[Notifications] Remote push notifications require a physical device');
    }

    if (!Notifications.getPermissionsAsync || !Notifications.getExpoPushTokenAsync) {
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse?.data;
    if (!token) return null;

    // Save token to Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { expoPushToken: token }, { merge: true });
    return token;
  } catch (err: any) {
    console.warn('[Notifications] Push token unavailable (requires new dev build):', err?.message || err);
    return null;
  }
}

/**
 * Send remote push notification via Expo Push API directly
 */
export async function sendPushNotification(params: {
  toToken: string;
  title: string;
  body: string;
  channelId?: string;
  data?: Record<string, any>;
  tag?: string;
  collapseId?: string;
  threadId?: string;
}): Promise<boolean> {
  try {
    const message: Record<string, any> = {
      to: params.toToken,
      sound: 'default',
      title: params.title,
      body: params.body,
      channelId: params.channelId || 'partner-activity',
      data: params.data || {},
    };

    if (params.tag) message.tag = params.tag;
    if (params.collapseId) message.collapseId = params.collapseId;
    if (params.threadId) message.threadId = params.threadId;

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const json = await res.json();
    return json?.data?.status === 'ok';
  } catch (err) {
    console.warn('[Notifications] Error sending push notification:', err);
    return false;
  }
}

/**
 * Dispatches an event-driven notification to Firestore and remote push
 */
export async function dispatchCoupleNotification(params: {
  coupleId: string;
  senderUid: string;
  recipientUid: string;
  recipientPushToken?: string | null;
  type: NotificationType;
  category?: NotificationCategory;
  partnerName?: string;
  preview?: string;
  gameName?: string;
  eventTitle?: string;
  data?: Record<string, any>;
  preferences?: NotificationPreferences;
}): Promise<void> {
  const { coupleId, senderUid, recipientUid, recipientPushToken, type, data } = params;

  // Check quiet hours if recipient has quiet hours enabled
  let suppressPush = false;
  if (params.preferences?.quietHoursEnabled) {
    const now = new Date();
    if (
      isQuietHours(
        now,
        params.preferences.quietHoursStart,
        params.preferences.quietHoursEnd
      )
    ) {
      console.log('[Notifications] Suppressed push during quiet hours');
      suppressPush = true;
    }
  }

  // Check category preferences
  if (params.preferences) {
    if (type === 'chat_message' && params.preferences.chatMessages === false) suppressPush = true;
    if ((type === 'game_turn' || type === 'game_challenge') && params.preferences.gameAlerts === false) suppressPush = true;
    if ((type === 'daily_answered' || type === 'daily_revealed') && params.preferences.dailyQuestions === false) suppressPush = true;
    if (type === 'moment_new' && params.preferences.moments === false) suppressPush = true;
    if (type.startsWith('note_') && params.preferences.coupleNotes === false) suppressPush = true;
    if (type === 'calendar_reminder' && params.preferences.calendarReminders === false) suppressPush = true;
  }

  const copy = getNotificationCopy(type, params.partnerName || 'Partner', {
    preview: params.preview,
    gameName: params.gameName,
    eventTitle: params.eventTitle,
  });

  const category: NotificationCategory =
    params.category ||
    (type.startsWith('habit_') || type.startsWith('nudge_') ? 'app_nudge' : 'feature');

  try {
    // 1. Write or update in-app notification document in Firestore.
    // For chat messages, collapse into a single document per recipient (chat_<recipientUid>)
    // so incoming messages update the latest notification rather than accumulating duplicates.
    // For game turns, collapse into game_<gameId>_<recipientUid> so active game turns update cleanly.
    const notifDocId =
      type === 'chat_message'
        ? `chat_${recipientUid}`
        : (type === 'game_turn' || type === 'game_challenge') && data?.gameId
        ? `game_${data.gameId}_${recipientUid}`
        : undefined;

    const notifPayload = {
      category,
      type,
      title: copy.title,
      body: copy.body,
      data: data || {},
      recipientUid,
      senderUid,
      read: false,
      createdAt: serverTimestamp(),
    };

    if (notifDocId) {
      const notifRef = doc(db, 'couples', coupleId, 'notifications', notifDocId);
      await setDoc(notifRef, notifPayload, { merge: true });
    } else {
      const notifsRef = collection(db, 'couples', coupleId, 'notifications');
      await addDoc(notifsRef, notifPayload);
    }

    // 2. Send push notification if token available and not suppressed
    if (suppressPush) return;

    let token = recipientPushToken;
    if (!token && recipientUid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', recipientUid));
        if (userDoc.exists()) {
          token = userDoc.data()?.expoPushToken || null;
        }
      } catch (tokenErr) {
        console.warn('[Notifications] Fallback token fetch error:', tokenErr);
      }
    }

    if (token) {
      let channelId = 'partner-activity';
      let tag: string | undefined;
      let collapseId: string | undefined;
      let threadId: string | undefined;

      if (type.startsWith('nudge_')) {
        channelId = 'partner-nudges';
      } else if (type === 'game_turn' || type === 'game_challenge') {
        channelId = 'game-alerts';
        tag = `game_${data?.gameId || 'turn'}`;
        collapseId = `game_${data?.gameId || 'turn'}`;
        threadId = `game_${data?.gameId || 'turn'}`;
      } else if (type === 'chat_message') {
        tag = `chat_${coupleId}`;
        collapseId = `chat_${coupleId}`;
        threadId = `chat_${coupleId}`;
      }

      await sendPushNotification({
        toToken: token,
        title: copy.title,
        body: copy.body,
        channelId,
        tag,
        collapseId,
        threadId,
        data: {
          type,
          category,
          senderUid,
          ...data,
        },
      });
    }
  } catch (err) {
    console.warn('[Notifications] Error dispatching notification:', err);
  }
}

/**
 * Convenience helper to notify partner when it is their turn in a game
 */
export async function notifyGameTurn(params: {
  coupleId: string;
  senderUid: string;
  recipientUid: string;
  gameId: string;
  gameName: string;
  partnerName?: string;
  recipientPushToken?: string | null;
  preferences?: NotificationPreferences;
}): Promise<void> {
  return dispatchCoupleNotification({
    coupleId: params.coupleId,
    senderUid: params.senderUid,
    recipientUid: params.recipientUid,
    recipientPushToken: params.recipientPushToken,
    type: 'game_turn',
    partnerName: params.partnerName,
    gameName: params.gameName,
    data: { route: 'GamesTab', gameId: params.gameId },
    preferences: params.preferences,
  });
}

const HABIT_NOTIFICATION_IDS = {
  morning: 'datty_habit_morning',
  evening: 'datty_habit_evening',
  question: 'datty_habit_question',
  photo: 'datty_habit_photo',
};

/**
 * Schedule on-device recurring daily connection habits
 */
export async function scheduleHabitNotifications(
  preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
  partnerName: string = 'Partner'
): Promise<void> {
  try {
    if (!Notifications.scheduleNotificationAsync) return;
    // Cancel existing habits first
    await Notifications.cancelScheduledNotificationAsync(HABIT_NOTIFICATION_IDS.morning).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(HABIT_NOTIFICATION_IDS.evening).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(HABIT_NOTIFICATION_IDS.question).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(HABIT_NOTIFICATION_IDS.photo).catch(() => {});

    // Morning love note
    if (preferences.morningLoveNote) {
      const [h, m] = preferences.morningLoveNoteTime.split(':').map(Number);
      const copy = getNotificationCopy('habit_morning_note', partnerName);
      await Notifications.scheduleNotificationAsync({
        identifier: HABIT_NOTIFICATION_IDS.morning,
        content: {
          title: copy.title,
          body: copy.body,
          data: { route: 'NotesTab' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    }

    // Evening gratitude
    if (preferences.eveningGratitude) {
      const [h, m] = preferences.eveningGratitudeTime.split(':').map(Number);
      const copy = getNotificationCopy('habit_evening_gratitude', partnerName);
      await Notifications.scheduleNotificationAsync({
        identifier: HABIT_NOTIFICATION_IDS.evening,
        content: {
          title: copy.title,
          body: copy.body,
          data: { route: 'NotesTab', tab: 'gratitude' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    }

    // Daily question reminder
    if (preferences.dailyQuestionReminder) {
      const [h, m] = preferences.dailyQuestionReminderTime.split(':').map(Number);
      const copy = getNotificationCopy('habit_daily_question', partnerName);
      await Notifications.scheduleNotificationAsync({
        identifier: HABIT_NOTIFICATION_IDS.question,
        content: {
          title: copy.title,
          body: copy.body,
          data: { route: 'TodayTab' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    }

    // Spontaneous "What are you doing now?" photo prompt (e.g. at 2:15 PM)
    if (preferences.spontaneousPhotoPrompt) {
      const copy = getNotificationCopy('habit_what_are_you_doing_now', partnerName);
      await Notifications.scheduleNotificationAsync({
        identifier: HABIT_NOTIFICATION_IDS.photo,
        content: {
          title: copy.title,
          body: copy.body,
          data: { route: 'MomentsTab', action: 'snap' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 14,
          minute: 15,
        },
      });
    }
  } catch (err) {
    console.warn('[Notifications] Error scheduling habit notifications:', err);
  }
}
