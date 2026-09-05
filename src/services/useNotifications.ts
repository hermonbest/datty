import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { useCouple } from './coupleContext';
import {
  AppNotification,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
} from '../types/notifications';
import {
  registerForPushNotificationsAsync,
  setupNotificationChannels,
  scheduleHabitNotifications,
  dispatchCoupleNotification,
} from './notificationService';
import { isNudgeThrottled, NUDGE_COOLDOWNS } from './notificationLogic';
import { cache, CacheKeys } from './cache';

export function useNotifications() {
  const { coupleId, myUid, partnerUid, userProfile, partnerProfile } = useCouple();

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return myUid ? cache.getMemory<AppNotification[]>(CacheKeys.notifications(myUid)) || [] : [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!myUid) return false;
    return cache.getMemory(CacheKeys.notifications(myUid)) === null;
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    userProfile?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [lastNudgeTimes, setLastNudgeTimes] = useState<Record<string, number>>({});

  // 1. Initial push setup and channel creation on mount
  useEffect(() => {
    if (!myUid) return;
    setupNotificationChannels();
    registerForPushNotificationsAsync(myUid);
  }, [myUid]);

  // 2. Schedule recurring local habits when preferences or partner changes
  useEffect(() => {
    scheduleHabitNotifications(
      preferences,
      partnerProfile?.displayName || 'Partner'
    );
  }, [preferences, partnerProfile?.displayName]);

  // 3. Sync preferences when userProfile updates
  useEffect(() => {
    if (userProfile?.notificationPreferences) {
      setPreferences(userProfile.notificationPreferences);
    }
  }, [userProfile?.notificationPreferences]);

  // 4. Real-time subscription to in-app notifications
  useEffect(() => {
    if (!coupleId || !myUid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (notifications.length === 0) {
      cache.get<AppNotification[]>(CacheKeys.notifications(myUid)).then((cached) => {
        if (cached && cached.length > 0) {
          setNotifications(cached);
          setLoading(false);
        }
      });
    }

    const notifsRef = collection(db, 'couples', coupleId, 'notifications');
    const q = query(
      notifsRef,
      where('recipientUid', '==', myUid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const getMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          return 0;
        };

        const items: AppNotification[] = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AppNotification, 'id'>),
          }))
          .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));

        setNotifications(items);
        cache.set(CacheKeys.notifications(myUid), items);
        setLoading(false);
      },
      (err) => {
        console.warn('[useNotifications] Snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId, myUid]);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!coupleId) return;
      try {
        const notifDoc = doc(db, 'couples', coupleId, 'notifications', notificationId);
        await updateDoc(notifDoc, { read: true });
      } catch (err) {
        console.warn('[useNotifications] Error marking as read:', err);
      }
    },
    [coupleId]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!coupleId || !myUid) return;
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter((n) => !n.read);
      unread.forEach((n) => {
        const notifDoc = doc(db, 'couples', coupleId, 'notifications', n.id);
        batch.update(notifDoc, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('[useNotifications] Error marking all as read:', err);
    }
  }, [coupleId, myUid, notifications]);

  // Save updated preferences to Firestore and local state
  const updatePreferences = useCallback(
    async (newPrefs: Partial<NotificationPreferences>) => {
      if (!myUid) return;
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);
      try {
        const userRef = doc(db, 'users', myUid);
        await setDoc(userRef, { notificationPreferences: updated }, { merge: true });
      } catch (err) {
        console.warn('[useNotifications] Error updating preferences:', err);
      }
    },
    [myUid, preferences]
  );

  // Send a couple nudge (e.g. 'nudge_write_note', 'nudge_send_photo', 'nudge_thinking_of_you')
  const sendNudge = useCallback(
    async (type: 'nudge_write_note' | 'nudge_send_photo' | 'nudge_thinking_of_you') => {
      if (!coupleId || !myUid || !partnerUid) {
        return { success: false, reason: 'unlinked' };
      }

      // Check throttling
      const cooldownKey =
        type === 'nudge_thinking_of_you'
          ? 'thinking_of_you'
          : type === 'nudge_write_note'
          ? 'write_note'
          : 'send_photo';

      const cooldown = NUDGE_COOLDOWNS[cooldownKey];
      const lastTime = lastNudgeTimes[type];

      if (isNudgeThrottled(lastTime, cooldown)) {
        const remainingMinutes = Math.ceil((cooldown - (Date.now() - (lastTime || 0))) / 60000);
        return {
          success: false,
          reason: 'throttled',
          remainingMinutes,
        };
      }

      // Update cooldown tracker
      setLastNudgeTimes((prev) => ({ ...prev, [type]: Date.now() }));

      const nudgeData =
        type === 'nudge_thinking_of_you'
          ? { route: 'ChatTab' }
          : type === 'nudge_write_note'
          ? { route: 'NotesTab', tab: 'gratitude' }
          : { route: 'MomentsTab', action: 'snap' };

      // Dispatch to partner
      await dispatchCoupleNotification({
        coupleId,
        senderUid: myUid,
        recipientUid: partnerUid,
        recipientPushToken: partnerProfile?.expoPushToken,
        type,
        category: 'app_nudge',
        partnerName: userProfile?.displayName || 'Your partner',
        data: nudgeData,
        preferences: partnerProfile?.notificationPreferences,
      });

      return { success: true };
    },
    [coupleId, myUid, partnerUid, partnerProfile, userProfile, lastNudgeTimes]
  );

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    sendNudge,
  };
}
