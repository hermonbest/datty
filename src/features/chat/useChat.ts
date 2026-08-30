import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';
import { ChatMessage, ChatReplyReference } from '../../types';

export const useChat = () => {
  const { coupleId, myUid } = useCouple();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realtime subscription
  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesCol = collection(db, 'couples', coupleId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ChatMessage[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            senderUid: data.senderUid,
            text: data.text || null,
            imageURL: data.imageURL || null,
            audioURL: data.audioURL || null,
            audioDuration: typeof data.audioDuration === 'number' ? data.audioDuration : null,
            createdAt: data.createdAt,
            replyTo: data.replyTo || null,
            reaction: data.reaction || null,
            pending: false,
          };
        });

        // Merge with pending optimistic messages not yet in snapshot
        setMessages((current) => {
          const pending = current.filter((m) => m.pending && !items.some((real) => real.id === m.id));
          return [...pending, ...items];
        });
        setLoading(false);
      },
      (err) => {
        console.warn('[useChat] Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId]);

  // Upload chat image helper
  const uploadChatImage = useCallback(
    async (uri: string): Promise<string> => {
      if (!coupleId) throw new Error('Couple not found');
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
      const storageRef = ref(storage, `couples/${coupleId}/chat/${filename}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    },
    [coupleId]
  );

  // Upload chat voice note helper (.m4a audio)
  const uploadChatAudio = useCallback(
    async (uri: string): Promise<string> => {
      if (!coupleId) throw new Error('Couple not found');
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.m4a`;
      const storageRef = ref(storage, `couples/${coupleId}/chat/${filename}`);

      await uploadBytes(storageRef, blob, { contentType: 'audio/mp4' });
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    },
    [coupleId]
  );

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (
      text?: string,
      imageUri?: string,
      replyTo?: ChatReplyReference | null,
      audio?: { uri: string; duration: number }
    ) => {
      if (!coupleId || !myUid) return;
      if (!text?.trim() && !imageUri && !audio) return;

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        senderUid: myUid,
        text: text?.trim() || null,
        imageURL: imageUri || null,
        audioURL: audio?.uri || null,
        audioDuration: audio?.duration || null,
        createdAt: new Date(),
        replyTo: replyTo || null,
        reaction: null,
        pending: true,
      };

      // 1. Optimistically add to messages
      setMessages((prev) => [optimisticMsg, ...prev]);
      setSending(true);

      try {
        let finalImageURL: string | null = null;
        if (imageUri) {
          finalImageURL = await uploadChatImage(imageUri);
        }

        let finalAudioURL: string | null = null;
        if (audio) {
          finalAudioURL = await uploadChatAudio(audio.uri);
        }

        const messagesCol = collection(db, 'couples', coupleId, 'messages');
        const docPayload: any = {
          senderUid: myUid,
          text: text?.trim() || null,
          imageURL: finalImageURL,
          audioURL: finalAudioURL,
          audioDuration: audio?.duration || null,
          createdAt: serverTimestamp(),
        };

        if (replyTo) {
          docPayload.replyTo = replyTo;
        }

        await addDoc(messagesCol, docPayload);

        // Remove temp optimistic message once real one arrives
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err: any) {
        console.error('[useChat] Send message error:', err);
        // Rollback optimistic message into error state
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
        );
        setError('Failed to send message.');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [coupleId, myUid, uploadChatImage, uploadChatAudio]
  );

  // Toggle reaction on a message (Instagram double-tap heart)
  const toggleReaction = useCallback(
    async (messageId: string, currentReaction?: string | null) => {
      if (!coupleId || !messageId || messageId.startsWith('temp_')) return;

      const newReaction = currentReaction === '❤️' ? null : '❤️';

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction: newReaction } : m))
      );

      try {
        const msgDocRef = doc(db, 'couples', coupleId, 'messages', messageId);
        await updateDoc(msgDocRef, {
          reaction: newReaction,
        });
      } catch (err) {
        console.error('[useChat] Reaction error:', err);
      }
    },
    [coupleId]
  );

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    toggleReaction,
  };
};
