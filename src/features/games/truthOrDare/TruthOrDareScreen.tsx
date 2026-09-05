import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Lock,
  Users,
  Smartphone,
  Info,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { TruthOrDareCategory, PromptType } from '../../../types/games';
import { useTruthOrDare } from './useTruthOrDare';
import { gameLog, startGameTimer } from '../gameLogger';

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
  const insets = useSafeAreaInsets();
  const {
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
  } = useTruthOrDare();

  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);

  const showHint = (msg: string) => {
    setFeedbackHint(msg);
    setTimeout(() => {
      setFeedbackHint((c) => (c === msg ? null : c));
    }, 2800);
  };

  // Animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const lastAnimatedAngleRef = useRef<number>(0);
  const lastPromptIdRef = useRef<string | null>(null);

  // React to targetAngle changes from local spin or remote Firestore update
  useEffect(() => {
    if (targetAngle > 0 && targetAngle !== lastAnimatedAngleRef.current) {
      lastAnimatedAngleRef.current = targetAngle;
      const animTimer = startGameTimer('TruthOrDare', 'BottleSpinAnimation', {
        targetAngle,
        duration: 2600,
      });

      Animated.timing(spinAnim, {
        toValue: targetAngle,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        animTimer.stop({ finalAngle: targetAngle });
        onSpinAnimationComplete();
      });
    }
  }, [targetAngle, onSpinAnimationComplete]);

  // Animate card reveal ONLY when a distinct new prompt ID is received
  useEffect(() => {
    if (selectedPrompt && selectedPrompt.id !== lastPromptIdRef.current) {
      lastPromptIdRef.current = selectedPrompt.id;
      const cardTimer = startGameTimer('TruthOrDare', 'CardRevealAnimation', {
        promptId: selectedPrompt.id,
        type: selectedPrompt.type,
      });

      cardScale.setValue(0.8);
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start(() => {
        cardTimer.stop();
      });
    } else if (!selectedPrompt) {
      lastPromptIdRef.current = null;
      cardScale.setValue(1);
    }
  }, [selectedPrompt]);

  const handleCardPress = (type: PromptType) => {
    const pressTimer = startGameTimer('TruthOrDare', 'CardPress', { type, phase, isMyTurn });
    if (phase === 'need_spin') {
      showHint('🔄 Please spin the bottle first to choose whose turn it is!');
      pressTimer.stop({ rejected: 'Need spin' });
      return;
    }
    if (gameMode === 'couple' && !isMyTurn) {
      showHint(`⏳ It's ${activePlayerName}'s turn! Waiting for them to pick.`);
      pressTimer.stop({ rejected: 'Waiting for partner turn' });
      return;
    }
    pressTimer.stop({ action: 'Proceed with pick' });
    pickPrompt(type);
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
        <TouchableOpacity
          onPress={() => {
            gameLog('TruthOrDare', 'NavigateBack');
            onBack();
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Truth or Dare</Text>
          <Text style={styles.headerSubtitle}>
            {gameMode === 'couple'
              ? `Online with ${partnerName} • ${completedCount} rounds`
              : `Pass & Play • ${completedCount} rounds`}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={styles.streakText}>{completedCount}</Text>
        </View>
      </View>

      {/* Mode Switcher Pill if linked */}
      {isLinked && (
        <View style={styles.modeBar}>
          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'couple' && styles.modeTabActive]}
            onPress={() => {
              gameLog('TruthOrDare', 'SwitchMode', { mode: 'couple' });
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
              gameLog('TruthOrDare', 'SwitchMode', { mode: 'pass_and_play' });
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
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
                onPress={() => setCategory(cat.id)}
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

        {/* Temporary Feedback Hint Toast */}
        {feedbackHint && (
          <View style={styles.hintContainer}>
            <Info size={14} color="#EA580C" />
            <Text style={styles.hintText}>{feedbackHint}</Text>
          </View>
        )}

        {/* Turn Indicator & Bottle Spinner */}
        <View style={styles.turnCard}>
          {/* Players Row */}
          <View style={styles.playerTurnRow}>
            <View
              style={[
                styles.playerBadge,
                activePlayerName === userName && phase !== 'need_spin' && styles.playerBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.playerBadgeText,
                  activePlayerName === userName && phase !== 'need_spin' && styles.playerBadgeTextActive,
                ]}
              >
                ❤️ {userName}
              </Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View
              style={[
                styles.playerBadge,
                activePlayerName === partnerName && phase !== 'need_spin' && styles.playerBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.playerBadgeText,
                  activePlayerName === partnerName && phase !== 'need_spin' && styles.playerBadgeTextActive,
                ]}
              >
                💫 {partnerName}
              </Text>
            </View>
          </View>

          {/* Bottle Arena */}
          <View style={styles.bottleArena}>
            <View style={styles.arenaGlow} />

            {/* Direction Indicators */}
            <View style={[styles.indicatorPill, styles.indicatorTop]}>
              <Text style={styles.indicatorText}>❤️ {userName}</Text>
            </View>
            <View style={[styles.indicatorPill, styles.indicatorBottom]}>
              <Text style={styles.indicatorText}>💫 {partnerName}</Text>
            </View>

            {/* Animated Bottle */}
            <Animated.View
              style={[
                styles.bottleContainer,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <View style={styles.bottleCap} />
              <View style={styles.bottleNeck} />
              <View style={styles.bottleBody}>
                <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </Animated.View>
          </View>

          {/* Spin Trigger Button */}
          <TouchableOpacity
            style={[
              styles.spinButton,
              phase === 'spinning' && styles.spinButtonDisabled,
              phase === 'need_spin' && styles.spinButtonGlow,
            ]}
            onPress={spinBottle}
            disabled={phase === 'spinning'}
            activeOpacity={0.8}
          >
            <RotateCw size={18} color="#FFFFFF" />
            <Text style={styles.spinButtonText}>
              {phase === 'spinning'
                ? 'Spinning Bottle...'
                : phase === 'need_spin'
                ? 'Spin the Bottle for Turn'
                : 'Re-Spin Bottle'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Turn Guidance Callout */}
        <View style={styles.phaseGuidanceCard}>
          {phase === 'need_spin' ? (
            <View style={styles.guidanceRow}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.guidanceText}>
                Spin the bottle above to choose who takes the challenge!
              </Text>
            </View>
          ) : phase === 'spinning' ? (
            <View style={styles.guidanceRow}>
              <RotateCw size={16} color={colors.primary} />
              <Text style={styles.guidanceText}>The bottle is spinning...</Text>
            </View>
          ) : phase === 'choose_card' ? (
            <View
              style={[
                styles.guidanceRowActive,
                gameMode === 'couple' && !isMyTurn ? styles.guidanceRowWaiting : null,
              ]}
            >
              <Text
                style={[
                  styles.guidanceTextActive,
                  gameMode === 'couple' && !isMyTurn ? styles.guidanceTextWaiting : null,
                ]}
              >
                {gameMode === 'couple'
                  ? isMyTurn
                    ? `🎯 Bottle landed on YOU! Tap Truth or Dare below to choose your challenge.`
                    : `⏳ Bottle landed on ${partnerName}! Waiting for them to pick a card...`
                  : `🎯 Bottle landed on ${activePlayerName}! Pass phone to ${activePlayerName} to pick a card.`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pick Prompt Action Cards */}
        {phase !== 'prompt_revealed' ? (
          <View style={styles.pickSection}>
            <View style={styles.pickHeaderRow}>
              <Text style={styles.pickTitle}>
                {phase === 'choose_card'
                  ? `${activePlayerName}'s Turn: Choose a Card`
                  : 'Truth or Dare Cards'}
              </Text>
              {!canPickCard && (
                <View style={styles.lockedNoticeBadge}>
                  <Lock size={12} color={colors.textMuted} />
                  <Text style={styles.lockedNoticeText}>
                    {phase === 'need_spin'
                      ? 'Locked until spin'
                      : `Waiting for ${activePlayerName}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.pickRow}>
              {/* Truth Card */}
              <TouchableOpacity
                style={[
                  styles.choiceCard,
                  styles.truthCard,
                  !canPickCard && styles.choiceCardDisabled,
                ]}
                onPress={() => handleCardPress('truth')}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.choiceIconBgTruth,
                    !canPickCard && styles.choiceIconBgDisabled,
                  ]}
                >
                  {!canPickCard ? (
                    <Lock size={24} color={colors.textMuted} />
                  ) : (
                    <HelpCircle size={28} color="#2563EB" />
                  )}
                </View>
                <Text
                  style={[
                    styles.choiceCardTitle,
                    !canPickCard && styles.choiceTextDisabled,
                  ]}
                >
                  TRUTH
                </Text>
                <Text style={styles.choiceCardSub}>Reveal a secret or honest feeling</Text>
              </TouchableOpacity>

              {/* Dare Card */}
              <TouchableOpacity
                style={[
                  styles.choiceCard,
                  styles.dareCard,
                  !canPickCard && styles.choiceCardDisabled,
                ]}
                onPress={() => handleCardPress('dare')}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.choiceIconBgDare,
                    !canPickCard && styles.choiceIconBgDisabled,
                  ]}
                >
                  {!canPickCard ? (
                    <Lock size={24} color={colors.textMuted} />
                  ) : (
                    <Zap size={28} color="#EA580C" />
                  )}
                </View>
                <Text
                  style={[
                    styles.choiceCardTitle,
                    !canPickCard && styles.choiceTextDisabled,
                  ]}
                >
                  DARE
                </Text>
                <Text style={styles.choiceCardSub}>Take on a romantic challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : selectedPrompt ? (
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
                  <Flame
                    key={i}
                    size={14}
                    color={activeCategoryMeta.color}
                    fill={activeCategoryMeta.color}
                  />
                ))}
              </View>
            </View>

            <View style={styles.revealedBody}>
              <Text style={styles.revealedPlayerHeader}>
                🎯 {activePlayerName}'s Challenge:
              </Text>
              <Text style={styles.revealedPromptText}>{selectedPrompt.text}</Text>
            </View>

            <View style={styles.cardActionsRow}>
              {onShareToChat && (
                <TouchableOpacity
                  style={styles.actionShareBtn}
                  onPress={() => {
                    gameLog('TruthOrDare', 'SharePromptToChat', {
                      player: activePlayerName,
                      prompt: selectedPrompt.text,
                    });
                    onShareToChat(
                      `🔥 Truth or Dare prompt for ${activePlayerName}: "${selectedPrompt.text}"`
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Share2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionDoneBtn}
                onPress={completeChallenge}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={20} color="#FFFFFF" />
                <Text style={styles.actionDoneBtnText}>Completed & Next Spin</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : null}
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
  scrollContent: {
    flexGrow: 1,
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: '#B45309',
    fontWeight: typography.weights.medium,
  },
  turnCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
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
    marginBottom: spacing.xs,
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
    ...shadows.glowRose,
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
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  arenaGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primarySubtle,
  },
  indicatorPill: {
    position: 'absolute',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 1,
  },
  indicatorTop: {
    top: 6,
  },
  indicatorBottom: {
    bottom: 6,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  bottleContainer: {
    width: 32,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  bottleCap: {
    width: 10,
    height: 10,
    backgroundColor: '#881337',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  bottleNeck: {
    width: 12,
    height: 22,
    backgroundColor: '#BE123C',
  },
  bottleBody: {
    width: 32,
    height: 78,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  spinButtonGlow: {
    ...shadows.glowRose,
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  phaseGuidanceCard: {
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guidanceRowActive: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  guidanceRowWaiting: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  guidanceText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  guidanceTextActive: {
    fontSize: typography.sizes.xs,
    color: '#B45309',
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
  guidanceTextWaiting: {
    color: '#EA580C',
  },
  pickSection: {
    marginTop: spacing.xs,
  },
  pickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  pickTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  lockedNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  lockedNoticeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
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
  choiceCardDisabled: {
    opacity: 0.55,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
    elevation: 0,
    shadowOpacity: 0,
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
  choiceIconBgDisabled: {
    backgroundColor: colors.borderLight,
  },
  choiceCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  choiceTextDisabled: {
    color: colors.textMuted,
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
    marginTop: spacing.xs,
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
