import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { notifyGameTurn } from '../../../services/notificationService';
import {
  checkTicTacToeWinner,
  TicTacToeCell,
  TicTacToeResult,
  TIC_TAC_TOE_DARES,
} from './ticTacToeLogic';
import { gameLog, startGameTimer, measureGameAsync } from '../gameLogger';

export type TicTacToeGameMode = 'couple' | 'pass_and_play';

export interface TicTacToeFirestoreDoc {
  board: TicTacToeCell[];
  turn: 'X' | 'O';
  scores: { X: number; O: number; draws: number };
  winner: 'X' | 'O' | null;
  winningLine: number[] | null;
  isDraw: boolean;
  currentDare: string | null;
  playerXUid: string;
  playerOUid: string;
  playerXName: string;
  playerOName: string;
  lastMoveBy?: string;
  updatedAt?: any;
}

export interface UseTicTacToeReturn {
  board: TicTacToeCell[];
  turn: 'X' | 'O';
  scores: { X: number; O: number; draws: number };
  currentDare: string | null;
  result: TicTacToeResult;
  gameMode: TicTacToeGameMode;
  setGameMode: (mode: TicTacToeGameMode) => void;
  isLinked: boolean;
  userName: string;
  partnerName: string;
  mySymbol: 'X' | 'O';
  isMyTurn: boolean;
  handleCellPress: (index: number) => void;
  handleNewRound: () => void;
  handleResetMatch: () => void;
}

export function useTicTacToe(): UseTicTacToeReturn {
  const { coupleId, myUid, userProfile, partnerProfile, isLinked } = useCouple();
  const userName = userProfile?.displayName || 'You';
  const partnerName = partnerProfile?.displayName || 'Partner';
  const partnerUid = partnerProfile?.uid || 'partner_uid';

  const [gameMode, setGameMode] = useState<TicTacToeGameMode>(isLinked ? 'couple' : 'pass_and_play');
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [currentDare, setCurrentDare] = useState<string | null>(null);
  const [playerXUid, setPlayerXUid] = useState<string>(myUid || 'p1');
  const [playerOUid, setPlayerOUid] = useState<string>(partnerUid || 'p2');

  const result = checkTicTacToeWinner(board);

  // In Couple Mode: My symbol is X if myUid matches playerXUid, else O
  const mySymbol: 'X' | 'O' =
    gameMode === 'couple'
      ? myUid === playerOUid && myUid !== playerXUid
        ? 'O'
        : 'X'
      : turn;

  const isMyTurn: boolean =
    gameMode === 'pass_and_play'
      ? !result.winner && !result.isDraw
      : mySymbol === turn && !result.winner && !result.isDraw;

  // Realtime Firestore Subscription for Couple Mode
  useEffect(() => {
    if (!isLinked || !coupleId || gameMode !== 'couple') {
      gameLog('TicTacToe', 'LocalModeActive', { gameMode, isLinked, coupleId });
      return;
    }

    const timer = startGameTimer('TicTacToe', 'SubscribeRemoteGame', { coupleId });
    const gameDocRef = doc(db, 'couples', coupleId, 'games', 'tic_tac_toe');

    const unsubscribe = onSnapshot(
      gameDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TicTacToeFirestoreDoc;
          gameLog('TicTacToe', 'RemoteSnapshotReceived', {
            turn: data.turn,
            winner: data.winner,
            isDraw: data.isDraw,
            scores: data.scores,
            lastMoveBy: data.lastMoveBy,
          });

          setBoard(data.board || Array(9).fill(null));
          setTurn(data.turn || 'X');
          setScores(data.scores || { X: 0, O: 0, draws: 0 });
          setCurrentDare(data.currentDare || null);
          setPlayerXUid(data.playerXUid || myUid || 'p1');
          setPlayerOUid(data.playerOUid || partnerUid || 'p2');
        } else {
          // Only the lexicographically-smaller UID initializes the doc to avoid
          // a double-create race when both players open the game at once.
          if (!myUid || !partnerUid || myUid < partnerUid) {
            const initialData: TicTacToeFirestoreDoc = {
              board: Array(9).fill(null),
              turn: 'X',
              scores: { X: 0, O: 0, draws: 0 },
              winner: null,
              winningLine: null,
              isDraw: false,
              currentDare: null,
              playerXUid: myUid || 'p1',
              playerOUid: partnerUid || 'p2',
              playerXName: userName,
              playerOName: partnerName,
              updatedAt: serverTimestamp(),
            };
            setDoc(gameDocRef, initialData).catch((err) => {
              console.warn('[useTicTacToe] Init doc error:', err);
            });
          }
        }
        timer.stop({ success: true });
      },
      (err) => {
        console.warn('[useTicTacToe] Remote sync error:', err?.message);
        gameLog('TicTacToe', 'RemoteSyncError', { error: err?.message });
        setGameMode('pass_and_play');
      }
    );

    return () => {
      gameLog('TicTacToe', 'UnsubscribeRemoteGame');
      unsubscribe();
    };
  }, [coupleId, isLinked, gameMode, myUid, partnerUid, userName, partnerName]);

  const updateRemote = useCallback(
    async (payload: Partial<TicTacToeFirestoreDoc>, actionName: string = 'UpdateRemote') => {
      if (gameMode !== 'couple' || !coupleId) return;
      await measureGameAsync('TicTacToe', actionName, async () => {
        const gameDocRef = doc(db, 'couples', coupleId, 'games', 'tic_tac_toe');
        await setDoc(gameDocRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      }, payload);
    },
    [gameMode, coupleId]
  );

  const handleCellPress = useCallback(
    (index: number) => {
      const timer = startGameTimer('TicTacToe', 'CellPress', {
        index,
        currentTurn: turn,
        gameMode,
        isMyTurn,
      });

      if (board[index] || result.winner || result.isDraw) {
        timer.stop({ rejected: 'Cell already taken or game over' });
        return;
      }
      if (gameMode === 'couple' && !isMyTurn) {
        timer.stop({ rejected: 'Not your turn in couple mode' });
        return;
      }

      const nextBoard = [...board];
      nextBoard[index] = turn;
      setBoard(nextBoard);

      const nextResult = checkTicTacToeWinner(nextBoard);
      let nextScores = { ...scores };
      let newDare: string | null = null;
      const nextTurn: 'X' | 'O' = turn === 'X' ? 'O' : 'X';

      if (nextResult.winner) {
        nextScores = {
          ...nextScores,
          [nextResult.winner]: nextScores[nextResult.winner] + 1,
        };
        newDare = TIC_TAC_TOE_DARES[Math.floor(Math.random() * TIC_TAC_TOE_DARES.length)];
        setScores(nextScores);
        setCurrentDare(newDare);
      } else if (nextResult.isDraw) {
        nextScores = { ...nextScores, draws: nextScores.draws + 1 };
        setScores(nextScores);
      } else {
        setTurn(nextTurn);
      }

      updateRemote(
        {
          board: nextBoard,
          turn: nextResult.winner || nextResult.isDraw ? turn : nextTurn,
          scores: nextScores,
          winner: nextResult.winner,
          winningLine: nextResult.winningLine,
          isDraw: nextResult.isDraw,
          currentDare: newDare,
          lastMoveBy: userName,
        },
        'SyncMove'
      );

      // Notify partner that it's their turn if game continues
      if (gameMode === 'couple' && coupleId && myUid && partnerUid && !nextResult.winner && !nextResult.isDraw) {
        notifyGameTurn({
          coupleId,
          senderUid: myUid,
          recipientUid: partnerUid,
          partnerName: userName,
          gameId: 'tic_tac_toe',
          gameName: 'Tic Tac Toe',
          recipientPushToken: partnerProfile?.expoPushToken,
          preferences: partnerProfile?.notificationPreferences,
        }).catch(() => {});
      }

      timer.stop({
        index,
        symbol: turn,
        hasWinner: !!nextResult.winner,
        isDraw: nextResult.isDraw,
        winner: nextResult.winner,
      });
    },
    [board, turn, result, scores, gameMode, isMyTurn, userName, updateRemote, coupleId, myUid, partnerUid, partnerProfile]
  );

  const handleNewRound = useCallback(() => {
    const timer = startGameTimer('TicTacToe', 'NewRound');
    const newBoard: TicTacToeCell[] = Array(9).fill(null);
    setBoard(newBoard);
    setTurn('X');
    setCurrentDare(null);

    updateRemote(
      {
        board: newBoard,
        turn: 'X',
        winner: null,
        winningLine: null,
        isDraw: false,
        currentDare: null,
      },
      'SyncNewRound'
    );

    timer.stop();
  }, [updateRemote]);

  const handleResetMatch = useCallback(() => {
    const timer = startGameTimer('TicTacToe', 'ResetMatch');
    const newBoard: TicTacToeCell[] = Array(9).fill(null);
    const zeroScores = { X: 0, O: 0, draws: 0 };
    setBoard(newBoard);
    setTurn('X');
    setScores(zeroScores);
    setCurrentDare(null);

    updateRemote(
      {
        board: newBoard,
        turn: 'X',
        scores: zeroScores,
        winner: null,
        winningLine: null,
        isDraw: false,
        currentDare: null,
      },
      'SyncResetMatch'
    );

    timer.stop();
  }, [updateRemote]);

  return {
    board,
    turn,
    scores,
    currentDare,
    result,
    gameMode,
    setGameMode,
    isLinked,
    userName,
    partnerName,
    mySymbol,
    isMyTurn,
    handleCellPress,
    handleNewRound,
    handleResetMatch,
  };
}
