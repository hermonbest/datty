import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Heart,
  Zap,
  Users,
  Smartphone,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { useTicTacToe } from './useTicTacToe';
import { gameLog } from '../gameLogger';

const { width } = Dimensions.get('window');
const GRID_SIZE = Math.min(width - 48, 330);
const CELL_SIZE = GRID_SIZE / 3;

interface TicTacToeScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

export const TicTacToeScreen: React.FC<TicTacToeScreenProps> = ({ onBack, onShareToChat }) => {
  const insets = useSafeAreaInsets();
  const {
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
  } = useTicTacToe();

  const isXActive = turn === 'X' && !result.winner && !result.isDraw;
  const isOActive = turn === 'O' && !result.winner && !result.isDraw;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            gameLog('TicTacToe', 'NavigateBack');
            onBack();
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Love Tic-Tac-Toe</Text>
          <Text style={styles.headerSubtitle}>
            {gameMode === 'couple'
              ? `Online with ${partnerName}`
              : 'Pass & Play Battle'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleResetMatch} style={styles.resetBtn} activeOpacity={0.7}>
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Switcher Pill if linked */}
        {isLinked && (
        <View style={styles.modeBar}>
          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'couple' && styles.modeTabActive]}
            onPress={() => {
              gameLog('TicTacToe', 'SwitchMode', { mode: 'couple' });
              setGameMode('couple');
            }}
            activeOpacity={0.8}
          >
            <Users size={14} color={gameMode === 'couple' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, gameMode === 'couple' && styles.modeTabTextActive]}>
              Couple Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'pass_and_play' && styles.modeTabActive]}
            onPress={() => {
              gameLog('TicTacToe', 'SwitchMode', { mode: 'pass_and_play' });
              setGameMode('pass_and_play');
            }}
            activeOpacity={0.8}
          >
            <Smartphone size={14} color={gameMode === 'pass_and_play' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.modeTabText, gameMode === 'pass_and_play' && styles.modeTabTextActive]}>
              Pass & Play
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scoreboard Bar */}
      <View style={styles.scoreBar}>
        <View style={[styles.playerCard, isXActive && styles.playerCardActive]}>
          <Text style={styles.playerEmoji}>❤️</Text>
          <Text style={styles.playerTitle}>
            {userName} {gameMode === 'couple' && mySymbol === 'X' ? '(You)' : ''}
          </Text>
          <Text style={styles.playerScore}>{scores.X} wins</Text>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.drawsText}>{scores.draws} ties</Text>
        </View>

        <View style={[styles.playerCard, isOActive && styles.playerCardActive]}>
          <Text style={styles.playerEmoji}>💖</Text>
          <Text style={styles.playerTitle}>
            {partnerName} {gameMode === 'couple' && mySymbol === 'O' ? '(You)' : ''}
          </Text>
          <Text style={styles.playerScore}>{scores.O} wins</Text>
        </View>
      </View>

      {/* Turn or Result Callout */}
      <View style={styles.statusCallout}>
        {result.winner ? (
          <View style={styles.winnerCallout}>
            <Trophy size={18} color="#F59E0B" />
            <Text style={styles.winnerText}>
              {result.winner === 'X'
                ? `❤️ ${userName} won this round!`
                : `💖 ${partnerName} won this round!`}
            </Text>
          </View>
        ) : result.isDraw ? (
          <Text style={styles.statusText}>It's a Tie! Play again 💕</Text>
        ) : gameMode === 'couple' ? (
          <Text style={[styles.statusText, isMyTurn ? styles.statusTextMyTurn : styles.statusTextPartnerTurn]}>
            {isMyTurn
              ? '🎯 It’s your turn! Tap an empty square.'
              : `⏳ Waiting for ${turn === 'X' ? userName : partnerName} to make a move...`}
          </Text>
        ) : (
          <Text style={styles.statusText}>
            {turn === 'X'
              ? `📱 Pass phone to ${userName} (Hearts ❤️)`
              : `📱 Pass phone to ${partnerName} (Pink 💖)`}
          </Text>
        )}
      </View>

      {/* Tic-Tac-Toe 3x3 Grid */}
      <View style={styles.gridWrapper}>
        <View style={[styles.grid, { width: GRID_SIZE, height: GRID_SIZE }]}>
          {[0, 1, 2].map((rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {[0, 1, 2].map((colIdx) => {
                const idx = rowIdx * 3 + colIdx;
                const cell = board[idx];
                const isWinningCell = result.winningLine?.includes(idx);
                const isClickable = !cell && !result.winner && !result.isDraw && (gameMode === 'pass_and_play' || isMyTurn);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.cell,
                      colIdx < 2 && styles.cellBorderRight,
                      rowIdx < 2 && styles.cellBorderBottom,
                      isWinningCell && styles.winningCell,
                      !isClickable && !cell && styles.cellDisabled,
                    ]}
                    onPress={() => handleCellPress(idx)}
                    disabled={!isClickable && !cell}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellEmoji}>
                      {cell === 'X' ? '❤️' : cell === 'O' ? '💖' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Dares Card on Victory */}
      {result.winner && currentDare && (
        <View style={styles.dareBanner}>
          <View style={styles.dareHeaderRow}>
            <Sparkles size={16} color="#EA580C" />
            <Text style={styles.dareHeading}>Romantic Forfeit for Loser:</Text>
          </View>
          <Text style={styles.dareContent}>{currentDare}</Text>
        </View>
      )}

      {/* Actions */}
      {(result.winner || result.isDraw) && (
        <View style={styles.actionsRow}>
          {onShareToChat && (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => {
                gameLog('TicTacToe', 'ShareResultToChat', { scores, winner: result.winner });
                onShareToChat(
                  `⚔️ Love Tic-Tac-Toe match update: ${userName} (${scores.X}) vs ${partnerName} (${scores.O})! 💕`
                );
              }}
            >
              <Share2 size={16} color={colors.textPrimary} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextRoundBtn} onPress={handleNewRound}>
            <Text style={styles.nextRoundBtnText}>Next Round</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  playerCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 90,
  },
  playerCardActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
    ...shadows.glowRose,
  },
  playerEmoji: {
    fontSize: 22,
  },
  playerTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  playerScore: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.textMuted,
  },
  drawsText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusCallout: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statusTextMyTurn: {
    color: colors.primary,
  },
  statusTextPartnerTurn: {
    color: '#EA580C',
  },
  winnerCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  winnerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#B45309',
  },
  gridWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  grid: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cellBorderRight: {
    borderRightWidth: 1.5,
    borderRightColor: colors.borderLight,
  },
  cellBorderBottom: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight,
  },
  cellDisabled: {
    backgroundColor: '#FAFAFA',
  },
  winningCell: {
    backgroundColor: '#FFE4E6',
  },
  cellEmoji: {
    fontSize: 44,
  },
  dareBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  dareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dareHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#EA580C',
  },
  dareContent: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shareBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  nextRoundBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  nextRoundBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
