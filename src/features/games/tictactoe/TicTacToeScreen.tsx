import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Heart,
  Zap,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import {
  checkTicTacToeWinner,
  TicTacToeCell,
  TIC_TAC_TOE_DARES,
} from './ticTacToeLogic';

const { width } = Dimensions.get('window');
const GRID_SIZE = Math.min(width - 48, 330);
const CELL_SIZE = GRID_SIZE / 3;

interface TicTacToeScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

export const TicTacToeScreen: React.FC<TicTacToeScreenProps> = ({ onBack, onShareToChat }) => {
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [currentDare, setCurrentDare] = useState<string | null>(null);

  const result = checkTicTacToeWinner(board);

  const handleCellPress = (index: number) => {
    if (board[index] || result.winner || result.isDraw) return;

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);

    const nextResult = checkTicTacToeWinner(nextBoard);
    if (nextResult.winner) {
      setScores((s) => ({
        ...s,
        [nextResult.winner!]: s[nextResult.winner!] + 1,
      }));
      const randomDare =
        TIC_TAC_TOE_DARES[Math.floor(Math.random() * TIC_TAC_TOE_DARES.length)];
      setCurrentDare(randomDare);
    } else if (nextResult.isDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    } else {
      setTurn((t) => (t === 'X' ? 'O' : 'X'));
    }
  };

  const handleNewRound = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setCurrentDare(null);
  };

  const handleResetMatch = () => {
    handleNewRound();
    setScores({ X: 0, O: 0, draws: 0 });
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
          <Text style={styles.headerTitle}>Love Tic-Tac-Toe</Text>
          <Text style={styles.headerSubtitle}>Quick Couple Battle</Text>
        </View>
        <TouchableOpacity onPress={handleResetMatch} style={styles.resetBtn} activeOpacity={0.7}>
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Scoreboard Bar */}
      <View style={styles.scoreBar}>
        <View style={[styles.playerCard, turn === 'X' && !result.winner && styles.playerCardActive]}>
          <Text style={styles.playerEmoji}>❤️</Text>
          <Text style={styles.playerTitle}>You (Hearts)</Text>
          <Text style={styles.playerScore}>{scores.X} wins</Text>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.drawsText}>{scores.draws} ties</Text>
        </View>

        <View style={[styles.playerCard, turn === 'O' && !result.winner && styles.playerCardActive]}>
          <Text style={styles.playerEmoji}>💖</Text>
          <Text style={styles.playerTitle}>Partner (Pink)</Text>
          <Text style={styles.playerScore}>{scores.O} wins</Text>
        </View>
      </View>

      {/* Turn or Result Callout */}
      <View style={styles.statusCallout}>
        {result.winner ? (
          <View style={styles.winnerCallout}>
            <Trophy size={18} color="#F59E0B" />
            <Text style={styles.winnerText}>
              {result.winner === 'X' ? '❤️ You won this round!' : '💖 Partner won this round!'}
            </Text>
          </View>
        ) : result.isDraw ? (
          <Text style={styles.statusText}>It's a Tie! Play again 💕</Text>
        ) : (
          <Text style={styles.statusText}>
            {turn === 'X' ? '❤️ Your turn to place a heart!' : "💖 Partner's turn!"}
          </Text>
        )}
      </View>

      {/* Tic-Tac-Toe 3x3 Grid */}
      <View style={styles.gridWrapper}>
        <View style={[styles.grid, { width: GRID_SIZE, height: GRID_SIZE }]}>
          {board.map((cell, idx) => {
            const isWinningCell = result.winningLine?.includes(idx);

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.cell,
                  { width: CELL_SIZE, height: CELL_SIZE },
                  isWinningCell && styles.winningCell,
                ]}
                onPress={() => handleCellPress(idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.cellEmoji}>
                  {cell === 'X' ? '❤️' : cell === 'O' ? '💖' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Dares Card on Victory */}
      {result.winner && currentDare && (
        <View style={styles.dareBanner}>
          <Text style={styles.dareHeading}>Romantic Forfeit for Loser:</Text>
          <Text style={styles.dareContent}>{currentDare}</Text>
        </View>
      )}

      {/* Actions */}
      {(result.winner || result.isDraw) && (
        <View style={styles.actionsRow}>
          {onShareToChat && (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() =>
                onShareToChat(
                  `⚔️ Love Tic-Tac-Toe match update: You (${scores.X}) vs Partner (${scores.O})! 💕`
                )
              }
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
  },
  playerCardActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  playerEmoji: {
    fontSize: 22,
  },
  playerTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
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
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
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
  dareHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#EA580C',
    marginBottom: 2,
  },
  dareContent: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
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
