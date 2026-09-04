import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';
import { dispatchCoupleNotification } from '../../services/notificationService';
import { CoupleNote, PartnerNote } from '../../types';
import {
  filterCoupleNotesByType,
  sortGratitudeNotes,
  sortCoupleListItems,
  sortPartnerNotes,
  ListFilter,
} from './notesLogic';

export const useNotes = () => {
  const { coupleId, user, userProfile, partnerUid, partnerProfile } = useCouple();
  const [coupleNotes, setCoupleNotes] = useState<CoupleNote[]>([]);
  const [partnerNotes, setPartnerNotes] = useState<PartnerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Listen to shared couple notes (/couples/{coupleId}/notes)
  useEffect(() => {
    if (!coupleId) {
      setCoupleNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notesCol = collection(db, 'couples', coupleId, 'notes');

    const unsubscribe = onSnapshot(
      notesCol,
      (snapshot) => {
        const items: CoupleNote[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            type: data.type || 'gratitude',
            content: data.content || '',
            completed: Boolean(data.completed),
            authorUid: data.authorUid || '',
            authorName: data.authorName || 'Partner',
            createdAt: data.createdAt,
          };
        });
        setCoupleNotes(items);
        setLoading(false);
      },
      (err) => {
        console.warn('[useNotes] Couple notes snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId]);

  // 2. Listen to private partner notes (/users/{uid}/partnerNotes) - STRICTLY user isolated
  useEffect(() => {
    if (!user?.uid) {
      setPartnerNotes([]);
      return;
    }

    const partnerNotesCol = collection(db, 'users', user.uid, 'partnerNotes');

    const unsubscribe = onSnapshot(
      partnerNotesCol,
      (snapshot) => {
        const items: PartnerNote[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'General',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setPartnerNotes(items);
      },
      (err) => {
        console.warn('[useNotes] Partner notes snapshot error:', err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Derived filtered & sorted lists
  const gratitudeNotes = useMemo(() => {
    const raw = filterCoupleNotesByType(coupleNotes, 'gratitude');
    return sortGratitudeNotes(raw);
  }, [coupleNotes]);

  const allListItems = useMemo(() => {
    return filterCoupleNotesByType(coupleNotes, 'list');
  }, [coupleNotes]);

  // Actions for Shared Couple Notes
  const addGratitude = useCallback(
    async (content: string) => {
      if (!coupleId || !user) throw new Error('Not authenticated');
      const text = content.trim();
      if (!text) return;

      const notesCol = collection(db, 'couples', coupleId, 'notes');
      await addDoc(notesCol, {
        type: 'gratitude',
        content: text,
        authorUid: user.uid,
        authorName: userProfile?.displayName || 'Partner',
        createdAt: serverTimestamp(),
      });

      if (partnerUid) {
        dispatchCoupleNotification({
          coupleId,
          senderUid: user.uid,
          recipientUid: partnerUid,
          recipientPushToken: partnerProfile?.expoPushToken,
          type: 'note_gratitude',
          partnerName: userProfile?.displayName || 'Partner',
          preview: text.length > 50 ? text.slice(0, 47) + '...' : text,
          data: { route: 'NotesTab', tab: 'gratitude' },
          preferences: partnerProfile?.notificationPreferences,
        }).catch(() => {});
      }
    },
    [coupleId, user, userProfile, partnerUid, partnerProfile]
  );

  const addListItem = useCallback(
    async (content: string) => {
      if (!coupleId || !user) throw new Error('Not authenticated');
      const text = content.trim();
      if (!text) return;

      const notesCol = collection(db, 'couples', coupleId, 'notes');
      await addDoc(notesCol, {
        type: 'list',
        content: text,
        completed: false,
        authorUid: user.uid,
        authorName: userProfile?.displayName || 'Partner',
        createdAt: serverTimestamp(),
      });

      if (partnerUid) {
        dispatchCoupleNotification({
          coupleId,
          senderUid: user.uid,
          recipientUid: partnerUid,
          recipientPushToken: partnerProfile?.expoPushToken,
          type: 'note_list_item',
          partnerName: userProfile?.displayName || 'Partner',
          preview: `Added "${text.length > 40 ? text.slice(0, 37) + '...' : text}"`,
          data: { route: 'NotesTab', tab: 'list' },
          preferences: partnerProfile?.notificationPreferences,
        }).catch(() => {});
      }
    },
    [coupleId, user, userProfile, partnerUid, partnerProfile]
  );

  const toggleListItem = useCallback(
    async (noteId: string, currentCompleted?: boolean) => {
      if (!coupleId) return;
      const noteRef = doc(db, 'couples', coupleId, 'notes', noteId);
      await updateDoc(noteRef, {
        completed: !currentCompleted,
        updatedAt: serverTimestamp(),
      });
    },
    [coupleId]
  );

  const deleteCoupleNote = useCallback(
    async (noteId: string) => {
      if (!coupleId) return;
      const noteRef = doc(db, 'couples', coupleId, 'notes', noteId);
      await deleteDoc(noteRef);
    },
    [coupleId]
  );

  // Actions for Private Partner Notes
  const addPartnerNote = useCallback(
    async (noteData: { title: string; content: string; category?: string }) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const title = noteData.title.trim();
      const content = noteData.content.trim();
      if (!title || !content) return;

      const partnerNotesCol = collection(db, 'users', user.uid, 'partnerNotes');
      await addDoc(partnerNotesCol, {
        title,
        content,
        category: noteData.category || 'General',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [user?.uid]
  );

  const updatePartnerNote = useCallback(
    async (
      noteId: string,
      updates: Partial<{ title: string; content: string; category: string }>
    ) => {
      if (!user?.uid) return;
      const noteRef = doc(db, 'users', user.uid, 'partnerNotes', noteId);
      const cleanUpdates: any = { updatedAt: serverTimestamp() };
      if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
      if (updates.content !== undefined) cleanUpdates.content = updates.content.trim();
      if (updates.category !== undefined) cleanUpdates.category = updates.category;

      await updateDoc(noteRef, cleanUpdates);
    },
    [user?.uid]
  );

  const deletePartnerNote = useCallback(
    async (noteId: string) => {
      if (!user?.uid) return;
      const noteRef = doc(db, 'users', user.uid, 'partnerNotes', noteId);
      await deleteDoc(noteRef);
    },
    [user?.uid]
  );

  return {
    gratitudeNotes,
    allListItems,
    partnerNotes,
    loading,
    error,
    addGratitude,
    addListItem,
    toggleListItem,
    deleteCoupleNote,
    addPartnerNote,
    updatePartnerNote,
    deletePartnerNote,
    currentUid: user?.uid,
  };
};
