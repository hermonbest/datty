import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';
import { Question, DailyAnswer } from '../../types';
import { getDateId, getQuestionIndexForDate } from './pickTodaysQuestion';
import { dispatchCoupleNotification } from '../../services/notificationService';

// In-memory module cache for daily questions across tab switches
let cachedTotalQuestions: number | null = null;
const cachedQuestionsByDate: Record<string, Question> = {};

export const useDailyQuestion = (targetDate: Date = new Date()) => {
  const { coupleId, myUid, partnerUid, couple, userProfile, partnerProfile } = useCouple();
  const coupleTimezone = couple?.timezone;
  const dateId = getDateId(targetDate, coupleTimezone);

  const [question, setQuestion] = useState<Question | null>(() => cachedQuestionsByDate[dateId] || null);
  const [myAnswer, setMyAnswer] = useState<DailyAnswer | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<DailyAnswer | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(() => !cachedQuestionsByDate[dateId]);
  const [loadingAnswers, setLoadingAnswers] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // 1. Fetch total question count and today's deterministic question (with memory cache)
  useEffect(() => {
    let isMounted = true;

    if (cachedQuestionsByDate[dateId]) {
      setQuestion(cachedQuestionsByDate[dateId]);
      setLoadingQuestion(false);
      return;
    }

    const fetchQuestion = async () => {
      setLoadingQuestion(true);
      try {
        const questionsCol = collection(db, 'questions');
        let total = cachedTotalQuestions;

        if (total === null) {
          try {
            const countSnap = await getCountFromServer(questionsCol);
            total = countSnap.data().count;
            if (total > 0) {
              cachedTotalQuestions = total;
            }
          } catch {
            const countSnap = await getDocs(questionsCol);
            total = countSnap.size;
            if (total > 0) {
              cachedTotalQuestions = total;
            }
          }
        }

        if (!total || total === 0) {
          // Fallback question if DB isn't seeded yet (do not permanently cache count=0)
          const fallbackQ: Question = {
            id: 'sample-1',
            text: "What's something you have been looking forward to sharing with me?",
            category: 'Daily Check-in',
            order: 0,
          };
          cachedQuestionsByDate[dateId] = fallbackQ;
          if (isMounted) {
            setQuestion(fallbackQ);
            setLoadingQuestion(false);
          }
          return;
        }

        const todayIndex = getQuestionIndexForDate(targetDate, total, coupleTimezone);
        const qQuery = query(questionsCol, where('order', '==', todayIndex));
        const qSnap = await getDocs(qQuery);

        if (!qSnap.empty && isMounted) {
          const docData = qSnap.docs[0].data();
          const loadedQ: Question = {
            id: qSnap.docs[0].id,
            text: docData.text,
            category: docData.category || 'General',
            deck: docData.deck || undefined,
            subtitle: docData.subtitle || undefined,
            order: docData.order,
          };
          cachedQuestionsByDate[dateId] = loadedQ;
          setQuestion(loadedQ);
        } else if (isMounted) {
          // Fallback question
          const fallbackQ: Question = {
            id: 'fallback-1',
            text: "What is your favorite memory of us from this past month?",
            category: 'Memories',
            deck: 'Daily Delight',
            subtitle: 'Gratitude and vulnerability.',
            order: 0,
          };
          cachedQuestionsByDate[dateId] = fallbackQ;
          setQuestion(fallbackQ);
        }
      } catch (err: any) {
        console.warn('[useDailyQuestion] Error fetching question:', err);
        if (isMounted) {
          const fallbackQ: Question = {
            id: 'fallback',
            text: "What is your favorite memory of us from this past month?",
            category: 'Memories',
            deck: 'Daily Delight',
            subtitle: 'Gratitude and vulnerability.',
            order: 0,
          };
          setQuestion(fallbackQ);
        }
      } finally {
        if (isMounted) setLoadingQuestion(false);
      }
    };

    fetchQuestion();
    return () => {
      isMounted = false;
    };
  }, [dateId, coupleTimezone]);

  // 2. Realtime listener for my answer and partner's answer
  useEffect(() => {
    if (!coupleId || !myUid) {
      setLoadingAnswers(false);
      return;
    }

    setLoadingAnswers(true);

    // Listen to my answer
    const myAnswerRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateId, 'answers', myUid);
    const unsubMy = onSnapshot(
      myAnswerRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setMyAnswer({
            uid: myUid,
            text: data.text,
            answeredAt: data.answeredAt,
          });
        } else {
          if (!isSubmittingRef.current) {
            setMyAnswer(null);
          }
        }
        setLoadingAnswers(false);
      },
      (err) => {
        console.warn('[useDailyQuestion] My answer error:', err);
        setLoadingAnswers(false);
      }
    );

    // Listen to partner's answer (if partnerUid is known)
    let unsubPartner: (() => void) | null = null;
    if (partnerUid) {
      const partnerAnswerRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateId, 'answers', partnerUid);
      unsubPartner = onSnapshot(
        partnerAnswerRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPartnerAnswer({
              uid: partnerUid,
              text: data.text,
              answeredAt: data.answeredAt,
            });
          } else {
            setPartnerAnswer(null);
          }
        },
        (_err) => {
          // Expected behavior per security rules: will error / return nothing until my answer is submitted
          setPartnerAnswer(null);
        }
      );
    }

    return () => {
      unsubMy();
      if (unsubPartner) unsubPartner();
    };
  }, [coupleId, myUid, partnerUid, dateId]);

  // 3. Submit answer with immediate zero-lag optimistic state update
  const submitAnswer = useCallback(
    async (answerText: string) => {
      if (!coupleId || !myUid || !answerText.trim()) return;

      const trimmed = answerText.trim();
      const previousAnswer = myAnswer;

      // 1. Instant optimistic update
      isSubmittingRef.current = true;
      setMyAnswer({
        uid: myUid,
        text: trimmed,
        answeredAt: new Date(),
      });
      setSubmitting(true);
      setError(null);

      try {
        const parentDocRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateId);
        const myAnswerRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateId, 'answers', myUid);

        await Promise.all([
          setDoc(
            parentDocRef,
            {
              dateId,
              questionText: question?.text || 'Daily Question',
              category: question?.category || 'General',
              deck: question?.deck || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          setDoc(myAnswerRef, {
            text: trimmed,
            answeredAt: serverTimestamp(),
          }),
        ]);

        if (partnerUid) {
          const notifType = partnerAnswer ? 'daily_revealed' : 'daily_answered';
          dispatchCoupleNotification({
            coupleId,
            senderUid: myUid,
            recipientUid: partnerUid,
            recipientPushToken: partnerProfile?.expoPushToken,
            type: notifType,
            partnerName: userProfile?.displayName || 'Partner',
            data: { route: 'TodayTab', dateId },
            preferences: partnerProfile?.notificationPreferences,
          }).catch(() => {});
        }
      } catch (err: any) {
        console.error('[useDailyQuestion] Submit error:', err);
        // Rollback optimistic state
        setMyAnswer(previousAnswer);
        setError('Failed to submit answer. Please try again.');
        throw err;
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [coupleId, myUid, dateId, myAnswer, question]
  );

  const isRevealed = Boolean(myAnswer && partnerAnswer);
  const isWaitingForPartner = Boolean(myAnswer && !partnerAnswer);
  const isUnanswered = Boolean(!myAnswer);

  return {
    dateId,
    question,
    myAnswer,
    partnerAnswer,
    isRevealed,
    isWaitingForPartner,
    isUnanswered,
    loading: loadingQuestion || loadingAnswers,
    submitting,
    error,
    submitAnswer,
  };
};
