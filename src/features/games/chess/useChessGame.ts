import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import {
  ChessBoard,
  ChessPiece,
  initialBoard,
  getLegalMoves,
  makeMove,
  isGameOver,
  isKingInCheck,
  PieceColor,
  Position,
  Move,
} from './chessEngine';
import { ChessGameMode, ChessFirestoreDoc } from '../../../types/games';
import { gameLog, startGameTimer, measureGameAsync } from '../gameLogger';

export interface UseChessGameReturn {
  board: ChessBoard;
  turn: PieceColor;
  myColor: PieceColor;
  partnerColor: PieceColor;
  isMyTurn: boolean;
  canMove: boolean;
  gameMode: ChessGameMode;
  setGameMode: (mode: ChessGameMode) => void;
  selectedPos: Position | null;
  legalMoves: Position[];
  capturedByWhite: ChessPiece[];
  capturedByBlack: ChessPiece[];
  winner: PieceColor | 'draw' | null;
  moveCount: number;
  lastMove: Move | null;
  isCheck: boolean;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  isFlipped: boolean;
  toggleFlip: () => void;
  handleSquarePress: (row: number, col: number) => { success: boolean; reason?: string };
  resetMatch: (swapColors?: boolean) => Promise<void>;
  resignMatch: () => Promise<void>;
  whitePlayerName: string;
  blackPlayerName: string;
  isLinked: boolean;
}

export function useChessGame(): UseChessGameReturn {
  const { coupleId, myUid, userProfile, partnerProfile, isLinked } = useCouple();

  const [gameMode, setGameMode] = useState<ChessGameMode>(isLinked ? 'couple' : 'pass_and_play');
  const [board, setBoard] = useState<ChessBoard>(initialBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [whiteUid, setWhiteUid] = useState<string>(myUid || 'p1');
  const [blackUid, setBlackUid] = useState<string>(partnerProfile?.uid || 'p2');
  const [whitePlayerName, setWhitePlayerName] = useState<string>(userProfile?.displayName || 'You');
  const [blackPlayerName, setBlackPlayerName] = useState<string>(partnerProfile?.displayName || 'Partner');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [loading, setLoading] = useState<boolean>(isLinked);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Determine user's color in Couple Mode
  const myColor: PieceColor =
    gameMode === 'couple'
      ? myUid === blackUid && myUid !== whiteUid
        ? 'b'
        : 'w'
      : turn;

  const partnerColor: PieceColor = myColor === 'w' ? 'b' : 'w';
  const partnerPlayerName = myColor === 'w' ? blackPlayerName : whitePlayerName;
  const myPlayerName = myColor === 'w' ? whitePlayerName : blackPlayerName;

  // Can the user on this device currently make a move?
  const isMyTurn: boolean =
    gameMode === 'pass_and_play' ? !winner : myColor === turn && !winner;

  const canMove: boolean = isMyTurn;

  // Auto flip board for Black player perspective in Couple Mode
  useEffect(() => {
    if (gameMode === 'couple' && myColor === 'b') {
      setIsFlipped(true);
    } else if (gameMode === 'couple' && myColor === 'w') {
      setIsFlipped(false);
    }
  }, [gameMode, myColor]);

  // Firestore Realtime Subscription for Couple Mode
  useEffect(() => {
    if (!isLinked || !coupleId || gameMode !== 'couple') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameDocRef = doc(db, 'couples', coupleId, 'games', 'chess');

    const unsubscribe = onSnapshot(
      gameDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ChessFirestoreDoc;
          try {
            if (data.boardJson) {
              const parsedBoard = JSON.parse(data.boardJson);
              setBoard(parsedBoard);
            }
            setTurn(data.turn || 'w');
            setWhiteUid(data.whiteUid || myUid || 'p1');
            setBlackUid(data.blackUid || partnerProfile?.uid || 'p2');
            setWhitePlayerName(data.whiteName || userProfile?.displayName || 'You');
            setBlackPlayerName(data.blackName || partnerProfile?.displayName || 'Partner');
            setCapturedByWhite((data.capturedByWhite || []) as ChessPiece[]);
            setCapturedByBlack((data.capturedByBlack || []) as ChessPiece[]);
            setWinner(data.winner || null);
            setMoveCount(data.moveCount || 0);
            setLastMove(data.lastMove || null);
          } catch (e: any) {
            console.error('[useChessGame] Error parsing game doc:', e);
          }
        } else {
          // Only the lexicographically-smaller UID initializes the doc to avoid
          // a double-create race when both players open the game at once.
          if (!myUid || !partnerProfile?.uid || myUid < partnerProfile.uid) {
            const initialData: ChessFirestoreDoc = {
              boardJson: JSON.stringify(initialBoard()),
              turn: 'w',
              whiteUid: myUid || 'p1',
              blackUid: partnerProfile?.uid || 'p2',
              whiteName: userProfile?.displayName || 'You',
              blackName: partnerProfile?.displayName || 'Partner',
              capturedByWhite: [],
              capturedByBlack: [],
              winner: null,
              moveCount: 0,
              lastMove: null,
              updatedAt: serverTimestamp(),
            };
            setDoc(gameDocRef, initialData).catch((err) => {
              console.warn('[useChessGame] Error initializing game doc:', err);
            });
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useChessGame] Remote sync unavailable, falling back to local play:', err?.message);
        // Graceful fallback to local pass and play if Firestore permissions are missing
        setGameMode('pass_and_play');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId, isLinked, gameMode, myUid, userProfile?.displayName, partnerProfile?.uid, partnerProfile?.displayName]);

  const isCheck = isKingInCheck(board, turn);

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleSquarePress = useCallback(
    (row: number, col: number): { success: boolean; reason?: string } => {
      if (winner) {
        return { success: false, reason: 'Game is already over.' };
      }

      // Check turn constraint in Couple Mode
      if (gameMode === 'couple' && !isMyTurn) {
        return {
          success: false,
          reason: `It's ${partnerPlayerName}'s turn to move. Please wait!`,
        };
      }

      // 1. Move Execution if a destination is selected
      if (selectedPos && legalMoves.some((m) => m.row === row && m.col === col)) {
        const moveTimer = startGameTimer('Chess', 'ExecuteMove', {
          from: selectedPos,
          to: { row, col },
          turn,
        });

        const { board: newBoard, capturedPiece } = makeMove(board, {
          from: selectedPos,
          to: { row, col },
        });

        const newCapturedWhite = [...capturedByWhite];
        const newCapturedBlack = [...capturedByBlack];

        if (capturedPiece) {
          if (turn === 'w') {
            newCapturedWhite.push(capturedPiece);
          } else {
            newCapturedBlack.push(capturedPiece);
          }
        }

        const nextTurn: PieceColor = turn === 'w' ? 'b' : 'w';
        const newMoveCount = moveCount + 1;
        const newLastMove: Move = { from: selectedPos, to: { row, col } };
        const status = isGameOver(newBoard, nextTurn);
        const newWinner = status.over ? status.winner : null;

        // Optimistic local state update
        setBoard(newBoard);
        setSelectedPos(null);
        setLegalMoves([]);
        setTurn(nextTurn);
        setCapturedByWhite(newCapturedWhite);
        setCapturedByBlack(newCapturedBlack);
        setMoveCount(newMoveCount);
        setLastMove(newLastMove);
        if (status.over) {
          setWinner(status.winner);
        }

        moveTimer.stop({ captured: !!capturedPiece, isGameOver: status.over, winner: newWinner });

        // Save to Firestore if in Couple Mode (partial update: only the fields
        // that changed — smaller payload, faster round trip than a full doc)
        if (gameMode === 'couple' && coupleId) {
          const syncTimer = startGameTimer('Chess', 'SyncMoveToFirestore', { moveCount: newMoveCount });
          setSyncing(true);
          const gameDocRef = doc(db, 'couples', coupleId, 'games', 'chess');
          const payload: Partial<ChessFirestoreDoc> = {
            boardJson: JSON.stringify(newBoard),
            turn: nextTurn,
            capturedByWhite: newCapturedWhite,
            capturedByBlack: newCapturedBlack,
            winner: newWinner,
            moveCount: newMoveCount,
            lastMove: newLastMove,
            lastMoveBy: myUid || undefined,
            updatedAt: serverTimestamp(),
          };

          updateDoc(gameDocRef, payload)
            .then(() => {
              syncTimer.stop({ success: true });
            })
            .catch((err) => {
              syncTimer.stop({ success: false, error: err?.message });
              console.error('[useChessGame] Failed to sync move:', err);
              setError('Failed to send move to partner.');
            })
            .finally(() => {
              setSyncing(false);
            });
        }

        return { success: true };
      }

      // 2. Select piece
      const piece = board[row][col];
      const activeColor = gameMode === 'couple' ? myColor : turn;

      if (piece && piece.color === activeColor) {
        const selectTimer = startGameTimer('Chess', 'SelectPiece', { row, col, pieceType: piece.type, color: piece.color });
        setSelectedPos({ row, col });
        const moves = getLegalMoves(board, row, col, activeColor);
        setLegalMoves(moves);
        selectTimer.stop({ legalMovesCount: moves.length });
        return { success: true };
      } else {
        setSelectedPos(null);
        setLegalMoves([]);
        if (piece && piece.color !== activeColor) {
          return {
            success: false,
            reason: `You cannot move ${piece.color === 'w' ? 'White' : 'Black'} pieces.`,
          };
        }
        return { success: false };
      }
    },
    [
      winner,
      gameMode,
      isMyTurn,
      partnerPlayerName,
      selectedPos,
      legalMoves,
      board,
      capturedByWhite,
      capturedByBlack,
      turn,
      moveCount,
      coupleId,
      whiteUid,
      blackUid,
      whitePlayerName,
      blackPlayerName,
      myUid,
      myColor,
    ]
  );

  // Reset or Start New Match (with optional side swap)
  const resetMatch = useCallback(
    async (swapColors: boolean = true) => {
      const freshBoard = initialBoard();
      let newWhiteUid = whiteUid;
      let newBlackUid = blackUid;
      let newWhiteName = whitePlayerName;
      let newBlackName = blackPlayerName;

      if (swapColors && gameMode === 'couple') {
        newWhiteUid = blackUid;
        newBlackUid = whiteUid;
        newWhiteName = blackPlayerName;
        newBlackName = whitePlayerName;
      }

      setBoard(freshBoard);
      setTurn('w');
      setSelectedPos(null);
      setLegalMoves([]);
      setCapturedByWhite([]);
      setCapturedByBlack([]);
      setWinner(null);
      setMoveCount(0);
      setLastMove(null);
      setWhiteUid(newWhiteUid);
      setBlackUid(newBlackUid);
      setWhitePlayerName(newWhiteName);
      setBlackPlayerName(newBlackName);

      if (gameMode === 'couple' && coupleId) {
        setSyncing(true);
        try {
          const gameDocRef = doc(db, 'couples', coupleId, 'games', 'chess');
          const payload: ChessFirestoreDoc = {
            boardJson: JSON.stringify(freshBoard),
            turn: 'w',
            whiteUid: newWhiteUid,
            blackUid: newBlackUid,
            whiteName: newWhiteName,
            blackName: newBlackName,
            capturedByWhite: [],
            capturedByBlack: [],
            winner: null,
            moveCount: 0,
            lastMove: null,
            lastMoveBy: myUid || undefined,
            updatedAt: serverTimestamp(),
          };
          await setDoc(gameDocRef, payload, { merge: true });
        } catch (err: any) {
          console.error('[useChessGame] Reset match error:', err);
          setError('Failed to reset match.');
        } finally {
          setSyncing(false);
        }
      }
    },
    [whiteUid, blackUid, whitePlayerName, blackPlayerName, gameMode, coupleId, myUid]
  );

  // Resign Match
  const resignMatch = useCallback(async () => {
    const resigningColor = gameMode === 'couple' ? myColor : turn;
    const opponentWinner: PieceColor = resigningColor === 'w' ? 'b' : 'w';

    setWinner(opponentWinner);
    setSelectedPos(null);
    setLegalMoves([]);

    if (gameMode === 'couple' && coupleId) {
      setSyncing(true);
      try {
        const gameDocRef = doc(db, 'couples', coupleId, 'games', 'chess');
        await setDoc(
          gameDocRef,
          {
            winner: opponentWinner,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.error('[useChessGame] Resign match error:', err);
      } finally {
        setSyncing(false);
      }
    }
  }, [gameMode, myColor, turn, coupleId]);

  return {
    board,
    turn,
    myColor,
    partnerColor,
    isMyTurn,
    canMove,
    gameMode,
    setGameMode,
    selectedPos,
    legalMoves,
    capturedByWhite,
    capturedByBlack,
    winner,
    moveCount,
    lastMove,
    isCheck,
    loading,
    syncing,
    error,
    isFlipped,
    toggleFlip,
    handleSquarePress,
    resetMatch,
    resignMatch,
    whitePlayerName,
    blackPlayerName,
    isLinked,
  };
}
