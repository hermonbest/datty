import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Flame,
  Heart,
  Sparkles,
  Laugh,
  RotateCcw,
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
    canPickCard,
    phase,
    completedCount,
    gameMode,
    setGameMode,
    isLinked,
    userName,
    partnerName,
    currentAnswer,
    pickPrompt,
    rerollPrompt,
    submitAnswer,
    completeChallenge,
  } = useTruthOrDare();

  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);

  const showHint = (msg: string) => {
    setFeedbackHint(msg);
    setTimeout(() => {
      setFeedbackHint((c) => (c === msg ? null : c));
    }, 2800);
  };

  const cardScale = useRef(new Animated.Value(1)).current;
  const lastPromptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedPrompt && selectedPrompt.id !== lastPromptIdRef.current) {
      lastPromptIdRef.current = selectedPrompt.id;
      const cardTimer = startGameTimer('TruthOrDare', 'CardRevealAnimation', {
        promptId: selectedPrompt.id,
        type: selectedPrompt.type,
      });

      cardScale.setValue(0.85);
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start(() => cardTimer.stop());
    } else if (!selectedPrompt) {
      lastPromptIdRef.current = null;
      cardScale.setValue(1);
    }
  }, [selectedPrompt]);

  const handleCardPress = (type: PromptType) => {
    if (gameMode === 'couple' && !isMyTurn) {
      showHint(`⏳ It's ${activePlayerName}'s turn! Waiting for them to pick.`);
      return;
    }
    pickPrompt(type);
  };

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
              ? `Online with ${partnerName} • Round ${completedCount + 1}`
              : `Pass & Play • Round ${completedCount + 1}`}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={styles.streakText}>{completedCount}</Text>
        </View>
      </View>

      {/* Mode Switcher */}
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

        {/* Turn Indicator Spotlight */}
        <View style={styles.turnCard}>
          <View style={[styles.playerTurnRow, phase !== 'choose_card' && { marginBottom: 0 }]}>
            <View
              style={[
                styles.playerBadge,
                activePlayerName === userName && styles.playerBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.playerBadgeText,
                  activePlayerName === userName && styles.playerBadgeTextActive,
                ]}
              >
                ❤️ {userName}
              </Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View
              style={[
                styles.playerBadge,
                activePlayerName === partnerName && styles.playerBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.playerBadgeText,
                  activePlayerName === partnerName && styles.playerBadgeTextActive,
                ]}
              >
                💫 {partnerName}
              </Text>
            </View>
          </View>

          {phase === 'choose_card' && (
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
                    ? '🎯 Your turn! Pick Truth or Dare below.'
                    : `⏳ It's ${partnerName}'s turn to pick a card...`
                  : `🎯 Pass phone to ${activePlayerName} to pick a card!`}
              </Text>
            </View>
          )}
        </View>

        {/* Pick Prompt Action Cards */}
        {phase === 'choose_card' ? (
          <View style={styles.pickSection}>
            <View style={styles.pickHeaderRow}>
              <Text style={styles.pickTitle}>
                {`${activePlayerName}'s Turn: Choose a Card`}
              </Text>
              {!canPickCard && (
                <View style={styles.lockedNoticeBadge}>
                  <Lock size={12} color={colors.textMuted} />
                  <Text style={styles.lockedNoticeText}>{`Waiting for ${activePlayerName}`}</Text>
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
                disabled={!canPickCard}
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
                disabled={!canPickCard}
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

              {/* Answer field — only for truth prompts */}
              {selectedPrompt.type === 'truth' && (
                <View style={styles.answerSection}>
                  {isMyTurn ? (
                    <TextInput
                      style={styles.answerInput}
                      placeholder="Type your answer here..."
                      placeholderTextColor={colors.textMuted}
                      value={currentAnswer}
                      onChangeText={submitAnswer}
                      multiline
                      maxLength={300}
                    />
                  ) : currentAnswer ? (
                    <View style={styles.answerReadOnly}>
                      <Text style={styles.answerReadOnlyLabel}>✍️ {activePlayerName}'s answer:</Text>
                      <Text style={styles.answerReadOnlyText}>{currentAnswer}</Text>
                    </View>
                  ) : (
                    <Text style={styles.answerWaiting}>⏳ Waiting for {activePlayerName} to answer...</Text>
                  )}
                </View>
              )}
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

              {/* Re-roll Prompt Button */}
              <TouchableOpacity
                style={[
                  styles.actionRerollBtn,
                  gameMode === 'couple' && !isMyTurn && styles.actionBtnDisabled,
                ]}
                onPress={rerollPrompt}
                disabled={gameMode === 'couple' && !isMyTurn}
                activeOpacity={0.7}
              >
                <RotateCcw
                  size={16}
                  color={gameMode === 'couple' && !isMyTurn ? colors.textMuted : colors.primary}
                />
                <Text
                  style={[
                    styles.actionRerollBtnText,
                    gameMode === 'couple' && !isMyTurn && { color: colors.textMuted },
                  ]}
                >
                  Re-roll
                </Text>
              </TouchableOpacity>

              {/* Done / Next Turn Button */}
              <TouchableOpacity
                style={[
                  styles.actionDoneBtn,
                  gameMode === 'couple' && !isMyTurn && styles.actionDoneBtnDisabled,
                ]}
                onPress={completeChallenge}
                disabled={gameMode === 'couple' && !isMyTurn}
                activeOpacity={0.85}
              >
                <CheckCircle2
                  size={18}
                  color={gameMode === 'couple' && !isMyTurn ? colors.textMuted : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.actionDoneBtnText,
                    gameMode === 'couple' && !isMyTurn && { color: colors.textMuted },
                  ]}
                >
                  {gameMode === 'couple' && !isMyTurn
                    ? `Waiting for ${activePlayerName}...`
                    : 'Done — Next Turn'}
                </Text>
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  playerTurnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.sm,
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
  guidanceRowActive: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  guidanceRowWaiting: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
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
    marginBottom: spacing.sm,
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
  actionRerollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primarySubtle,
    backgroundColor: colors.primaryLight,
  },
  actionRerollBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  actionBtnDisabled: {
    opacity: 0.5,
    borderColor: colors.borderLight,
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
  actionDoneBtnDisabled: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  answerSection: {
    marginTop: spacing.sm,
    width: '100%',
  },
  answerInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  answerReadOnly: {
    backgroundColor: '#EFF6FF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: spacing.sm,
  },
  answerReadOnlyLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#2563EB',
    marginBottom: 4,
  },
  answerReadOnlyText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  answerWaiting: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
});
