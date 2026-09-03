import { useState, useEffect, useCallback } from 'react';
import {
  ref as dbRef,
  push,
  update,
  set,
  onValue,
  query,
  orderByKey,
  limitToLast,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from '../../services/firebase';
import { uploadFileToCloudinary, getFileSizeBytes } from '../../services/fileToBytes';
import { useCouple } from '../../services/coupleContext';
import { ChatMessage, ChatReplyReference, MediaState } from '../../types';


// Keep the last N messages live; older ones can be lazily loaded later if needed.
const MESSAGE_LIMIT = 150;
// Storage rules cap uploads at 15MB — enforce it after compression as a safety net.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// createdAt can be an RTDB ms timestamp, a migrated Firestore Timestamp, or a Date.
const toMillis = (t: any): number => {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t instanceof Date) return t.getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  return 0;
};

// Non-blocking media sends: the message node is pushed to RTDB first, uploads
// run in the background via expo-file-system (no fetch+blob — see fileToBytes),
// then the node is patched with the storage URL.
export const useChat = () => {
  const { coupleId, myUid } = useCouple();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatPath = coupleId ? `couples/${coupleId}/chat` : null;

  // Realtime subscription (RTDB push IDs are chronological, so orderByKey
  // gives us the newest messages; we still sort by createdAt for migrated docs).
  useEffect(() => {
    if (!coupleId || !chatPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const chatRef = dbRef(rtdb, chatPath);
    const q = query(chatRef, orderByKey(), limitToLast(MESSAGE_LIMIT));

    const unsubscribe = onValue(
      q,
      (snapshot) => {
        const items: ChatMessage[] = [];
        snapshot.forEach((child) => {
          const data = child.val() || {};
          items.push({
            id: child.key as string,
            senderUid: data.senderUid,
            text: data.text || null,
            imageURL: data.imageURL || null,
            audioURL: data.audioURL || null,
            audioDuration: typeof data.audioDuration === 'number' ? data.audioDuration : null,
            createdAt: data.createdAt,
            replyTo: data.replyTo || null,
            reaction: data.reaction || null,
            mediaState: (data.mediaState as MediaState) || 'ready',
            pending: false,
          });
        });
        // Newest first
        items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        // Merge with pending optimistic messages not yet in snapshot
        setMessages((current) => {
          const pending = current.filter((m) => m.pending && !items.some((real) => real.id === m.id));
          return [...pending, ...items];
        });
        setLoading(false);
      },
      (err) => {
        console.warn('[useChat] RTDB snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId, chatPath]);

  // Upload chat image — Cloudinary unsigned upload (free, no Firebase Storage needed).
  const uploadChatImage = useCallback(
    async (uri: string): Promise<string> => {
      if (!coupleId) throw new Error('Couple not found');
      const size = await getFileSizeBytes(uri);
      if (size !== null && size > MAX_UPLOAD_BYTES) {
        throw new Error('Photo is too large to send (max 15MB).');
      }
      console.log('[useChat] Uploading image to Cloudinary');
      return uploadFileToCloudinary(uri, 'image', `datty/${coupleId}/chat`);
    },
    [coupleId]
  );

  // Upload chat voice note directly to Cloudinary as raw storage
  const uploadChatAudio = useCallback(
    async (uri: string): Promise<string> => {
      if (!coupleId) throw new Error('Couple not found');
      console.log('[useChat] Uploading voice note to Cloudinary as raw');
      return uploadFileToCloudinary(uri, 'raw', `datty/${coupleId}/chat`);
    },
    [coupleId]
  );



  // Send message: RTDB push gives instant local echo; media uploads run in the
  // background and patch the message node with the URL afterwards.
  const sendMessage = useCallback(
    async (
      text?: string,
      imageUri?: string,
      replyTo?: ChatReplyReference | null,
      audio?: { uri: string; duration: number }
    ) => {
      if (!coupleId || !myUid || !chatPath) return;
      if (!text?.trim() && !imageUri && !audio) return;

      const newMsgRef = push(dbRef(rtdb, chatPath));
      const messageId = newMsgRef.key as string;

      const hasMedia = Boolean(imageUri || audio);
      const optimisticMsg: ChatMessage = {
        id: messageId,
        senderUid: myUid,
        text: text?.trim() || null,
        imageURL: null,
        audioURL: null,
        audioDuration: audio?.duration || null,
        createdAt: new Date(),
        replyTo: replyTo || null,
        reaction: null,
        mediaState: hasMedia ? 'uploading' : 'ready',
        pending: true,
      };

      // 1. Optimistically add to messages
      setMessages((prev) => [optimisticMsg, ...prev]);
      setSending(true);

      const payload: any = {
        senderUid: myUid,
        text: text?.trim() || null,
        imageURL: null,
        audioURL: null,
        audioDuration: audio?.duration || null,
        mediaState: hasMedia ? 'uploading' : 'ready',
        createdAt: serverTimestamp(),
      };
      if (replyTo) {
        payload.replyTo = replyTo;
      }

      let uploadedAudioURL: string | null = null;
      try {
        // 2. Push to RTDB — local echo means our own list updates instantly,
        //    and the listener keeps the partner in sync.
        await set(newMsgRef, payload);

        // Remove temp optimistic message once real one arrives (cleanup just in case)
        setMessages((prev) => prev.filter((m) => m.id !== messageId || !m.pending));

        // 3. Upload media in the background, then patch the node with the URL.
        if (imageUri || audio) {
          try {
            if (imageUri) {
              const finalImageURL = await uploadChatImage(imageUri);
              await update(newMsgRef, { imageURL: finalImageURL, mediaState: 'ready' });
              setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, imageURL: finalImageURL, mediaState: 'ready' } : m))
              );
            } else if (audio) {
              const finalAudioURL = await uploadChatAudio(audio.uri);
              uploadedAudioURL = finalAudioURL;
              await update(newMsgRef, { audioURL: finalAudioURL, mediaState: 'ready' });
              setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, audioURL: finalAudioURL, mediaState: 'ready' } : m))
              );
            }
          } catch (mediaErr) {
            console.error('[useChat] Media upload error:', mediaErr);
            await update(newMsgRef, { mediaState: 'failed' }).catch(() => {});
          }
        }
      } catch (err: any) {
        console.error('[useChat] Send message error:', err);
        // Rollback optimistic message into error state
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, pending: false, error: true } : m))
        );
        setError('Failed to send message.');
        throw err;
      } finally {
        setSending(false);
      }

      return uploadedAudioURL;
    },
    [coupleId, myUid, chatPath, uploadChatImage, uploadChatAudio]
  );

  // Toggle reaction on a message (Instagram double-tap heart)
  const toggleReaction = useCallback(
    async (messageId: string, currentReaction?: string | null) => {
      if (!coupleId || !chatPath || !messageId || messageId.startsWith('temp_')) return;

      const newReaction = currentReaction === '❤️' ? null : '❤️';

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction: newReaction } : m))
      );

      try {
        // Setting null removes the key in RTDB; read side maps undefined → null.
        await update(dbRef(rtdb, `${chatPath}/${messageId}`), { reaction: newReaction });
      } catch (err) {
        console.error('[useChat] Reaction error:', err);
      }
    },
    [coupleId, chatPath]
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
