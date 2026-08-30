import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';

export interface CardReply {
  id: string;
  senderUid: string;
  text: string;
  createdAt: string;
}

export interface CardAnswerEntry {
  cardKey: string;
  deckId: string;
  questionIndex: number;
  questionText: string;
  deckTitle: string;
  category: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  myAnsweredAt?: any;
  partnerAnsweredAt?: any;
  replies: CardReply[];
}

export interface DeckProgressState {
  myCount: number;
  partnerCount: number;
  totalQuestions: number;
  isDeckRevealed: boolean;
  completedByMy: boolean;
  completedByPartner: boolean;
}

export const useDeckAnswers = (
  deckId: string,
  deckTitle: string,
  category: string,
  totalQuestions: number = 25
) => {
  const { coupleId, myUid, partnerUid } = useCouple();
  const [answersMap, setAnswersMap] = useState<Record<number, CardAnswerEntry>>({});
  const [deckProgress, setDeckProgress] = useState<DeckProgressState>({
    myCount: 0,
    partnerCount: 0,
    totalQuestions,
    isDeckRevealed: false,
    completedByMy: false,
    completedByPartner: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Realtime subscription for all card answers in this deck
  useEffect(() => {
    if (!coupleId || !deckId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const answersCol = collection(db, 'couples', coupleId, 'deckAnswers');
    const q = query(answersCol, where('deckId', '==', deckId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMap: Record<number, CardAnswerEntry> = {};
        let myCount = 0;
        let partnerCount = 0;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const qIndex = typeof data.questionIndex === 'number' ? data.questionIndex : -1;
          if (qIndex < 0) return;

          const answers = data.answers || {};
          const myData = myUid ? answers[myUid] : null;
          const partnerData = partnerUid ? answers[partnerUid] : null;

          const myAnswer = myData?.text || null;
          const partnerAnswer = partnerData?.text || null;

          if (myAnswer) myCount++;
          if (partnerAnswer) partnerCount++;

          const rawReplies = Array.isArray(data.replies) ? data.replies : [];
          const replies: CardReply[] = rawReplies.map((r: any) => ({
            id: r.id || `${Date.now()}_${Math.random()}`,
            senderUid: r.senderUid || '',
            text: r.text || '',
            createdAt: r.createdAt || new Date().toISOString(),
          }));

          newMap[qIndex] = {
            cardKey: docSnap.id,
            deckId,
            questionIndex: qIndex,
            questionText: data.questionText || '',
            deckTitle: data.deckTitle || deckTitle,
            category: data.category || category,
            myAnswer,
            partnerAnswer,
            myAnsweredAt: myData?.answeredAt,
            partnerAnsweredAt: partnerData?.answeredAt,
            replies,
          };
        });

        setAnswersMap(newMap);

        // Deck is revealed when both have completed all questions (or at least totalQuestions)
        const completedByMy = myCount >= totalQuestions;
        const completedByPartner = partnerCount >= totalQuestions;
        const isDeckRevealed = Boolean(completedByMy && completedByPartner);

        setDeckProgress({
          myCount,
          partnerCount,
          totalQuestions,
          isDeckRevealed,
          completedByMy,
          completedByPartner,
        });

        setLoading(false);
      },
      (err) => {
        console.warn('[useDeckAnswers] Snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId, deckId, deckTitle, category, myUid, partnerUid, totalQuestions]);

  // Submit answer for a specific question with zero-lag optimistic update
  const submitAnswer = useCallback(
    async (questionIndex: number, questionText: string, text: string) => {
      if (!coupleId || !myUid || !text.trim()) return;

      const trimmedText = text.trim();
      const safeDeckId = deckId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cardKey = `${safeDeckId}_q${questionIndex}`;

      // 1. Instant optimistic update
      setAnswersMap((prev) => {
        const existing = prev[questionIndex];
        const updatedEntry: CardAnswerEntry = {
          cardKey,
          deckId,
          questionIndex,
          questionText,
          deckTitle,
          category,
          myAnswer: trimmedText,
          partnerAnswer: existing?.partnerAnswer || null,
          myAnsweredAt: new Date().toISOString(),
          partnerAnsweredAt: existing?.partnerAnsweredAt,
          replies: existing?.replies || [],
        };
        return { ...prev, [questionIndex]: updatedEntry };
      });

      setDeckProgress((dp) => {
        const currentAnswered = Boolean(answersMap[questionIndex]?.myAnswer);
        const newMyCount = currentAnswered ? dp.myCount : dp.myCount + 1;
        const completedByMy = newMyCount >= totalQuestions;
        const isDeckRevealed = Boolean(completedByMy && dp.completedByPartner);
        return {
          ...dp,
          myCount: newMyCount,
          completedByMy,
          isDeckRevealed,
        };
      });

      setSubmitting(true);
      const docRef = doc(db, 'couples', coupleId, 'deckAnswers', cardKey);

      try {
        await updateDoc(docRef, {
          deckId,
          questionIndex,
          questionText,
          deckTitle,
          category,
          updatedAt: serverTimestamp(),
          [`answers.${myUid}`]: {
            text: trimmedText,
            answeredAt: new Date().toISOString(),
          },
        });
      } catch (err: any) {
        // If document does not exist yet in Firestore, create it with initial answer map
        if (
          err?.code === 'not-found' ||
          err?.message?.includes('No document to update') ||
          err?.code === 'failed-precondition'
        ) {
          try {
            await setDoc(
              docRef,
              {
                deckId,
                questionIndex,
                questionText,
                deckTitle,
                category,
                updatedAt: serverTimestamp(),
                answers: {
                  [myUid]: {
                    text: trimmedText,
                    answeredAt: new Date().toISOString(),
                  },
                },
              },
              { merge: true }
            );
          } catch (createErr) {
            console.error('[useDeckAnswers] Create initial answer error:', createErr);
            throw createErr;
          }
        } else {
          console.error('[useDeckAnswers] Submit answer error:', err);
          throw err;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [coupleId, myUid, deckId, deckTitle, category, totalQuestions, answersMap]
  );

  // Add a reply / comment to an answer
  const addReply = useCallback(
    async (questionIndex: number, replyText: string) => {
      if (!coupleId || !myUid || !replyText.trim()) return;

      setSendingReply(true);
      const safeDeckId = deckId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cardKey = `${safeDeckId}_q${questionIndex}`;
      const docRef = doc(db, 'couples', coupleId, 'deckAnswers', cardKey);

      const newReply: CardReply = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        senderUid: myUid,
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(
          docRef,
          {
            deckId,
            questionIndex,
            replies: arrayUnion(newReply),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[useDeckAnswers] Add reply error:', err);
        throw err;
      } finally {
        setSendingReply(false);
      }
    },
    [coupleId, myUid, deckId]
  );

  return {
    answersMap,
    deckProgress,
    loading,
    submitting,
    sendingReply,
    submitAnswer,
    addReply,
  };
};
