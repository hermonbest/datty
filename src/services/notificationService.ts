import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
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

// Configure foreground notifications presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Setup Android notification channels
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
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

    await Notifications.setNotificationChannelAsync('daily-habits', {
      name: 'Daily Habits',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to setup android notification channels:', err);
  }
}

/**
 * Request permission and register Expo push token to Firestore
 */
export async function registerForPushNotificationsAsync(uid: string): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;

    // Save token to Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { expoPushToken: token }, { merge: true });
    return token;
  } catch (err) {
    console.warn('[Notifications] Could not get push token:', err);
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
}): Promise<boolean> {
  try {
    const message = {
      to: params.toToken,
      sound: 'default',
      title: params.title,
      body: params.body,
      channelId: params.channelId || 'partner-activity',
      data: params.data || {},
    };

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
      // Still write to in-app notification center, but skip loud push
    }
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
    // 1. Write in-app notification document in Firestore
    const notifsRef = collection(db, 'couples', coupleId, 'notifications');
    await addDoc(notifsRef, {
      category,
      type,
      title: copy.title,
      body: copy.body,
      data: data || {},
      recipientUid,
      senderUid,
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2. Send push notification if token available
    if (recipientPushToken) {
      const channelId =
        type.startsWith('nudge_') ? 'partner-nudges' : 'partner-activity';
      await sendPushNotification({
        toToken: recipientPushToken,
        title: copy.title,
        body: copy.body,
        channelId,
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
