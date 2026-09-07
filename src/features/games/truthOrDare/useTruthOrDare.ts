import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { TruthOrDareCategory, PromptType, TruthOrDareItem } from '../../../types/games';
import { getRandomPrompt } from './truthOrDareData';
import { gameLog, startGameTimer, measureGameAsync } from '../gameLogger';

export type TruthOrDarePhase = 'choose_card' | 'prompt_revealed';
export type GameMode = 'couple' | 'pass_and_play';

export interface TruthOrDareFirestoreDoc {
  category: TruthOrDareCategory;
  activeUid: string;
  activePlayerName: string;
  phase: TruthOrDarePhase;
  selectedPrompt: TruthOrDareItem | null;
  completedCount: number;
  answer?: string;
  updatedAt?: any;
}

export interface UseTruthOrDareReturn {
  category: TruthOrDareCategory;
  setCategory: (cat: TruthOrDareCategory) => void;
  selectedPrompt: TruthOrDareItem | null;
  activePlayerName: string;
  isMyTurn: boolean;
  canPickCard: boolean;
  phase: TruthOrDarePhase;
  completedCount: number;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isLinked: boolean;
  userName: string;
  partnerName: string;
  currentAnswer: string;
  pickPrompt: (type: PromptType) => void;
  rerollPrompt: () => void;
  submitAnswer: (text: string) => void;
  completeChallenge: () => void;
  resetGame: () => void;
}

export function useTruthOrDare(): UseTruthOrDareReturn {
  const { coupleId, myUid, userProfile, partnerProfile, isLinked } = useCouple();
  const userName = userProfile?.displayName || 'You';
  const partnerName = partnerProfile?.displayName || 'Partner';
  const partnerUid = partnerProfile?.uid || 'partner_uid';

  const [gameMode, setGameMode] = useState<GameMode>(isLinked ? 'couple' : 'pass_and_play');
  const [category, setCategoryState] = useState<TruthOrDareCategory>('romantic');
  const [selectedPrompt, setSelectedPrompt] = useState<TruthOrDareItem | null>(null);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [activeUid, setActiveUid] = useState<string>(myUid || 'me');
  const [activePlayerName, setActivePlayerName] = useState<string>(userName);
  const [phase, setPhase] = useState<TruthOrDarePhase>('choose_card');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const isMyTurn = gameMode === 'pass_and_play' ? true : activeUid === myUid;
  const canPickCard = phase === 'choose_card' && isMyTurn;

  useEffect(() => {
    if (!isLinked || !coupleId || gameMode !== 'couple') return;

    const timer = startGameTimer('TruthOrDare', 'SubscribeRemoteGame', { coupleId });
    const gameDocRef = doc(db, 'couples', coupleId, 'games', 'truth_or_dare');

    const unsubscribe = onSnapshot(
      gameDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TruthOrDareFirestoreDoc;
          setCategoryState(data.category || 'romantic');
          setActiveUid(data.activeUid || myUid || 'me');
          setActivePlayerName(data.activeUid === myUid ? userName : partnerName);
          // Legacy phase migration to choose_card if snapshot has old spin phases
          const normalizedPhase: TruthOrDarePhase =
            data.phase === 'prompt_revealed' ? 'prompt_revealed' : 'choose_card';
          setPhase(normalizedPhase);
          setSelectedPrompt(data.selectedPrompt || null);
          setCompletedCount(data.completedCount || 0);
          setCurrentAnswer(data.answer || '');
        } else {
          const initialData: TruthOrDareFirestoreDoc = {
            category: 'romantic',
            activeUid: myUid || 'me',
            activePlayerName: userName,
            phase: 'choose_card',
            selectedPrompt: null,
            completedCount: 0,
            updatedAt: serverTimestamp(),
          };
          setDoc(gameDocRef, initialData).catch((err) => {
            console.warn('[useTruthOrDare] Init game doc error:', err);
          });
        }
        timer.stop({ success: true });
      },
      (err) => {
        console.warn('[useTruthOrDare] Remote sync unavailable:', err?.message);
        setGameMode('pass_and_play');
      }
    );

    return () => unsubscribe();
  }, [coupleId, isLinked, gameMode, myUid, userName, partnerName]);

  const updateRemote = useCallback(
    async (payload: Partial<TruthOrDareFirestoreDoc>, actionName: string = 'UpdateRemote') => {
      if (gameMode !== 'couple' || !coupleId) return;
      await measureGameAsync('TruthOrDare', actionName, async () => {
        const gameDocRef = doc(db, 'couples', coupleId, 'games', 'truth_or_dare');
        await setDoc(gameDocRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      }, payload);
    },
    [gameMode, coupleId]
  );

  const setCategory = useCallback(
    (cat: TruthOrDareCategory) => {
      setCategoryState(cat);
      if (phase === 'prompt_revealed') {
        setPhase('choose_card');
        setSelectedPrompt(null);
      }
      updateRemote({ category: cat }, 'SyncCategoryChange');
    },
    [phase, updateRemote]
  );

  const pickPrompt = useCallback(
    (type: PromptType) => {
      if (phase !== 'choose_card' || (gameMode === 'couple' && !isMyTurn)) return;

      const prompt = getRandomPrompt(category, type, usedIds);
      setUsedIds((prev) => [...prev, prompt.id]);
      setSelectedPrompt(prompt);
      setPhase('prompt_revealed');
      setCurrentAnswer('');

      updateRemote(
        {
          selectedPrompt: prompt,
          phase: 'prompt_revealed',
          answer: '',
        },
        'SyncPickPrompt'
      );
    },
    [phase, gameMode, isMyTurn, category, usedIds, updateRemote]
  );

  const rerollPrompt = useCallback(() => {
    if (!selectedPrompt || phase !== 'prompt_revealed') return;
    if (gameMode === 'couple' && !isMyTurn) return;

    const nextPrompt = getRandomPrompt(category, selectedPrompt.type, [...usedIds, selectedPrompt.id]);
    setUsedIds((prev) => [...prev, nextPrompt.id]);
    setSelectedPrompt(nextPrompt);
    setCurrentAnswer('');

    updateRemote(
      {
        selectedPrompt: nextPrompt,
        answer: '',
      },
      'SyncRerollPrompt'
    );
  }, [selectedPrompt, phase, gameMode, isMyTurn, category, usedIds, updateRemote]);

  const completeChallenge = useCallback(() => {
    if (gameMode === 'couple' && !isMyTurn) return;

    const nextCount = completedCount + 1;
    const nextUid = activeUid === myUid ? (partnerUid || 'partner') : (myUid || 'me');
    const nextName = activeUid === myUid ? partnerName : userName;

    setCompletedCount(nextCount);
    setSelectedPrompt(null);
    setPhase('choose_card');
    setCurrentAnswer('');
    setActiveUid(nextUid);
    setActivePlayerName(nextName);

    updateRemote(
      {
        completedCount: nextCount,
        selectedPrompt: null,
        phase: 'choose_card',
        activeUid: nextUid,
        activePlayerName: nextName,
        answer: '',
      },
      'SyncCompleteChallenge'
    );
  }, [completedCount, activeUid, myUid, partnerUid, partnerName, userName, gameMode, isMyTurn, updateRemote]);

  const resetGame = useCallback(() => {
    setCompletedCount(0);
    setSelectedPrompt(null);
    setPhase('choose_card');
    setUsedIds([]);
    setCurrentAnswer('');
    updateRemote(
      {
        completedCount: 0,
        selectedPrompt: null,
        phase: 'choose_card',
        answer: '',
      },
      'SyncResetGame'
    );
  }, [updateRemote]);

  const submitAnswer = useCallback(
    (text: string) => {
      setCurrentAnswer(text);
      updateRemote({ answer: text }, 'SyncTruthAnswer');
    },
    [updateRemote]
  );

  return {
    category,
    setCategory,
    selectedPrompt,
    activePlayerName,
    isMyTurn,
    canPickCard,
    phase,
    completedCount,
    gameMode,
    setGameMode,
    isLinked,
    userName,
    partnerName,
    currentAnswer,
    pickPrompt,
    rerollPrompt,
    submitAnswer,
    completeChallenge,
    resetGame,
  };
}
