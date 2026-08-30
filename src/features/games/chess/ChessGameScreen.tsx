import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Crown,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
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
} from './chessEngine';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 360);
const SQUARE_SIZE = BOARD_SIZE / 8;

interface ChessGameScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

// Unicode Chess piece glyphs with crisp rendering
const PIECE_UNICODE: Record<string, string> = {
  'w_k': '♔',
  'w_q': '♕',
  'w_r': '♖',
  'w_b': '♗',
  'w_n': '♘',
  'w_p': '♙',
  'b_k': '♚',
  'b_q': '♛',
  'b_r': '♜',
  'b_b': '♝',
  'b_n': '♞',
  'b_p': '♟',
};

export const ChessGameScreen: React.FC<ChessGameScreenProps> = ({ onBack, onShareToChat }) => {
  const [board, setBoard] = useState<ChessBoard>(initialBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const isCheck = isKingInCheck(board, turn);

  const handleSquarePress = (row: number, col: number) => {
    if (winner) return;

    // If square clicked is a legal destination for the selected piece
    if (selectedPos && legalMoves.some((m) => m.row === row && m.col === col)) {
      const { board: newBoard, capturedPiece } = makeMove(board, {
        from: selectedPos,
        to: { row, col },
      });

      if (capturedPiece) {
        if (turn === 'w') {
          setCapturedByWhite((prev) => [...prev, capturedPiece]);
        } else {
          setCapturedByBlack((prev) => [...prev, capturedPiece]);
        }
      }

      const nextTurn: PieceColor = turn === 'w' ? 'b' : 'w';
      setBoard(newBoard);
      setSelectedPos(null);
      setLegalMoves([]);
      setTurn(nextTurn);
      setMoveCount((c) => c + 1);

      const status = isGameOver(newBoard, nextTurn);
      if (status.over) {
        setWinner(status.winner);
      }
      return;
    }

    // Select piece of current player
    const piece = board[row][col];
    if (piece && piece.color === turn) {
      setSelectedPos({ row, col });
      const moves = getLegalMoves(board, row, col, turn);
      setLegalMoves(moves);
    } else {
      setSelectedPos(null);
      setLegalMoves([]);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Match', 'Start a new couple chess game?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New Game',
        style: 'destructive',
        onPress: () => {
          setBoard(initialBoard());
          setTurn('w');
          setSelectedPos(null);
          setLegalMoves([]);
          setCapturedByWhite([]);
          setCapturedByBlack([]);
          setWinner(null);
          setMoveCount(0);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Couple Chess</Text>
          <Text style={styles.headerSubtitle}>Pass & Play • Move {moveCount}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Player 2 (Black) Bar & Captured Tray */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfoRow}>
          <View style={[styles.playerAvatar, turn === 'b' && styles.playerAvatarActive]}>
            <Text style={styles.playerAvatarText}>💫</Text>
          </View>
          <View>
            <Text style={styles.playerName}>Partner (Black)</Text>
            <Text style={styles.playerStatus}>
              {turn === 'b' ? 'Thinking...' : 'Waiting'}
            </Text>
          </View>
        </View>
        <View style={styles.capturedTray}>
          {capturedByBlack.map((p, idx) => (
            <Text key={idx} style={styles.capturedPiece}>
              {PIECE_UNICODE[`${p.color}_${p.type}`]}
            </Text>
          ))}
        </View>
      </View>

      {/* Check / Status Alert */}
      {isCheck && !winner && (
        <View style={styles.checkAlertBanner}>
          <Sparkles size={16} color="#DC2626" />
          <Text style={styles.checkAlertText}>
            {turn === 'w' ? 'White King is in Check!' : 'Black King is in Check!'}
          </Text>
        </View>
      )}

      {/* Chess Board */}
      <View style={styles.boardWrapper}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {board.map((row, rIdx) => (
            <View key={rIdx} style={styles.boardRow}>
              {row.map((cell, cIdx) => {
                const isDark = (rIdx + cIdx) % 2 === 1;
                const isSelected = selectedPos?.row === rIdx && selectedPos?.col === cIdx;
                const isLegal = legalMoves.some((m) => m.row === rIdx && m.col === cIdx);

                return (
                  <TouchableOpacity
                    key={cIdx}
                    style={[
                      styles.square,
                      {
                        width: SQUARE_SIZE,
                        height: SQUARE_SIZE,
                        backgroundColor: isSelected
                          ? '#FDE047' // Selected highlight
                          : isDark
                          ? '#E8B4B8' // Soft rose-sand dark square
                          : '#FFF5F5', // Soft ivory light square
                      },
                    ]}
                    onPress={() => handleSquarePress(rIdx, cIdx)}
                    activeOpacity={0.8}
                  >
                    {/* Legal move indicator dot */}
                    {isLegal && (
                      <View
                        style={[
                          styles.legalDot,
                          cell ? styles.legalCaptureRing : null,
                        ]}
                      />
                    )}

                    {/* Piece Glyph */}
                    {cell && (
                      <Text
                        style={[
                          styles.pieceText,
                          {
                            color: cell.color === 'w' ? '#BE123C' : '#1C1917',
                          },
                        ]}
                      >
                        {PIECE_UNICODE[`${cell.color}_${cell.type}`]}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Player 1 (White) Bar & Captured Tray */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfoRow}>
          <View style={[styles.playerAvatar, turn === 'w' && styles.playerAvatarActive]}>
            <Text style={styles.playerAvatarText}>❤️</Text>
          </View>
          <View>
            <Text style={styles.playerName}>You (White)</Text>
            <Text style={styles.playerStatus}>
              {turn === 'w' ? 'Your turn to move' : 'Waiting'}
            </Text>
          </View>
        </View>
        <View style={styles.capturedTray}>
          {capturedByWhite.map((p, idx) => (
            <Text key={idx} style={styles.capturedPiece}>
              {PIECE_UNICODE[`${p.color}_${p.type}`]}
            </Text>
          ))}
        </View>
      </View>

      {/* Victory & Romantic Forfeit Banner */}
      {winner && (
        <View style={styles.victoryCard}>
          <View style={styles.victoryHeader}>
            <Crown size={24} color="#F59E0B" />
            <Text style={styles.victoryTitle}>
              {winner === 'draw'
                ? 'Game Drawn by Stalemate!'
                : `${winner === 'w' ? 'White (You)' : 'Black (Partner)'} Wins by Checkmate!`}
            </Text>
          </View>
          <Text style={styles.victoryForfeit}>
            🏆 Winner Reward: The loser owes the winner a sweet romantic back rub or breakfast in bed!
          </Text>
          <View style={styles.victoryActions}>
            {onShareToChat && (
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() =>
                  onShareToChat(
                    `♟️ Checkmate in Couple Chess! ${
                      winner === 'w' ? 'White' : 'Black'
                    } won after ${moveCount} moves! 👑`
                  )
                }
              >
                <Share2 size={16} color={colors.textPrimary} />
                <Text style={styles.shareBtnText}>Share in Chat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.newGameBtn} onPress={handleReset}>
              <Text style={styles.newGameBtnText}>Rematch</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  resetBtn: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginVertical: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerAvatarActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  playerAvatarText: {
    fontSize: 18,
  },
  playerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  playerStatus: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  capturedTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 120,
    justifyContent: 'flex-end',
    gap: 2,
  },
  capturedPiece: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  checkAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  checkAlertText: {
    color: '#DC2626',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  board: {
    borderWidth: 3,
    borderColor: '#BE123C',
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  boardRow: {
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieceText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
  legalDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.55)',
    zIndex: 2,
  },
  legalCaptureRing: {
    width: SQUARE_SIZE - 4,
    height: SQUARE_SIZE - 4,
    borderRadius: (SQUARE_SIZE - 4) / 2,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#DC2626',
  },
  victoryCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginTop: 4,
    ...shadows.md,
  },
  victoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  victoryTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  victoryForfeit: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 4,
  },
  victoryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shareBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  newGameBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  newGameBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
