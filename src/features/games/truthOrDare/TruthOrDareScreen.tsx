import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Flame,
  Heart,
  Sparkles,
  Laugh,
  RotateCw,
  HelpCircle,
  Zap,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { TruthOrDareCategory, PromptType, TruthOrDareItem } from '../../../types/games';
import { TRUTH_OR_DARE_DATA, getRandomPrompt } from './truthOrDareData';

const { width } = Dimensions.get('window');

interface TruthOrDareScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

const CATEGORIES: { id: TruthOrDareCategory; label: string; icon: any; color: string; bg: string }[] = [
  { id: 'romantic', label: 'Romantic', icon: Heart, color: '#E11D48', bg: '#FFE4E6' },
  { id: 'spicy', label: 'Spicy', icon: Flame, color: '#EA580C', bg: '#FFEDD5' },
  { id: 'deep', label: 'Deep', icon: Sparkles, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'fun', label: 'Playful', icon: Laugh, color: '#059669', bg: '#D1FAE5' },
];

export const TruthOrDareScreen: React.FC<TruthOrDareScreenProps> = ({ onBack, onShareToChat }) => {
  const [category, setCategory] = useState<TruthOrDareCategory>('romantic');
  const [selectedPrompt, setSelectedPrompt] = useState<TruthOrDareItem | null>(null);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [activePlayer, setActivePlayer] = useState<'You' | 'Partner'>('You');
  const [isSpinning, setIsSpinning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const currentAngle = useRef(0);

  const handleSpinBottle = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedPrompt(null);

    // Random rotations between 4 to 8 full spins + random offset
    const randomExtra = Math.random() * 360;
    const spins = 4 + Math.floor(Math.random() * 4);
    const targetAngle = currentAngle.current + spins * 360 + randomExtra;

    Animated.timing(spinAnim, {
      toValue: targetAngle,
      duration: 2500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentAngle.current = targetAngle;
      setIsSpinning(false);
      // Normalized angle determines player
      const normalized = (targetAngle % 360 + 360) % 360;
      const chosenPlayer = normalized >= 90 && normalized < 270 ? 'Partner' : 'You';
      setActivePlayer(chosenPlayer);
    });
  };

  const handlePickPrompt = (type: PromptType) => {
    const prompt = getRandomPrompt(category, type, usedIds);
    setUsedIds((prev) => [...prev, prompt.id]);

    // Animate card entrance
    cardScale.setValue(0.8);
    setSelectedPrompt(prompt);
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleComplete = () => {
    setCompletedCount((c) => c + 1);
    setSelectedPrompt(null);
    setActivePlayer((p) => (p === 'You' ? 'Partner' : 'You'));
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Truth or Dare</Text>
          <Text style={styles.headerSubtitle}>Couple Edition • {completedCount} completed</Text>
        </View>
        <View style={styles.streakBadge}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={styles.streakText}>{completedCount}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Selector */}
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  setSelectedPrompt(null);
                }}
                activeOpacity={0.7}
              >
                <Icon size={16} color={isSelected ? '#FFFFFF' : cat.color} />
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Turn Indicator & Bottle Spinner */}
        <View style={styles.turnCard}>
          <View style={styles.playerTurnRow}>
            <View style={[styles.playerBadge, activePlayer === 'You' && styles.playerBadgeActive]}>
              <Text style={[styles.playerBadgeText, activePlayer === 'You' && styles.playerBadgeTextActive]}>
                ❤️ You
              </Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={[styles.playerBadge, activePlayer === 'Partner' && styles.playerBadgeActive]}>
              <Text style={[styles.playerBadgeText, activePlayer === 'Partner' && styles.playerBadgeTextActive]}>
                💫 Partner
              </Text>
            </View>
          </View>

          {/* Bottle Arena */}
          <View style={styles.bottleArena}>
            <View style={styles.arenaGlow} />
            <Animated.View
              style={[
                styles.bottleContainer,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <View style={styles.bottleTop} />
              <View style={styles.bottleBody}>
                <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
            onPress={handleSpinBottle}
            disabled={isSpinning}
            activeOpacity={0.8}
          >
            <RotateCw size={18} color="#FFFFFF" />
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'Spinning...' : 'Spin the Bottle for Turn'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pick Prompt Action Cards */}
        {!selectedPrompt ? (
          <View style={styles.pickSection}>
            <Text style={styles.pickTitle}>
              {activePlayer === 'You' ? 'Your turn!' : "Partner's turn!"} Choose a card:
            </Text>
            <View style={styles.pickRow}>
              {/* Truth Card */}
              <TouchableOpacity
                style={[styles.choiceCard, styles.truthCard]}
                onPress={() => handlePickPrompt('truth')}
                activeOpacity={0.85}
              >
                <View style={styles.choiceIconBgTruth}>
                  <HelpCircle size={28} color="#2563EB" />
                </View>
                <Text style={styles.choiceCardTitle}>TRUTH</Text>
                <Text style={styles.choiceCardSub}>Reveal a secret or feeling</Text>
              </TouchableOpacity>

              {/* Dare Card */}
              <TouchableOpacity
                style={[styles.choiceCard, styles.dareCard]}
                onPress={() => handlePickPrompt('dare')}
                activeOpacity={0.85}
              >
                <View style={styles.choiceIconBgDare}>
                  <Zap size={28} color="#EA580C" />
                </View>
                <Text style={styles.choiceCardTitle}>DARE</Text>
                <Text style={styles.choiceCardSub}>Take on a romantic action</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Revealed Prompt Card */
          <Animated.View style={[styles.revealedCard, { transform: [{ scale: cardScale }] }]}>
            <View
              style={[
                styles.revealedHeader,
                { backgroundColor: selectedPrompt.type === 'truth' ? '#EFF6FF' : '#FFF7ED' },
              ]}
            >
              <View style={styles.revealedTypeBadge}>
                {selectedPrompt.type === 'truth' ? (
                  <HelpCircle size={16} color="#2563EB" />
                ) : (
                  <Zap size={16} color="#EA580C" />
                )}
                <Text
                  style={[
                    styles.revealedTypeText,
                    { color: selectedPrompt.type === 'truth' ? '#2563EB' : '#EA580C' },
                  ]}
                >
                  {selectedPrompt.type.toUpperCase()} • {activeCategoryMeta.label}
                </Text>
              </View>

              <View style={styles.intensityRow}>
                {Array.from({ length: selectedPrompt.intensity }).map((_, i) => (
                  <Flame key={i} size={14} color={activeCategoryMeta.color} fill={activeCategoryMeta.color} />
                ))}
              </View>
            </View>

            <View style={styles.revealedBody}>
              <Text style={styles.revealedPlayerHeader}>
                {activePlayer === 'You' ? '❤️ Your Challenge:' : "💫 Partner's Challenge:"}
              </Text>
              <Text style={styles.revealedPromptText}>{selectedPrompt.text}</Text>
            </View>

            <View style={styles.cardActionsRow}>
              {onShareToChat && (
                <TouchableOpacity
                  style={styles.actionShareBtn}
                  onPress={() => onShareToChat(selectedPrompt.text)}
                  activeOpacity={0.7}
                >
                  <Share2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionDoneBtn}
                onPress={handleComplete}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={20} color="#FFFFFF" />
                <Text style={styles.actionDoneBtnText}>Completed & Next</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    borderRadius: radii.full,
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  streakText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 6,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
    ...shadows.sm,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  turnCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  playerTurnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  playerBadge: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  playerBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  playerBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  playerBadgeTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  vsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.textMuted,
  },
  bottleArena: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    position: 'relative',
  },
  arenaGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primarySubtle,
  },
  bottleContainer: {
    width: 28,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottleTop: {
    width: 8,
    height: 20,
    backgroundColor: '#881337',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  bottleBody: {
    width: 28,
    height: 70,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  pickSection: {
    marginTop: spacing.sm,
  },
  pickTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.md,
  },
  truthCard: {
    borderColor: '#BFDBFE',
  },
  dareCard: {
    borderColor: '#FED7AA',
  },
  choiceIconBgTruth: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  choiceIconBgDare: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  choiceCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  choiceCardSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  revealedCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...shadows.lg,
  },
  revealedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  revealedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealedTypeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 2,
  },
  revealedBody: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  revealedPlayerHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  revealedPromptText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  cardActionsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  actionShareBtn: {
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  actionDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  actionDoneBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
