import { useEffect, useMemo, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import {
  ref,
  onValue,
  update,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from './firebase';
import { PresenceData } from '../types';

export interface PresenceWritePatch {
  online?: boolean;
  typing?: string | null;
}

/**
 * Presence + typing indicator on Firebase Realtime Database.
 *
 * RTDB gives us two things Firestore couldn't:
 *  1. onDisconnect() — the online flag flips to false automatically when the
 *     app's socket drops (kill, airplane mode, network loss). No heartbeat or
 *     cleanup code needed.
 *  2. Local echo — our own presence updates apply instantly.
 *
 * Path: couples/{coupleId}/presence/{uid}
 * Shape: { online: bool, lastSeen: ms, typing: 'chat' | null }
 */
export function usePresence(
  coupleId: string | null,
  myUid: string | null,
  partnerUid: string | null
) {
  const [partnerPresence, setPartnerPresence] = useState<PresenceData | null>(null);

  const myPath = useMemo(
    () => (coupleId && myUid ? `couples/${coupleId}/presence/${myUid}` : null),
    [coupleId, myUid]
  );
  const partnerPath = useMemo(
    () => (coupleId && partnerUid ? `couples/${coupleId}/presence/${partnerUid}` : null),
    [coupleId, partnerUid]
  );

  // Diagnostic log for hook initialization
  useEffect(() => {
    console.log('[usePresence] Init:', { coupleId, myUid, partnerUid, myPath, partnerPath });
  }, [coupleId, myUid, partnerUid, myPath, partnerPath]);

  // Stable writer for my own presence node (partial update preserves other fields).
  const writePresence = useCallback(
    (patch: PresenceWritePatch) => {
      if (!myPath) {
        console.warn('[usePresence] writePresence skipped: myPath is null', { coupleId, myUid });
        return;
      }
      console.log('[usePresence] writePresence ->', myPath, patch);
      update(ref(rtdb, myPath), patch).catch((err) => {
        console.warn('[usePresence] writePresence error:', err);
      });
    },
    [myPath, coupleId, myUid]
  );

  // Presence lifecycle: mark offline on socket disconnect via onDisconnect(),
  // and on AppState background. Refresh online when foregrounded.
  useEffect(() => {
    if (!myPath) return;

    const presenceRef = ref(rtdb, myPath);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubConnected = onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      console.log('[usePresence] RTDB .info/connected:', isConnected);
      if (isConnected) {
        // Classic presence pattern: this runs when the socket drops,
        // no matter what state the app is in.
        onDisconnect(presenceRef)
          .set({ online: false, lastSeen: serverTimestamp() })
          .then(() => {
            update(presenceRef, { online: true, lastSeen: serverTimestamp() }).catch((err) => {
              console.warn('[usePresence] Initial online write error:', err);
            });
          })
          .catch((err) => {
            console.warn('[usePresence] onDisconnect setup error:', err);
          });
      }
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      console.log('[usePresence] AppState changed:', state);
      if (state === 'active') {
        update(presenceRef, { online: true, typing: null }).catch(() => {});
      } else {
        update(presenceRef, { online: false, typing: null }).catch(() => {});
      }
    });

    return () => {
      unsubConnected();
      appStateSub.remove();
      update(presenceRef, { online: false, typing: null }).catch(() => {});
    };
  }, [myPath]);

  // Subscribe to partner presence.
  useEffect(() => {
    if (!partnerPath) {
      console.log('[usePresence] partnerPath is null, not subscribing to partner presence.');
      return;
    }
    console.log('[usePresence] Subscribing to partner path:', partnerPath);
    const partnerRef = ref(rtdb, partnerPath);
    const unsubscribe = onValue(
      partnerRef,
      (snap) => {
        console.log('[usePresence] Partner snapshot exists:', snap.exists(), 'val:', snap.val());
        if (snap.exists()) {
          const d = snap.val();
          setPartnerPresence({
            online: d.online,
            lastSeen: d.lastSeen || null,
            typing: d.typing || null,
            updatedAt: d.lastSeen || null,
          });
        } else {
          setPartnerPresence(null);
        }
      },
      (error) => {
        console.warn('[usePresence] Partner subscription error:', error);
        setPartnerPresence(null);
      }
    );
    return () => {
      console.log('[usePresence] Unsubscribing from partner path:', partnerPath);
      unsubscribe();
    };
  }, [partnerPath]);

  return { partnerPresence, writePresence };
}