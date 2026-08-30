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
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Crown,
  ArrowUpDown,
  Users,
  Smartphone,
  Flag,
  Info,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { PieceColor, Position } from './chessEngine';
import { useChessGame } from './useChessGame';

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
  const {
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
  } = useChessGame();

  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);

  const showTemporaryHint = (msg: string) => {
    setFeedbackHint(msg);
    setTimeout(() => {
      setFeedbackHint((current) => (current === msg ? null : current));
    }, 2800);
  };

  const onSquarePress = (displayRow: number, displayCol: number) => {
    // Map display coordinates based on flipped board perspective
    const actualRow = isFlipped ? 7 - displayRow : displayRow;
    const actualCol = isFlipped ? 7 - displayCol : displayCol;

    if (winner) return;

    if (gameMode === 'couple' && !isMyTurn) {
      showTemporaryHint(`⏳ Waiting for ${partnerPlayerName}'s move.`);
      return;
    }

    const result = handleSquarePress(actualRow, actualCol);
    if (!result.success && result.reason) {
      showTemporaryHint(result.reason);
    }
  };

  const handleResetPrompt = () => {
    Alert.alert(
      'Reset / New Game',
      gameMode === 'couple'
        ? 'Start a fresh match with your partner? Colors will be swapped so you take turns.'
        : 'Start a new Pass & Play couple match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Match',
          style: 'destructive',
          onPress: () => resetMatch(true),
        },
      ]
    );
  };

  const handleResignPrompt = () => {
    Alert.alert(
      'Resign Match',
      'Are you sure you want to forfeit this game? The loser owes the winner a romantic forfeit!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resign',
          style: 'destructive',
          onPress: () => resignMatch(),
        },
      ]
    );
  };

  const topPlayerColor: PieceColor = isFlipped ? 'w' : 'b';
  const bottomPlayerColor: PieceColor = isFlipped ? 'b' : 'w';

  const topPlayerName = isFlipped ? whitePlayerName : blackPlayerName;
  const bottomPlayerName = isFlipped ? blackPlayerName : whitePlayerName;

  const topPlayerCaptured = isFlipped ? capturedByWhite : capturedByBlack;
  const bottomPlayerCaptured = isFlipped ? capturedByBlack : capturedByWhite;

  const partnerPlayerName = myColor === 'w' ? blackPlayerName : whitePlayerName;
  const myPlayerName = myColor === 'w' ? whitePlayerName : blackPlayerName;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing Couple Chess Match...</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerSubtitle}>
            {gameMode === 'couple'
              ? `Online with ${partnerPlayerName} • Move ${moveCount}`
              : `Pass & Play • Move ${moveCount}`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleFlip}
            style={styles.iconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Flip Board Perspective"
          >
            <ArrowUpDown size={17} color={colors.textSecondary} />
          </TouchableOpacity>

          {!winner && (
            <TouchableOpacity
              onPress={handleResignPrompt}
              style={styles.iconBtn}
              activeOpacity={0.7}
              accessibilityLabel="Resign match"
            >
              <Flag size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleResetPrompt}
            style={styles.iconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Reset match"
          >
            <RotateCcw size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Switcher Pill if linked */}
      {isLinked && (
        <View style={styles.modeBar}>
          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'couple' && styles.modeTabActive]}
            onPress={() => setGameMode('couple')}
            activeOpacity={0.8}
          >
            <Users size={14} color={gameMode === 'couple' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[styles.modeTabText, gameMode === 'couple' && styles.modeTabTextActive]}
            >
              Couple Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'pass_and_play' && styles.modeTabActive]}
            onPress={() => setGameMode('pass_and_play')}
            activeOpacity={0.8}
          >
            <Smartphone size={14} color={gameMode === 'pass_and_play' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[styles.modeTabText, gameMode === 'pass_and_play' && styles.modeTabTextActive]}
            >
              Pass & Play
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Turn Banner / Status Alert */}
      <View style={styles.turnBannerContainer}>
        {isCheck && !winner ? (
          <View style={styles.checkAlertBanner}>
            <Sparkles size={16} color="#DC2626" />
            <Text style={styles.checkAlertText}>
              {turn === 'w' ? 'White King is in Check!' : 'Black King is in Check!'}
            </Text>
          </View>
        ) : gameMode === 'couple' ? (
          <View
            style={[
              styles.turnBadge,
              isMyTurn ? styles.turnBadgeMyTurn : styles.turnBadgeWaiting,
            ]}
          >
            <View
              style={[
                styles.turnDot,
                isMyTurn ? styles.turnDotActive : styles.turnDotInactive,
              ]}
            />
            <Text
              style={[
                styles.turnBadgeText,
                isMyTurn ? styles.turnBadgeTextActive : styles.turnBadgeTextInactive,
              ]}
            >
              {isMyTurn
                ? `Your Turn to Move (${myColor === 'w' ? 'White ♔' : 'Black ♚'})`
                : `Waiting for ${partnerPlayerName}'s move...`}
            </Text>
            {syncing && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
          </View>
        ) : (
          <View style={styles.turnBadge}>
            <Text style={styles.passPlayStatusText}>
              {turn === 'w'
                ? `📱 Pass phone to ${whitePlayerName} (White ♔)`
                : `📱 Pass phone to ${blackPlayerName} (Black ♚)`}
            </Text>
          </View>
        )}
      </View>

      {/* Temporary Feedback Hint Toast */}
      {feedbackHint && (
        <View style={styles.hintContainer}>
          <Info size={14} color="#EA580C" />
          <Text style={styles.hintText}>{feedbackHint}</Text>
        </View>
      )}

      {/* Top Player Bar & Captured Tray */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfoRow}>
          <View
            style={[
              styles.playerAvatar,
              turn === topPlayerColor && !winner && styles.playerAvatarActive,
            ]}
          >
            <Text style={styles.playerAvatarText}>
              {topPlayerColor === 'w' ? '❤️' : '💫'}
            </Text>
          </View>
          <View>
            <Text style={styles.playerName}>
              {topPlayerName} ({topPlayerColor === 'w' ? 'White' : 'Black'})
            </Text>
            <Text style={styles.playerStatus}>
              {winner
                ? winner === topPlayerColor
                  ? '👑 Winner'
                  : 'Defeated'
                : turn === topPlayerColor
                ? 'Thinking...'
                : 'Waiting'}
            </Text>
          </View>
        </View>
        <View style={styles.capturedTray}>
          {topPlayerCaptured.map((p, idx) => (
            <Text key={idx} style={styles.capturedPiece}>
              {PIECE_UNICODE[`${p.color}_${p.type}`]}
            </Text>
          ))}
        </View>
      </View>

      {/* Chess Board */}
      <View style={styles.boardWrapper}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {Array.from({ length: 8 }).map((_, displayRow) => {
            const actualRow = isFlipped ? 7 - displayRow : displayRow;

            return (
              <View key={displayRow} style={styles.boardRow}>
                {Array.from({ length: 8 }).map((_, displayCol) => {
                  const actualCol = isFlipped ? 7 - displayCol : displayCol;
                  const cell = board[actualRow][actualCol];

                  const isDark = (actualRow + actualCol) % 2 === 1;
                  const isSelected =
                    selectedPos?.row === actualRow && selectedPos?.col === actualCol;
                  const isLegal = legalMoves.some(
                    (m) => m.row === actualRow && m.col === actualCol
                  );
                  const isLastMoveSquare =
                    lastMove &&
                    ((lastMove.from.row === actualRow && lastMove.from.col === actualCol) ||
                      (lastMove.to.row === actualRow && lastMove.to.col === actualCol));

                  return (
                    <TouchableOpacity
                      key={displayCol}
                      style={[
                        styles.square,
                        {
                          width: SQUARE_SIZE,
                          height: SQUARE_SIZE,
                          backgroundColor: isSelected
                            ? '#FDE047' // Selected square highlight
                            : isLastMoveSquare
                            ? '#FEF08A' // Last move subtle highlight
                            : isDark
                            ? '#E8B4B8' // Soft rose-sand dark square
                            : '#FFF5F5', // Soft ivory light square
                        },
                      ]}
                      onPress={() => onSquarePress(displayRow, displayCol)}
                      activeOpacity={0.8}
                    >
                      {/* Legal move indicator dot / capture ring */}
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
            );
          })}
        </View>
      </View>

      {/* Bottom Player Bar & Captured Tray */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfoRow}>
          <View
            style={[
              styles.playerAvatar,
              turn === bottomPlayerColor && !winner && styles.playerAvatarActive,
            ]}
          >
            <Text style={styles.playerAvatarText}>
              {bottomPlayerColor === 'w' ? '❤️' : '💫'}
            </Text>
          </View>
          <View>
            <Text style={styles.playerName}>
              {bottomPlayerName} ({bottomPlayerColor === 'w' ? 'White' : 'Black'})
              {gameMode === 'couple' && bottomPlayerColor === myColor ? ' (You)' : ''}
            </Text>
            <Text style={styles.playerStatus}>
              {winner
                ? winner === bottomPlayerColor
                  ? '👑 Winner'
                  : 'Defeated'
                : turn === bottomPlayerColor
                ? 'Thinking...'
                : 'Waiting'}
            </Text>
          </View>
        </View>
        <View style={styles.capturedTray}>
          {bottomPlayerCaptured.map((p, idx) => (
            <Text key={idx} style={styles.capturedPiece}>
              {PIECE_UNICODE[`${p.color}_${p.type}`]}
            </Text>
          ))}
        </View>
      </View>

      {/* Victory & Romantic Forfeit Card */}
      {winner && (
        <View style={styles.victoryCard}>
          <View style={styles.victoryHeader}>
            <Crown size={24} color="#F59E0B" />
            <Text style={styles.victoryTitle}>
              {winner === 'draw'
                ? 'Game Drawn by Stalemate!'
                : `${
                    winner === 'w' ? whitePlayerName : blackPlayerName
                  } Wins by Checkmate!`}
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
                      winner === 'w' ? whitePlayerName : blackPlayerName
                    } won after ${moveCount} moves! 👑`
                  )
                }
              >
                <Share2 size={16} color={colors.textPrimary} />
                <Text style={styles.shareBtnText}>Share in Chat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.newGameBtn} onPress={() => resetMatch(true)}>
              <Text style={styles.newGameBtnText}>Rematch (Swap Sides)</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: 7,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
    padding: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  turnBannerContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  turnBadgeMyTurn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  turnBadgeWaiting: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  turnDotActive: {
    backgroundColor: '#10B981',
  },
  turnDotInactive: {
    backgroundColor: '#F59E0B',
  },
  turnBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  turnBadgeTextActive: {
    color: '#047857',
  },
  turnBadgeTextInactive: {
    color: '#B45309',
  },
  passPlayStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  checkAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  checkAlertText: {
    color: '#DC2626',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radii.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: '#B45309',
    fontWeight: typography.weights.medium,
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginVertical: 4,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 16,
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
