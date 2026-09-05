import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';
import { CoupleEvent } from '../../types';
import { sortEventsByNextOccurrence } from './eventUtils';
import { cache, CacheKeys } from '../../services/cache';

export const useEvents = () => {
  const { coupleId } = useCouple();
  const [events, setEvents] = useState<CoupleEvent[]>(() => {
    return coupleId ? cache.getMemory<CoupleEvent[]>(CacheKeys.events(coupleId)) || [] : [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!coupleId) return false;
    return cache.getMemory(CacheKeys.events(coupleId)) === null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    if (events.length === 0) {
      cache.get<CoupleEvent[]>(CacheKeys.events(coupleId)).then((cached) => {
        if (cached && cached.length > 0) {
          setEvents(cached);
          setLoading(false);
        }
      });
    }

    const eventsCol = collection(db, 'couples', coupleId, 'events');

    const unsubscribe = onSnapshot(
      eventsCol,
      (snapshot) => {
        const items: CoupleEvent[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title,
            date: data.date,
            recurringYearly: Boolean(data.recurringYearly),
            notes: data.notes || null,
            createdAt: data.createdAt,
          };
        });

        const sorted = sortEventsByNextOccurrence(items);
        setEvents(sorted);
        cache.set(CacheKeys.events(coupleId), sorted);
        setLoading(false);
      },
      (err) => {
        console.warn('[useEvents] Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId]);

  const addEvent = useCallback(
    async (eventData: {
      title: string;
      date: string;
      recurringYearly: boolean;
      notes?: string;
    }) => {
      if (!coupleId) throw new Error('Couple not found');

      const eventsCol = collection(db, 'couples', coupleId, 'events');
      await addDoc(eventsCol, {
        title: eventData.title.trim(),
        date: eventData.date.trim(),
        recurringYearly: eventData.recurringYearly,
        notes: eventData.notes?.trim() || null,
        createdAt: serverTimestamp(),
      });
    },
    [coupleId]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!coupleId) return;
      const eventRef = doc(db, 'couples', coupleId, 'events', eventId);
      await deleteDoc(eventRef);
    },
    [coupleId]
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      updates: Partial<{
        title: string;
        date: string;
        recurringYearly: boolean;
        notes: string | null;
      }>
    ) => {
      if (!coupleId) return;
      const eventRef = doc(db, 'couples', coupleId, 'events', eventId);
      await updateDoc(eventRef, updates);
    },
    [coupleId]
  );

  return {
    events,
    loading,
    error,
    addEvent,
    deleteEvent,
    updateEvent,
  };
};
