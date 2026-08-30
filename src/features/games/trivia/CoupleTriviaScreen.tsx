import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  Share2,
  RotateCcw,
  HeartHandshake,
  Compass,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { TRIVIA_PACKS, TriviaPack, TriviaQuestion } from './triviaData';

interface CoupleTriviaScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

export const CoupleTriviaScreen: React.FC<CoupleTriviaScreenProps> = ({ onBack, onShareToChat }) => {
  const [selectedPack, setSelectedPack] = useState<TriviaPack>(TRIVIA_PACKS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<'guess' | 'reveal' | 'finished'>('guess');
  const [player1Guess, setPlayer1Guess] = useState<string | null>(null);
  const [player2Actual, setPlayer2Actual] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundResults, setRoundResults] = useState<{
    q: TriviaQuestion;
    guess: string;
    actual: string;
    matched: boolean;
  }[]>([]);

  const currentQ = selectedPack.questions[currentIndex];

  const handleSelectGuess = (option: string) => {
    setPlayer1Guess(option);
    setStep('reveal');
  };

  const handleSelectActual = (option: string) => {
    setPlayer2Actual(option);
    const isMatched = player1Guess === option;
    if (isMatched) {
      setScore((s) => s + 1);
    }
    setRoundResults((prev) => [
      ...prev,
      {
        q: currentQ,
        guess: player1Guess!,
        actual: option,
        matched: isMatched,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < selectedPack.questions.length) {
      setCurrentIndex((i) => i + 1);
      setPlayer1Guess(null);
      setPlayer2Actual(null);
      setStep('guess');
    } else {
      setStep('finished');
    }
  };

  const handleRestart = (pack?: TriviaPack) => {
    if (pack) setSelectedPack(pack);
    setCurrentIndex(0);
    setStep('guess');
    setPlayer1Guess(null);
    setPlayer2Actual(null);
    setScore(0);
    setRoundResults([]);
  };

  const matchPercent = Math.round((score / selectedPack.questions.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Couple Trivia</Text>
          <Text style={styles.headerSubtitle}>Who Knows Who Best?</Text>
        </View>
        <TouchableOpacity onPress={() => handleRestart()} style={styles.resetBtn} activeOpacity={0.7}>
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Pack Selector */}
      <View style={styles.packBar}>
        {TRIVIA_PACKS.map((pack) => {
          const isSelected = selectedPack.id === pack.id;
          return (
            <TouchableOpacity
              key={pack.id}
              style={[styles.packPill, isSelected && styles.packPillActive]}
              onPress={() => handleRestart(pack)}
              activeOpacity={0.7}
            >
              <Text style={[styles.packPillText, isSelected && styles.packPillTextActive]}>
                {pack.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step !== 'finished' ? (
          <>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressQuestionCount}>
                  Question {currentIndex + 1} of {selectedPack.questions.length}
                </Text>
                <Text style={styles.progressScoreText}>Score: {score}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${((currentIndex + 1) / selectedPack.questions.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* Question Card */}
            <View style={styles.questionCard}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{currentQ.category}</Text>
              </View>
              <Text style={styles.questionText}>{currentQ.question}</Text>
            </View>

            {/* Instruction Header based on Step */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                {step === 'guess'
                  ? '❤️ Player 1: Guess your partner’s true choice!'
                  : player2Actual === null
                  ? '💫 Player 2: Pass device! Tap your real answer:'
                  : player1Guess === player2Actual
                  ? '✨ MATCH! You know each other so well! 💕'
                  : '🙈 Not quite a match! Time for the fun forfeit:'}
              </Text>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQ.options.map((opt, idx) => {
                const isSelectedGuess = player1Guess === opt;
                const isSelectedActual = player2Actual === opt;
                let optionStyle = styles.optionCard;
                let textColor = colors.textPrimary;

                if (step === 'reveal' && player2Actual !== null) {
                  if (isSelectedActual) {
                    optionStyle = { ...styles.optionCard, ...styles.optionCorrect };
                    textColor = '#16A34A';
                  } else if (isSelectedGuess && !isSelectedActual) {
                    optionStyle = { ...styles.optionCard, ...styles.optionIncorrect };
                    textColor = '#DC2626';
                  }
                } else if (step === 'reveal' && isSelectedGuess) {
                  optionStyle = { ...styles.optionCard, ...styles.optionGuessed };
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={optionStyle}
                    disabled={player2Actual !== null}
                    onPress={() => {
                      if (step === 'guess') handleSelectGuess(opt);
                      else if (step === 'reveal' && player2Actual === null) handleSelectActual(opt);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
                    {step === 'reveal' && player2Actual !== null && (
                      <View>
                        {isSelectedActual && <CheckCircle2 size={20} color="#16A34A" />}
                        {isSelectedGuess && !isSelectedActual && <XCircle size={20} color="#DC2626" />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Forfeit Box if mismatched */}
            {player2Actual !== null && player1Guess !== player2Actual && (
              <View style={styles.forfeitCard}>
                <Text style={styles.forfeitTitle}>Playful Forfeit:</Text>
                <Text style={styles.forfeitText}>{currentQ.forfeit}</Text>
              </View>
            )}

            {/* Continue Button */}
            {player2Actual !== null && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex + 1 < selectedPack.questions.length ? 'Next Question' : 'See Results 🎉'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* Finished Screen */
          <View style={styles.finishedCard}>
            <View style={styles.trophyCircle}>
              <Trophy size={44} color="#F59E0B" />
            </View>
            <Text style={styles.finishedTitle}>Quiz Complete!</Text>
            <Text style={styles.finishedSub}>
              {matchPercent >= 80
                ? 'Absolute Soulmates! 💖'
                : matchPercent >= 50
                ? 'Great Chemistry! 💕'
                : 'Fun & Loving Bond! 🥰'}
            </Text>

            <View style={styles.scoreMeter}>
              <Text style={styles.scoreMeterNumber}>{matchPercent}%</Text>
              <Text style={styles.scoreMeterLabel}>Couple Compatibility Score</Text>
            </View>

            <View style={styles.resultsBreakdown}>
              <Text style={styles.breakdownTitle}>Round Summary:</Text>
              {roundResults.map((r, i) => (
                <View key={i} style={styles.breakdownRow}>
                  {r.matched ? (
                    <CheckCircle2 size={18} color="#16A34A" />
                  ) : (
                    <XCircle size={18} color="#DC2626" />
                  )}
                  <Text style={styles.breakdownQuestion} numberOfLines={1}>
                    {r.q.question}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.finishedActions}>
              {onShareToChat && (
                <TouchableOpacity
                  style={styles.shareChatBtn}
                  onPress={() =>
                    onShareToChat(
                      `💘 We scored ${matchPercent}% Compatibility in "${selectedPack.title}" Couple Trivia!`
                    )
                  }
                >
                  <Share2 size={18} color={colors.textPrimary} />
                  <Text style={styles.shareChatBtnText}>Share Score</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.playAgainBtn}
                onPress={() => handleRestart()}
              >
                <Text style={styles.playAgainBtnText}>Play Again</Text>
              </TouchableOpacity>
            </View>
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
  packBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  packPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  packPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  packPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  packPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressQuestionCount: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  progressScoreText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  categoryBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  categoryBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  questionText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionBox: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  optionGuessed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  optionCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  optionIncorrect: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  forfeitCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  forfeitTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#EA580C',
    marginBottom: 4,
  },
  forfeitText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  finishedCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  finishedTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  finishedSub: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: 4,
  },
  scoreMeter: {
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
    marginVertical: spacing.lg,
    width: '100%',
  },
  scoreMeterNumber: {
    fontSize: 40,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
  },
  scoreMeterLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultsBreakdown: {
    width: '100%',
    gap: 8,
    marginBottom: spacing.lg,
  },
  breakdownTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownQuestion: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  finishedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  shareChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shareChatBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  playAgainBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  playAgainBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
