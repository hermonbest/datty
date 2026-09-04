import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';
import { db, rtdb } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import {
  DreamHouseRoom,
  DreamHousePlacedItem,
  DreamHouseLiveSync,
  DreamHouseLock,
  DreamHouseLiveMove,
} from '../../../types/games';
import {
  createDefaultStarterRoom,
  CATALOG_BY_ID,
  canUserDragItem,
  clampGridCoords,
  getRotatedDimensions,
  DEFAULT_GRID_SIZE,
} from './dreamHouseLogic';

export interface UseDreamHouseReturn {
  room: DreamHouseRoom | null;
  items: DreamHousePlacedItem[];
  locks: Record<string, DreamHouseLock>;
  liveMoves: Record<string, DreamHouseLiveMove>;
  loading: boolean;
  partnerName: string;
  isLinked: boolean;
  myUid: string | null;
  addItem: (templateId: string) => Promise<void>;
  deleteItem: (instanceId: string) => Promise<void>;
  rotateItem: (instanceId: string) => Promise<void>;
  acquireLock: (instanceId: string) => Promise<boolean>;
  publishLiveMove: (instanceId: string, qX: number, qY: number) => void;
  commitItemMove: (instanceId: string, qX: number, qY: number) => Promise<void>;
  releaseLock: (instanceId: string) => Promise<void>;
  resetRoom: () => Promise<void>;
}

export function useDreamHouse(): UseDreamHouseReturn {
  const { coupleId, myUid, userProfile, partnerProfile, isLinked } = useCouple();

  const [room, setRoom] = useState<DreamHouseRoom | null>(() =>
    createDefaultStarterRoom(myUid || 'demo_user')
  );
  const [locks, setLocks] = useState<Record<string, DreamHouseLock>>({});
  const [liveMoves, setLiveMoves] = useState<Record<string, DreamHouseLiveMove>>({});
  const [loading, setLoading] = useState<boolean>(Boolean(isLinked && coupleId));

  const partnerName = partnerProfile?.displayName || 'Partner';
  const myName = userProfile?.displayName || 'You';

  // Throttle timer ref for live moves in RTDB
  const lastLiveMoveTimeRef = useRef<number>(0);

  // Firestore reference
  const firestoreDocRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'dream_house') : null;

  // RTDB sync references
  const rtdbSyncPath = coupleId ? `couples/${coupleId}/games/dream_house/sync` : null;

  // 1. Subscribe to Firestore permanent house state
  useEffect(() => {
    if (!firestoreDocRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      firestoreDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DreamHouseRoom;
          setRoom(data);
        } else {
          // Initialize starter room
          const defaultRoom = createDefaultStarterRoom(myUid || 'initial');
          try {
            await setDoc(firestoreDocRef, defaultRoom);
            setRoom(defaultRoom);
          } catch (err) {
            console.warn('[useDreamHouse] Error initializing room in Firestore:', err);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useDreamHouse] Firestore snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId, myUid]);

  // 2. Subscribe to Firebase RTDB ephemeral locks & live drag moves
  useEffect(() => {
    if (!rtdbSyncPath) return;

    const syncRef = ref(rtdb, rtdbSyncPath);
    const unsubscribe = onValue(
      syncRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val() as DreamHouseLiveSync;
          setLocks(val.locks || {});
          setLiveMoves(val.liveMoves || {});
        } else {
          setLocks({});
          setLiveMoves({});
        }
      },
      (err) => {
        console.warn('[useDreamHouse] RTDB sync onValue error:', err);
      }
    );

    return () => unsubscribe();
  }, [rtdbSyncPath]);

  // 3. Acquire lock on an item
  const acquireLock = useCallback(
    async (instanceId: string): Promise<boolean> => {
      // Local check first
      if (!canUserDragItem(instanceId, locks, myUid)) {
        return false;
      }

      if (!rtdbSyncPath || !myUid) {
        // Unlinked/offline mode: allow locally
        return true;
      }

      try {
        const lockRef = ref(rtdb, `${rtdbSyncPath}/locks/${instanceId}`);
        const lockData: DreamHouseLock = {
          uid: myUid,
          userName: myName,
          acquiredAt: Date.now(),
        };

        // Automatically drop lock if user loses connection
        await onDisconnect(lockRef).remove();
        await set(lockRef, lockData);
        return true;
      } catch (err) {
        console.warn('[useDreamHouse] Error acquiring lock:', err);
        return false;
      }
    },
    [locks, myUid, myName, rtdbSyncPath]
  );

  // 4. Publish live drag coordinate to RTDB (throttled ~80ms)
  const publishLiveMove = useCallback(
    (instanceId: string, qX: number, qY: number) => {
      if (!rtdbSyncPath || !myUid) return;

      const now = Date.now();
      if (now - lastLiveMoveTimeRef.current < 80) return;
      lastLiveMoveTimeRef.current = now;

      const moveRef = ref(rtdb, `${rtdbSyncPath}/liveMoves/${instanceId}`);
      const liveMoveData: DreamHouseLiveMove = {
        qX,
        qY,
        uid: myUid,
      };

      set(moveRef, liveMoveData).catch((err) => {
        console.warn('[useDreamHouse] Error setting live move:', err);
      });
    },
    [rtdbSyncPath, myUid]
  );

  // 5. Release lock and clear live move from RTDB
  const releaseLock = useCallback(
    async (instanceId: string) => {
      if (!rtdbSyncPath) return;

      try {
        const lockRef = ref(rtdb, `${rtdbSyncPath}/locks/${instanceId}`);
        const moveRef = ref(rtdb, `${rtdbSyncPath}/liveMoves/${instanceId}`);
        await remove(moveRef);
        await remove(lockRef);
      } catch (err) {
        console.warn('[useDreamHouse] Error releasing lock:', err);
      }
    },
    [rtdbSyncPath]
  );

  // 6. Commit final item placement to Firestore and release RTDB lock
  const commitItemMove = useCallback(
    async (instanceId: string, qX: number, qY: number) => {
      // Release RTDB ephemeral state
      await releaseLock(instanceId);

      if (!room || !room.items[instanceId]) return;

      const item = room.items[instanceId];
      const template = CATALOG_BY_ID[item.templateId];
      const { width, height } = template
        ? getRotatedDimensions(template, item.rotation)
        : { width: 1, height: 1 };
      const clamped = clampGridCoords(
        qX,
        qY,
        width,
        height,
        room.gridWidth || DEFAULT_GRID_SIZE,
        room.gridHeight || DEFAULT_GRID_SIZE
      );

      const updatedItem: DreamHousePlacedItem = {
        ...item,
        qX: clamped.qX,
        qY: clamped.qY,
        updatedAt: Date.now(),
      };

      // Optimistic local update
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: {
            ...prev.items,
            [instanceId]: updatedItem,
          },
          updatedAt: Date.now(),
          updatedBy: myUid || 'local',
        };
      });

      if (!firestoreDocRef) return;

      try {
        await updateDoc(firestoreDocRef, {
          [`items.${instanceId}.qX`]: clamped.qX,
          [`items.${instanceId}.qY`]: clamped.qY,
          [`items.${instanceId}.updatedAt`]: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: myUid,
        });
      } catch (err) {
        console.warn('[useDreamHouse] Error committing item move to Firestore:', err);
      }
    },
    [room, releaseLock, firestoreDocRef, myUid]
  );

  // 7. Rotate item 90 degrees
  const rotateItem = useCallback(
    async (instanceId: string) => {
      if (!room || !room.items[instanceId]) return;

      const item = room.items[instanceId];
      const nextRotation = (item.rotation + 90) % 360;
      const template = CATALOG_BY_ID[item.templateId];
      const { width, height } = template
        ? getRotatedDimensions(template, nextRotation)
        : { width: 1, height: 1 };
      const clamped = clampGridCoords(
        item.qX,
        item.qY,
        width,
        height,
        room.gridWidth || DEFAULT_GRID_SIZE,
        room.gridHeight || DEFAULT_GRID_SIZE
      );

      // Optimistic update
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: {
            ...prev.items,
            [instanceId]: {
              ...item,
              rotation: nextRotation,
              qX: clamped.qX,
              qY: clamped.qY,
            },
          },
        };
      });

      if (!firestoreDocRef) return;

      try {
        await updateDoc(firestoreDocRef, {
          [`items.${instanceId}.rotation`]: nextRotation,
          [`items.${instanceId}.qX`]: clamped.qX,
          [`items.${instanceId}.qY`]: clamped.qY,
          [`items.${instanceId}.updatedAt`]: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: myUid,
        });
      } catch (err) {
        console.warn('[useDreamHouse] Error rotating item:', err);
      }
    },
    [room, firestoreDocRef, myUid]
  );

  // 8. Add item from catalog
  const addItem = useCallback(
    async (templateId: string) => {
      const template = CATALOG_BY_ID[templateId];
      if (!template || !room) return;

      const now = Date.now();
      const instanceId = `item_${now}_${Math.floor(Math.random() * 1000)}`;
      const { width, height } = template;
      // Place near center of room
      const initialPos = clampGridCoords(
        Math.floor((room.gridWidth - width) / 2),
        Math.floor((room.gridHeight - height) / 2),
        width,
        height,
        room.gridWidth,
        room.gridHeight
      );

      const newItem: DreamHousePlacedItem = {
        instanceId,
        templateId,
        qX: initialPos.qX,
        qY: initialPos.qY,
        rotation: 0,
        placedBy: myUid || 'local',
        updatedAt: now,
      };

      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: {
            ...prev.items,
            [instanceId]: newItem,
          },
        };
      });

      if (!firestoreDocRef) return;

      try {
        await updateDoc(firestoreDocRef, {
          [`items.${instanceId}`]: newItem,
          updatedAt: serverTimestamp(),
          updatedBy: myUid,
        });
      } catch (err) {
        console.warn('[useDreamHouse] Error adding item to Firestore:', err);
      }
    },
    [room, firestoreDocRef, myUid]
  );

  // 9. Delete item
  const deleteItem = useCallback(
    async (instanceId: string) => {
      await releaseLock(instanceId);

      setRoom((prev) => {
        if (!prev) return prev;
        const nextItems = { ...prev.items };
        delete nextItems[instanceId];
        return {
          ...prev,
          items: nextItems,
        };
      });

      if (!firestoreDocRef) return;

      try {
        await updateDoc(firestoreDocRef, {
          [`items.${instanceId}`]: deleteField(),
          updatedAt: serverTimestamp(),
          updatedBy: myUid,
        });
      } catch (err) {
        console.warn('[useDreamHouse] Error deleting item:', err);
      }
    },
    [releaseLock, firestoreDocRef, myUid]
  );

  // 10. Reset room to starter layout
  const resetRoom = useCallback(async () => {
    const freshRoom = createDefaultStarterRoom(myUid || 'local');
    setRoom(freshRoom);

    if (!firestoreDocRef) return;

    try {
      await setDoc(firestoreDocRef, freshRoom);
    } catch (err) {
      console.warn('[useDreamHouse] Error resetting room:', err);
    }
  }, [firestoreDocRef, myUid]);

  const items = room ? Object.values(room.items) : [];

  return {
    room,
    items,
    locks,
    liveMoves,
    loading,
    partnerName,
    isLinked,
    myUid,
    addItem,
    deleteItem,
    rotateItem,
    acquireLock,
    publishLiveMove,
    commitItemMove,
    releaseLock,
    resetRoom,
  };
}
