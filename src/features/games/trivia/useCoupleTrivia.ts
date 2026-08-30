import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import {
  TRIVIA_PACKS,
  TriviaPack,
  TriviaQuestion,
  formatTriviaText,
} from './triviaData';
import { gameLog, startGameTimer, measureGameAsync } from '../gameLogger';

export type TriviaPhase =
  | 'secret_truth'    // Subject is secretly picking their real answer
  | 'privacy_guard'   // Pass & Play only: "Pass device to [Guesser]" screen
  | 'guesser_pick'    // Guesser is choosing what they think Subject chose
  | 'reveal'          // Dramatic reveal showing both choices & score update
  | 'finished';       // Final score recap & winner coronation

export type TriviaGameMode = 'couple' | 'pass_and_play';

export interface TriviaRoundResult {
  questionIndex: number;
  formattedQuestion: string;
  category: string;
  subjectName: string;
  guesserName: string;
  secretTruth: string;
  guesserGuess: string;
  matched: boolean;
  forfeit: string;
}

export interface TriviaFirestoreDoc {
  packId: string;
  currentIndex: number;
  phase: TriviaPhase;
  player1Uid: string;
  player2Uid: string;
  player1Name: string;
  player2Name: string;
  subjectUid: string;
  guesserUid: string;
  secretTruth: string | null;
  guesserGuess: string | null;
  scores: { player1: number; player2: number };
  roundResults: TriviaRoundResult[];
  lastActionBy?: string;
  updatedAt?: any;
}

export interface UseCoupleTriviaReturn {
  // Game Configuration & Modes
  selectedPack: TriviaPack;
  gameMode: TriviaGameMode;
  setGameMode: (mode: TriviaGameMode) => void;
  isLinked: boolean;
  
  // Players
  player1Name: string;
  player2Name: string;
  subjectName: string;
  guesserName: string;
  isSubjectMe: boolean;
  isGuesserMe: boolean;
  isMyTurnToAct: boolean;
  waitingForPartnerText: string | null;

  // Active Question & Phase
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: TriviaQuestion;
  formattedQuestionText: string;
  phase: TriviaPhase;
  secretTruth: string | null;
  guesserGuess: string | null;
  
  // Scoring & Stats
  scores: { player1: number; player2: number };
  roundResults: TriviaRoundResult[];
  winner: 'player1' | 'player2' | 'tie' | null;
  winnerName: string;
  compatibilityPercent: number;
  currentForfeitText: string;

  // Handlers
  handleSelectPack: (pack: TriviaPack) => void;
  handleSubjectSelectTruth: (option: string) => void;
  handleDismissPrivacyGuard: () => void;
  handleGuesserSelectGuess: (option: string) => void;
  handleNextQuestion: () => void;
  handleRestartMatch: (pack?: TriviaPack) => void;
}

export function useCoupleTrivia(): UseCoupleTriviaReturn {
  const { coupleId, myUid, userProfile, partnerProfile, isLinked } = useCouple();
  
  const userName = userProfile?.displayName || 'You';
  const partnerName = partnerProfile?.displayName || 'Partner';
  const partnerUid = partnerProfile?.uid || 'partner_uid';

  const [gameMode, setGameMode] = useState<TriviaGameMode>(
    isLinked ? 'couple' : 'pass_and_play'
  );

  const [selectedPack, setSelectedPack] = useState<TriviaPack>(TRIVIA_PACKS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<TriviaPhase>('secret_truth');
  
  const [player1Uid, setPlayer1Uid] = useState<string>(myUid || 'p1');
  const [player2Uid, setPlayer2Uid] = useState<string>(partnerUid || 'p2');
  const [player1Name, setPlayer1Name] = useState<string>(userName);
  const [player2Name, setPlayer2Name] = useState<string>(partnerName);

  const [secretTruth, setSecretTruth] = useState<string | null>(null);
  const [guesserGuess, setGuesserGuess] = useState<string | null>(null);
  const [scores, setScores] = useState<{ player1: number; player2: number }>({
    player1: 0,
    player2: 0,
  });
  const [roundResults, setRoundResults] = useState<TriviaRoundResult[]>([]);

  // Identify roles for current question:
  // Even questions (0, 2, 4...) -> Player 1 is Subject, Player 2 is Guesser (P2 gets tested on P1)
  // Odd questions (1, 3, 5...)  -> Player 2 is Subject, Player 1 is Guesser (P1 gets tested on P2)
  const isSubjectPlayer1 = currentIndex % 2 === 0;
  const currentSubjectUid = isSubjectPlayer1 ? player1Uid : player2Uid;
  const currentSubjectName = isSubjectPlayer1 ? player1Name : player2Name;
  const currentGuesserUid = isSubjectPlayer1 ? player2Uid : player1Uid;
  const currentGuesserName = isSubjectPlayer1 ? player2Name : player1Name;

  const isSubjectMe = gameMode === 'pass_and_play' ? true : myUid === currentSubjectUid;
  const isGuesserMe = gameMode === 'pass_and_play' ? true : myUid === currentGuesserUid;

  const currentQuestion = selectedPack.questions[currentIndex] || selectedPack.questions[0];
  const totalQuestions = selectedPack.questions.length;

  const formattedQuestionText = formatTriviaText(
    currentQuestion.template,
    currentSubjectName,
    currentGuesserName
  );

  const currentForfeitText = formatTriviaText(
    currentQuestion.forfeit,
    currentSubjectName,
    currentGuesserName
  );

  // Firestore Sync for Couple Mode
  useEffect(() => {
    if (!isLinked || !coupleId || gameMode !== 'couple') return;

    const triviaDocRef = doc(db, 'couples', coupleId, 'games', 'trivia');
    gameLog('CoupleTrivia', 'SubscribeFirestore', { coupleId });

    const unsubscribe = onSnapshot(
      triviaDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Initialize remote game doc
          const initialDoc: TriviaFirestoreDoc = {
            packId: selectedPack.id,
            currentIndex: 0,
            phase: 'secret_truth',
            player1Uid: myUid || 'p1',
            player2Uid: partnerUid || 'p2',
            player1Name: userName,
            player2Name: partnerName,
            subjectUid: myUid || 'p1',
            guesserUid: partnerUid || 'p2',
            secretTruth: null,
            guesserGuess: null,
            scores: { player1: 0, player2: 0 },
            roundResults: [],
            lastActionBy: myUid || 'p1',
            updatedAt: serverTimestamp(),
          };
          setDoc(triviaDocRef, initialDoc).catch((err) => {
            console.error('[CoupleTrivia] Error initializing doc:', err);
          });
          return;
        }

        const data = snapshot.data() as TriviaFirestoreDoc;
        const matchedPack = TRIVIA_PACKS.find((p) => p.id === data.packId) || TRIVIA_PACKS[0];
        
        setSelectedPack(matchedPack);
        setCurrentIndex(data.currentIndex ?? 0);
        setPhase(data.phase ?? 'secret_truth');
        setPlayer1Uid(data.player1Uid);
        setPlayer2Uid(data.player2Uid);
        setPlayer1Name(data.player1Name || userName);
        setPlayer2Name(data.player2Name || partnerName);
        setSecretTruth(data.secretTruth);
        setGuesserGuess(data.guesserGuess);
        setScores(data.scores || { player1: 0, player2: 0 });
        setRoundResults(data.roundResults || []);
      },
      (error) => {
        console.error('[CoupleTrivia] Firestore snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [isLinked, coupleId, gameMode]);

  // Sync to Firestore helper
  const syncToFirestore = useCallback(
    async (updates: Partial<TriviaFirestoreDoc>) => {
      if (!isLinked || !coupleId || gameMode !== 'couple') return;
      try {
        const triviaDocRef = doc(db, 'couples', coupleId, 'games', 'trivia');
        await setDoc(
          triviaDocRef,
          {
            ...updates,
            lastActionBy: myUid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[CoupleTrivia] Sync error:', err);
      }
    },
    [isLinked, coupleId, gameMode, myUid]
  );

  // Turn evaluation
  let isMyTurnToAct = true;
  let waitingForPartnerText: string | null = null;

  if (gameMode === 'couple') {
    if (phase === 'secret_truth') {
      if (myUid === currentSubjectUid) {
        isMyTurnToAct = true;
      } else {
        isMyTurnToAct = false;
        waitingForPartnerText = `Waiting for ${currentSubjectName} to lock in their secret truth... 🔒`;
      }
    } else if (phase === 'guesser_pick') {
      if (myUid === currentGuesserUid) {
        isMyTurnToAct = true;
      } else {
        isMyTurnToAct = false;
        waitingForPartnerText = `Waiting for ${currentGuesserName} to guess your choice... 🤔`;
      }
    }
  }

  // 1. Subject locks in their secret truth
  const handleSubjectSelectTruth = useCallback(
    (option: string) => {
      const timer = startGameTimer('CoupleTrivia', 'SubjectSelectTruth', {
        questionIndex: currentIndex,
        subject: currentSubjectName,
        choice: option,
      });

      setSecretTruth(option);

      if (gameMode === 'pass_and_play') {
        setPhase('privacy_guard');
      } else {
        setPhase('guesser_pick');
        syncToFirestore({
          secretTruth: option,
          phase: 'guesser_pick',
        });
      }

      timer.stop();
    },
    [currentIndex, currentSubjectName, gameMode, syncToFirestore]
  );

  // 2. Privacy guard dismissed by Guesser (Pass & Play)
  const handleDismissPrivacyGuard = useCallback(() => {
    gameLog('CoupleTrivia', 'DismissPrivacyGuard', { guesser: currentGuesserName });
    setPhase('guesser_pick');
  }, [currentGuesserName]);

  // 3. Guesser submits their guess
  const handleGuesserSelectGuess = useCallback(
    (option: string) => {
      const timer = startGameTimer('CoupleTrivia', 'GuesserSelectGuess', {
        questionIndex: currentIndex,
        guesser: currentGuesserName,
        guess: option,
        actualTruth: secretTruth,
      });

      setGuesserGuess(option);
      const isMatched = secretTruth === option;

      // Update scores: Guesser earns 1 point if they guessed Subject's truth!
      const newScores = { ...scores };
      if (isMatched) {
        if (isSubjectPlayer1) {
          // Player 2 is Guesser
          newScores.player2 += 1;
        } else {
          // Player 1 is Guesser
          newScores.player1 += 1;
        }
      }
      setScores(newScores);

      const newRoundResult: TriviaRoundResult = {
        questionIndex: currentIndex,
        formattedQuestion: formattedQuestionText,
        category: currentQuestion.category,
        subjectName: currentSubjectName,
        guesserName: currentGuesserName,
        secretTruth: secretTruth || '',
        guesserGuess: option,
        matched: isMatched,
        forfeit: currentForfeitText,
      };

      const updatedResults = [...roundResults, newRoundResult];
      setRoundResults(updatedResults);
      setPhase('reveal');

      if (gameMode === 'couple') {
        syncToFirestore({
          guesserGuess: option,
          phase: 'reveal',
          scores: newScores,
          roundResults: updatedResults,
        });
      }

      timer.stop({ matched: isMatched, newScores });
    },
    [
      currentIndex,
      currentGuesserName,
      secretTruth,
      scores,
      isSubjectPlayer1,
      formattedQuestionText,
      currentQuestion.category,
      currentSubjectName,
      currentForfeitText,
      roundResults,
      gameMode,
      syncToFirestore,
    ]
  );

  // 4. Move to next question or finish
  const handleNextQuestion = useCallback(() => {
    const timer = startGameTimer('CoupleTrivia', 'NextQuestion', { currentIndex });

    if (currentIndex + 1 < totalQuestions) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSecretTruth(null);
      setGuesserGuess(null);
      setPhase('secret_truth');

      if (gameMode === 'couple') {
        const nextSubjectUid = nextIdx % 2 === 0 ? player1Uid : player2Uid;
        const nextGuesserUid = nextIdx % 2 === 0 ? player2Uid : player1Uid;
        syncToFirestore({
          currentIndex: nextIdx,
          secretTruth: null,
          guesserGuess: null,
          phase: 'secret_truth',
          subjectUid: nextSubjectUid,
          guesserUid: nextGuesserUid,
        });
      }
      timer.stop({ nextIndex: nextIdx });
    } else {
      setPhase('finished');
      if (gameMode === 'couple') {
        syncToFirestore({
          phase: 'finished',
        });
      }
      timer.stop({ finished: true, scores });
    }
  }, [currentIndex, totalQuestions, gameMode, player1Uid, player2Uid, scores, syncToFirestore]);

  // 5. Restart match / Select Pack
  const handleRestartMatch = useCallback(
    (pack?: TriviaPack) => {
      const activePack = pack || selectedPack;
      gameLog('CoupleTrivia', 'RestartMatch', { packId: activePack.id });

      if (pack) setSelectedPack(pack);
      setCurrentIndex(0);
      setPhase('secret_truth');
      setSecretTruth(null);
      setGuesserGuess(null);
      setScores({ player1: 0, player2: 0 });
      setRoundResults([]);

      if (gameMode === 'couple') {
        syncToFirestore({
          packId: activePack.id,
          currentIndex: 0,
          phase: 'secret_truth',
          secretTruth: null,
          guesserGuess: null,
          scores: { player1: 0, player2: 0 },
          roundResults: [],
          subjectUid: player1Uid,
          guesserUid: player2Uid,
        });
      }
    },
    [selectedPack, gameMode, player1Uid, player2Uid, syncToFirestore]
  );

  const handleSelectPack = useCallback(
    (pack: TriviaPack) => {
      setSelectedPack(pack);
      handleRestartMatch(pack);
    },
    [handleRestartMatch]
  );

  // Determine Winner & Compatibility
  let winner: 'player1' | 'player2' | 'tie' | null = null;
  let winnerName = '';
  if (scores.player1 > scores.player2) {
    winner = 'player1';
    winnerName = player1Name;
  } else if (scores.player2 > scores.player1) {
    winner = 'player2';
    winnerName = player2Name;
  } else if (roundResults.length > 0) {
    winner = 'tie';
    winnerName = 'Tie';
  }

  const totalMatches = roundResults.filter((r) => r.matched).length;
  const compatibilityPercent =
    roundResults.length > 0
      ? Math.round((totalMatches / roundResults.length) * 100)
      : 0;

  return {
    selectedPack,
    gameMode,
    setGameMode,
    isLinked,
    player1Name,
    player2Name,
    subjectName: currentSubjectName,
    guesserName: currentGuesserName,
    isSubjectMe,
    isGuesserMe,
    isMyTurnToAct,
    waitingForPartnerText,
    currentIndex,
    totalQuestions,
    currentQuestion,
    formattedQuestionText,
    phase,
    secretTruth,
    guesserGuess,
    scores,
    roundResults,
    winner,
    winnerName,
    compatibilityPercent,
    currentForfeitText,
    handleSelectPack,
    handleSubjectSelectTruth,
    handleDismissPrivacyGuard,
    handleGuesserSelectGuess,
    handleNextQuestion,
    handleRestartMatch,
  };
}
