import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Gamepad2,
  Flame,
  HelpCircle,
  Zap,
  Crown,
  Type,
  Heart,
  Sparkles,
  ChevronRight,
  Trophy,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { GameId } from '../../types/games';
import { TruthOrDareScreen } from './truthOrDare/TruthOrDareScreen';
import { WordGameScreen } from './word/WordGameScreen';
import { ChessGameScreen } from './chess/ChessGameScreen';
import { CoupleTriviaScreen } from './trivia/CoupleTriviaScreen';
import { TicTacToeScreen } from './tictactoe/TicTacToeScreen';

interface GamesScreenProps {
  onNavigateToChat?: (replyTo?: any) => void;
}

interface GameCardConfig {
  id: GameId;
  title: string;
  subtitle: string;
  tagline: string;
  tag: string;
  tagColor: string;
  icon: any;
  accentColor: string;
  bgLight: string;
}

const GAMES: GameCardConfig[] = [
  {
    id: 'truth_or_dare',
    title: 'Truth or Dare',
    subtitle: 'Romantic, Spicy & Playful prompts with animated bottle spin',
    tagline: 'Pass & Play • Spicy',
    tag: 'Popular',
    tagColor: '#EA580C',
    icon: Flame,
    accentColor: '#E11D48',
    bgLight: '#FFE4E6',
  },
  {
    id: 'word_guess',
    title: 'Couple Wordle',
    subtitle: 'Daily 5-letter romantic word puzzle & partner custom challenges',
    tagline: 'Daily • Brain Teaser',
    tag: 'Daily Puzzle',
    tagColor: '#16A34A',
    icon: Type,
    accentColor: '#16A34A',
    bgLight: '#DCFCE7',
  },
  {
    id: 'chess',
    title: 'Couple Chess',
    subtitle: 'Classic 8x8 chess match with romantic forfeits for the loser',
    tagline: 'Strategy • Turn-Based',
    tag: 'Classic',
    tagColor: '#8B5CF6',
    icon: Crown,
    accentColor: '#BE123C',
    bgLight: '#FFF1F2',
  },
  {
    id: 'couple_trivia',
    title: 'Who Knows Who Best?',
    subtitle: '10-question compatibility quiz testing your relationship memory',
    tagline: 'Quiz • 2 Players',
    tag: 'Compatibility',
    tagColor: '#D97706',
    icon: Trophy,
    accentColor: '#F59E0B',
    bgLight: '#FEF3C7',
  },
  {
    id: 'tic_tac_toe',
    title: 'Love Tic-Tac-Toe',
    subtitle: 'Fast romantic 3-in-a-row mini-battles with fun dare rewards',
    tagline: 'Quick Match • Forfeits',
    tag: 'Fast Pace',
    tagColor: '#2563EB',
    icon: Heart,
    accentColor: '#E11D48',
    bgLight: '#FFE4E6',
  },
];

export const GamesScreen: React.FC<GamesScreenProps> = ({ onNavigateToChat }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const handleShareToChat = (text: string) => {
    if (onNavigateToChat) {
      onNavigateToChat({
        type: 'message',
        text,
      });
    }
  };

  if (activeGame === 'truth_or_dare') {
    return (
      <TruthOrDareScreen
        onBack={() => setActiveGame(null)}
        onShareToChat={handleShareToChat}
      />
    );
  }

  if (activeGame === 'word_guess') {
    return (
      <WordGameScreen
        onBack={() => setActiveGame(null)}
        onShareToChat={handleShareToChat}
      />
    );
  }

  if (activeGame === 'chess') {
    return (
      <ChessGameScreen
        onBack={() => setActiveGame(null)}
        onShareToChat={handleShareToChat}
      />
    );
  }

  if (activeGame === 'couple_trivia') {
    return (
      <CoupleTriviaScreen
        onBack={() => setActiveGame(null)}
        onShareToChat={handleShareToChat}
      />
    );
  }

  if (activeGame === 'tic_tac_toe') {
    return (
      <TicTacToeScreen
        onBack={() => setActiveGame(null)}
        onShareToChat={handleShareToChat}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Couple Games</Text>
          <Text style={styles.headerSubtitle}>Play, laugh & connect together</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Gamepad2 size={24} color={colors.primary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTextContainer}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>Date Night Ready</Text>
            </View>
            <Text style={styles.heroTitle}>Spice Up Your Time</Text>
            <Text style={styles.heroDesc}>
              Choose from interactive couple games designed for laughs, romance, and closeness.
            </Text>
          </View>
        </View>

        {/* Game Cards List */}
        <Text style={styles.sectionTitle}>Featured Games</Text>

        <View style={styles.cardsList}>
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => setActiveGame(game.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.gameIconBg, { backgroundColor: game.bgLight }]}>
                  <Icon size={26} color={game.accentColor} />
                </View>

                <View style={styles.gameInfo}>
                  <View style={styles.gameTitleRow}>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <View style={[styles.tagBadge, { backgroundColor: game.bgLight }]}>
                      <Text style={[styles.tagText, { color: game.tagColor }]}>
                        {game.tag}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.gameSubtitle} numberOfLines={2}>
                    {game.subtitle}
                  </Text>
                  <Text style={styles.gameTagline}>{game.tagline}</Text>
                </View>

                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.glowRose,
  },
  heroGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroTextContainer: {
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardsList: {
    gap: spacing.sm,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  gameIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingRight: spacing.xs,
  },
  gameTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  gameSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  gameTagline: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: 4,
  },
});
