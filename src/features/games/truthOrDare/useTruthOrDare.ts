import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { TruthOrDareCategory, PromptType, TruthOrDareItem } from '../../../types/games';
import { getRandomPrompt } from './truthOrDareData';
import { gameLog, startGameTimer, measureGameAsync } from '../gameLogger';

export type TruthOrDarePhase = 'need_spin' | 'spinning' | 'choose_card' | 'prompt_revealed';
export type GameMode = 'couple' | 'pass_and_play';

export interface TruthOrDareFirestoreDoc {
  category: TruthOrDareCategory;
  activeUid: string;
  activePlayerName: string;
  spinnerUid?: string;
  targetAngle: number;
  phase: TruthOrDarePhase;
  selectedPrompt: TruthOrDareItem | null;
  completedCount: number;
  updatedAt?: any;
}

export interface UseTruthOrDareReturn {
  category: TruthOrDareCategory;
  setCategory: (cat: TruthOrDareCategory) => void;
  selectedPrompt: TruthOrDareItem | null;
  activePlayerName: string;
  isMyTurn: boolean;
  canSpin: boolean;
  canPickCard: boolean;
  phase: TruthOrDarePhase;
  completedCount: number;
  targetAngle: number;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isLinked: boolean;
  userName: string;
  partnerName: string;
  spinBottle: () => void;
  onSpinAnimationComplete: () => void;
  pickPrompt: (type: PromptType) => void;
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
  const [phase, setPhase] = useState<TruthOrDarePhase>('need_spin');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [targetAngle, setTargetAngle] = useState<number>(0);
  const currentAngleRef = useRef<number>(0);
  const isSpinnerRef = useRef<boolean>(false);

  // Is it my turn to choose a card?
  const isMyTurn =
    gameMode === 'pass_and_play'
      ? true
      : activeUid === myUid;

  const canSpin = phase === 'need_spin' || phase === 'choose_card';
  const canPickCard = phase === 'choose_card' && isMyTurn;

  // Realtime Firestore Subscription for Couple Mode
  useEffect(() => {
    if (!isLinked || !coupleId || gameMode !== 'couple') {
      gameLog('TruthOrDare', 'LocalModeActive', { gameMode, isLinked, coupleId });
      return;
    }

    const timer = startGameTimer('TruthOrDare', 'SubscribeRemoteGame', { coupleId });
    const gameDocRef = doc(db, 'couples', coupleId, 'games', 'truth_or_dare');

    const unsubscribe = onSnapshot(
      gameDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TruthOrDareFirestoreDoc;
          gameLog('TruthOrDare', 'RemoteSnapshotReceived', {
            phase: data.phase,
            activeUid: data.activeUid,
            targetAngle: data.targetAngle,
            hasPrompt: !!data.selectedPrompt,
            promptId: data.selectedPrompt?.id,
            completedCount: data.completedCount,
          });

          setCategoryState(data.category || 'romantic');
          setActiveUid(data.activeUid || myUid || 'me');
          setActivePlayerName(
            data.activeUid === myUid
              ? userName
              : partnerName
          );
          setTargetAngle(data.targetAngle || 0);
          currentAngleRef.current = data.targetAngle || 0;
          setPhase(data.phase || 'need_spin');
          setSelectedPrompt(data.selectedPrompt || null);
          setCompletedCount(data.completedCount || 0);
        } else {
          // Initialize remote state
          const initialData: TruthOrDareFirestoreDoc = {
            category: 'romantic',
            activeUid: myUid || 'me',
            activePlayerName: userName,
            targetAngle: 0,
            phase: 'need_spin',
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
        console.warn('[useTruthOrDare] Remote sync unavailable, using local mode:', err?.message);
        gameLog('TruthOrDare', 'RemoteSyncError', { error: err?.message });
        setGameMode('pass_and_play');
      }
    );

    return () => {
      gameLog('TruthOrDare', 'UnsubscribeRemoteGame');
      unsubscribe();
    };
  }, [coupleId, isLinked, gameMode, myUid, userName, partnerName, partnerUid]);

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
      const timer = startGameTimer('TruthOrDare', 'ChangeCategory', { from: category, to: cat });
      setCategoryState(cat);
      if (phase === 'prompt_revealed') {
        setPhase('choose_card');
        setSelectedPrompt(null);
      }
      updateRemote({ category: cat }, 'SyncCategoryChange');
      timer.stop();
    },
    [category, phase, updateRemote]
  );

  const spinBottle = useCallback(() => {
    if (phase === 'spinning') return;

    const timer = startGameTimer('TruthOrDare', 'SpinBottle');
    isSpinnerRef.current = true;

    // Random rotations between 4 to 8 full spins + random offset
    const randomExtra = Math.random() * 360;
    const spins = 4 + Math.floor(Math.random() * 4);
    const newAngle = currentAngleRef.current + spins * 360 + randomExtra;
    currentAngleRef.current = newAngle;

    // Pre-calculate target player from landing angle so both devices are immediately synced
    const normalized = ((newAngle % 360) + 360) % 360;
    const isPartner = normalized >= 90 && normalized < 270;
    const chosenUid = isPartner ? (partnerUid || 'partner') : (myUid || 'me');
    const chosenName = isPartner ? partnerName : userName;

    setTargetAngle(newAngle);
    setPhase('spinning');
    setSelectedPrompt(null);
    setActiveUid(chosenUid);
    setActivePlayerName(chosenName);

    updateRemote({
      targetAngle: newAngle,
      phase: 'spinning',
      selectedPrompt: null,
      spinnerUid: myUid || 'me',
      activeUid: chosenUid,
      activePlayerName: chosenName,
    }, 'SyncSpinBottle');

    timer.stop({ newAngle, targetPlayer: chosenName, isPartner });
  }, [phase, myUid, partnerUid, partnerName, userName, updateRemote]);

  const onSpinAnimationComplete = useCallback(() => {
    const timer = startGameTimer('TruthOrDare', 'SpinAnimationComplete', {
      targetAngle,
      activePlayerName,
    });

    setPhase('choose_card');

    // Spinner client confirms phase transition in Firestore if in couple mode
    if (isSpinnerRef.current) {
      isSpinnerRef.current = false;
      updateRemote({
        phase: 'choose_card',
      }, 'SyncSpinAnimationComplete');
    }

    timer.stop();
  }, [targetAngle, activePlayerName, updateRemote]);

  const pickPrompt = useCallback(
    (type: PromptType) => {
      const timer = startGameTimer('TruthOrDare', 'PickPrompt', {
        type,
        category,
        activePlayer: activePlayerName,
      });

      if (phase !== 'choose_card') {
        timer.stop({ rejected: 'Not in choose_card phase' });
        return;
      }
      if (gameMode === 'couple' && !isMyTurn) {
        timer.stop({ rejected: 'Not your turn' });
        return;
      }

      const prompt = getRandomPrompt(category, type, usedIds);
      setUsedIds((prev) => [...prev, prompt.id]);
      setSelectedPrompt(prompt);
      setPhase('prompt_revealed');

      updateRemote({
        selectedPrompt: prompt,
        phase: 'prompt_revealed',
      }, 'SyncPickPrompt');

      timer.stop({ promptId: prompt.id, promptText: prompt.text });
    },
    [phase, gameMode, isMyTurn, category, usedIds, activePlayerName, updateRemote]
  );

  const completeChallenge = useCallback(() => {
    const timer = startGameTimer('TruthOrDare', 'CompleteChallenge', {
      currentCount: completedCount,
    });

    const nextCount = completedCount + 1;
    setCompletedCount(nextCount);
    setSelectedPrompt(null);
    setPhase('need_spin');

    // Switch active player for next turn
    const nextUid = activeUid === myUid ? (partnerUid || 'partner') : (myUid || 'me');
    const nextName = activeUid === myUid ? partnerName : userName;
    setActiveUid(nextUid);
    setActivePlayerName(nextName);

    updateRemote({
      completedCount: nextCount,
      selectedPrompt: null,
      phase: 'need_spin',
      activeUid: nextUid,
      activePlayerName: nextName,
    }, 'SyncCompleteChallenge');

    timer.stop({ nextCount, nextPlayer: nextName });
  }, [completedCount, activeUid, myUid, partnerUid, partnerName, userName, updateRemote]);

  const resetGame = useCallback(() => {
    const timer = startGameTimer('TruthOrDare', 'ResetGame');
    setCompletedCount(0);
    setSelectedPrompt(null);
    setPhase('need_spin');
    setUsedIds([]);
    updateRemote({
      completedCount: 0,
      selectedPrompt: null,
      phase: 'need_spin',
      targetAngle: 0,
    }, 'SyncResetGame');
    timer.stop();
  }, [updateRemote]);

  return {
    category,
    setCategory,
    selectedPrompt,
    activePlayerName,
    isMyTurn,
    canSpin,
    canPickCard,
    phase,
    completedCount,
    targetAngle,
    gameMode,
    setGameMode,
    isLinked,
    userName,
    partnerName,
    spinBottle,
    onSpinAnimationComplete,
    pickPrompt,
    completeChallenge,
    resetGame,
  };
}
