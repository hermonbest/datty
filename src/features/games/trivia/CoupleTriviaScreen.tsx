import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Flame,
  Zap,
  Lock,
  Smartphone,
  HelpCircle,
  Crown,
  Users,
  ChevronRight,
  Smile,
  Award,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { TRIVIA_PACKS, TriviaPack } from './triviaData';
import { useCoupleTrivia } from './useCoupleTrivia';
import { gameLog } from '../gameLogger';

const { width } = Dimensions.get('window');

interface CoupleTriviaScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

export const CoupleTriviaScreen: React.FC<CoupleTriviaScreenProps> = ({
  onBack,
  onShareToChat,
}) => {
  const insets = useSafeAreaInsets();
  const {
    selectedPack,
    gameMode,
    setGameMode,
    isLinked,
    player1Name,
    player2Name,
    subjectName,
    guesserName,
    isSubjectMe,
    isGuesserMe,
    isMyTurnToAct,
    waitingForPartnerText,
    currentIndex,
    totalQuestions,
    currentQuestion,
    formattedQuestionText,
    phase,
    secretTruth,
    guesserGuess,
    scores,
    roundResults,
    winner,
    winnerName,
    compatibilityPercent,
    currentForfeitText,
    handleSelectPack,
    handleSubjectSelectTruth,
    handleDismissPrivacyGuard,
    handleGuesserSelectGuess,
    handleNextQuestion,
    handleRestartMatch,
  } = useCoupleTrivia();

  const isMatched = secretTruth !== null && secretTruth === guesserGuess;

  const getPackIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles size={16} color="#F59E0B" />;
      case 'HeartHandshake':
        return <HeartHandshake size={16} color="#E11D48" />;
      case 'Compass':
        return <Compass size={16} color="#8B5CF6" />;
      case 'Flame':
        return <Flame size={16} color="#E11D48" />;
      case 'Zap':
        return <Zap size={16} color="#2563EB" />;
      default:
        return <Sparkles size={16} color={colors.primary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            gameLog('CoupleTrivia', 'NavigateBack');
            onBack();
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Who Knows Who Best?</Text>
          <Text style={styles.headerSubtitle}>
            {gameMode === 'couple'
              ? `Online Duo with ${player2Name}`
              : 'Head-to-Head Couple Battle'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleRestartMatch()}
          style={styles.resetBtn}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Online / Pass & Play Mode Bar (if linked) */}
      {isLinked && (
        <View style={styles.modeBar}>
          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'couple' && styles.modeTabActive]}
            onPress={() => {
              gameLog('CoupleTrivia', 'SwitchMode', { mode: 'couple' });
              setGameMode('couple');
            }}
            activeOpacity={0.8}
          >
            <Users
              size={14}
              color={gameMode === 'couple' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                gameMode === 'couple' && styles.modeTabTextActive,
              ]}
            >
              Couple Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, gameMode === 'pass_and_play' && styles.modeTabActive]}
            onPress={() => {
              gameLog('CoupleTrivia', 'SwitchMode', { mode: 'pass_and_play' });
              setGameMode('pass_and_play');
            }}
            activeOpacity={0.8}
          >
            <Smartphone
              size={14}
              color={gameMode === 'pass_and_play' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                gameMode === 'pass_and_play' && styles.modeTabTextActive,
              ]}
            >
              Pass & Play
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Head-to-Head Live Scoreboard */}
      <View style={styles.scoreboardContainer}>
        {/* Player 1 Card */}
        <View
          style={[
            styles.playerScoreCard,
            subjectName === player1Name && styles.playerScoreCardSubject,
            guesserName === player1Name && styles.playerScoreCardGuesser,
          ]}
        >
          <View style={styles.playerAvatarBubble}>
            <Text style={styles.playerAvatarText}>
              {player1Name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerInfoCol}>
            <Text style={styles.playerNameText} numberOfLines={1}>
              {player1Name}
            </Text>
            <Text style={styles.playerRoleTag}>
              {phase === 'finished'
                ? 'Final Score'
                : subjectName === player1Name
                ? '🔒 The Subject'
                : '🤔 Guesser'}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{scores.player1}</Text>
          </View>
        </View>

        {/* VS Indicator */}
        <View style={styles.vsBadge}>
          <Text style={styles.vsBadgeText}>VS</Text>
        </View>

        {/* Player 2 Card */}
        <View
          style={[
            styles.playerScoreCard,
            subjectName === player2Name && styles.playerScoreCardSubject,
            guesserName === player2Name && styles.playerScoreCardGuesser,
          ]}
        >
          <View
            style={[styles.playerAvatarBubble, { backgroundColor: '#FCE7F3' }]}
          >
            <Text style={[styles.playerAvatarText, { color: '#BE185D' }]}>
              {player2Name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerInfoCol}>
            <Text style={styles.playerNameText} numberOfLines={1}>
              {player2Name}
            </Text>
            <Text style={styles.playerRoleTag}>
              {phase === 'finished'
                ? 'Final Score'
                : subjectName === player2Name
                ? '🔒 The Subject'
                : '🤔 Guesser'}
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: '#FCE7F3' }]}>
            <Text style={[styles.scoreBadgeText, { color: '#BE185D' }]}>
              {scores.player2}
            </Text>
          </View>
        </View>
      </View>

      {/* Pack Bar (during active game) */}
      {phase !== 'finished' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.packBarScrollView}
          contentContainerStyle={styles.packBar}
        >
          {TRIVIA_PACKS.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.packPill, isSelected && styles.packPillActive]}
                onPress={() => handleSelectPack(pack)}
                activeOpacity={0.7}
              >
                {getPackIcon(pack.icon)}
                <Text
                  style={[
                    styles.packPillText,
                    isSelected && styles.packPillTextActive,
                  ]}
                >
                  {pack.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {phase !== 'finished' ? (
          <>
            {/* Progress Bar & Category */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {currentQuestion.category}
                  </Text>
                </View>
                <Text style={styles.progressQuestionCount}>
                  Question {currentIndex + 1} of {totalQuestions}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* PHASE 1: PRIVACY GUARD (Pass & Play Handoff) */}
            {phase === 'privacy_guard' ? (
              <View style={styles.privacyGuardCard}>
                <View style={styles.privacyIconCircle}>
                  <Smartphone size={40} color={colors.primary} />
                </View>
                <Text style={styles.privacyTitle}>
                  Pass device to {guesserName}!
                </Text>
                <Text style={styles.privacyDesc}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                    {subjectName}
                  </Text>{' '}
                  has locked in their secret truth. Now it’s your turn to prove
                  how well you know them!
                </Text>

                <TouchableOpacity
                  style={styles.privacyReadyBtn}
                  onPress={handleDismissPrivacyGuard}
                  activeOpacity={0.85}
                >
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.privacyReadyBtnText}>
                    I’m {guesserName} — Let’s Guess!
                  </Text>
                </TouchableOpacity>
              </View>
            ) : waitingForPartnerText ? (
              /* Waiting Screen (Couple Online Mode) */
              <View style={styles.waitingCard}>
                <View style={styles.waitingPulseCircle}>
                  <Lock size={32} color={colors.primary} />
                </View>
                <Text style={styles.waitingTitle}>{waitingForPartnerText}</Text>
                <Text style={styles.waitingSubtitle}>
                  Answers are synchronized in real-time between your devices.
                </Text>
              </View>
            ) : (
              <>
                {/* Turn Instruction Box */}
                <View
                  style={[
                    styles.instructionBox,
                    phase === 'reveal'
                      ? isMatched
                        ? styles.instructionBoxMatch
                        : styles.instructionBoxMiss
                      : phase === 'secret_truth'
                      ? styles.instructionBoxSubject
                      : styles.instructionBoxGuesser,
                  ]}
                >
                  <View style={styles.instructionIconRow}>
                    {phase === 'secret_truth' ? (
                      <Lock size={18} color="#B45309" />
                    ) : phase === 'guesser_pick' ? (
                      <HelpCircle size={18} color="#1D4ED8" />
                    ) : isMatched ? (
                      <Sparkles size={18} color="#15803D" />
                    ) : (
                      <Flame size={18} color="#B91C1C" />
                    )}
                    <Text
                      style={[
                        styles.instructionTitle,
                        phase === 'reveal' &&
                          (isMatched
                            ? styles.instructionTextMatch
                            : styles.instructionTextMiss),
                      ]}
                    >
                      {phase === 'secret_truth'
                        ? `🔒 ${subjectName}’s Secret Truth`
                        : phase === 'guesser_pick'
                        ? `🤔 ${guesserName}, what will ${subjectName} pick?`
                        : isMatched
                        ? `✨ MATCH! +1 Point to ${guesserName}! 🎉`
                        : `🙈 MISMATCH! ${guesserName} missed!`}
                    </Text>
                  </View>
                  <Text style={styles.instructionSubtext}>
                    {phase === 'secret_truth'
                      ? `${subjectName}, choose your honest truth (${guesserName}, look away! 😉)`
                      : phase === 'guesser_pick'
                      ? `Select what you truly believe ${subjectName} chose:`
                      : isMatched
                      ? `You two are on the exact same wavelength! 💕`
                      : `${guesserName} must now perform the playful forfeit!`}
                  </Text>
                </View>

                {/* Question Text Card */}
                <View style={styles.questionCard}>
                  <Text style={styles.questionText}>
                    {formattedQuestionText}
                  </Text>
                </View>

                {/* Reveal Comparison Side-by-Side (During Reveal Phase) */}
                {phase === 'reveal' && (
                  <View style={styles.revealSummaryBox}>
                    <View style={styles.revealCol}>
                      <Text style={styles.revealColLabel}>
                        🔒 {subjectName}’s Truth:
                      </Text>
                      <View style={styles.revealColCard}>
                        <CheckCircle2 size={16} color="#16A34A" />
                        <Text style={styles.revealColText} numberOfLines={2}>
                          {secretTruth}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.revealCol}>
                      <Text style={styles.revealColLabel}>
                        🤔 {guesserName}’s Guess:
                      </Text>
                      <View
                        style={[
                          styles.revealColCard,
                          isMatched
                            ? styles.revealColCardMatch
                            : styles.revealColCardMiss,
                        ]}
                      >
                        {isMatched ? (
                          <CheckCircle2 size={16} color="#16A34A" />
                        ) : (
                          <XCircle size={16} color="#DC2626" />
                        )}
                        <Text
                          style={[
                            styles.revealColText,
                            !isMatched && { color: '#DC2626' },
                          ]}
                          numberOfLines={2}
                        >
                          {guesserGuess}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Options List */}
                <View style={styles.optionsList}>
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelectedSecret = secretTruth === opt;
                    const isSelectedGuess = guesserGuess === opt;

                    let cardStyle = styles.optionCard;
                    let textColor = colors.textPrimary;

                    if (phase === 'reveal') {
                      if (isSelectedSecret && isSelectedGuess) {
                        cardStyle = {
                          ...styles.optionCard,
                          ...styles.optionCorrect,
                        };
                        textColor = '#16A34A';
                      } else if (isSelectedSecret) {
                        cardStyle = {
                          ...styles.optionCard,
                          ...styles.optionTruthRevealed,
                        };
                        textColor = '#047857';
                      } else if (isSelectedGuess && !isSelectedSecret) {
                        cardStyle = {
                          ...styles.optionCard,
                          ...styles.optionIncorrect,
                        };
                        textColor = '#DC2626';
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={cardStyle}
                        disabled={phase === 'reveal'}
                        onPress={() => {
                          if (phase === 'secret_truth') {
                            handleSubjectSelectTruth(opt);
                          } else if (phase === 'guesser_pick') {
                            handleGuesserSelectGuess(opt);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.optionContentRow}>
                          <Text style={[styles.optionText, { color: textColor }]}>
                            {opt}
                          </Text>

                          {phase === 'reveal' && (
                            <View style={styles.optionBadgesRow}>
                              {isSelectedSecret && (
                                <View style={styles.truthTagBadge}>
                                  <Text style={styles.truthTagBadgeText}>
                                    Truth
                                  </Text>
                                </View>
                              )}
                              {isSelectedGuess && (
                                <View
                                  style={[
                                    styles.guessTagBadge,
                                    !isSelectedSecret && styles.guessTagBadgeMiss,
                                  ]}
                                >
                                  <Text style={styles.guessTagBadgeText}>
                                    Guess
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Forfeit Card on Mismatch */}
                {phase === 'reveal' && !isMatched && (
                  <View style={styles.forfeitCard}>
                    <View style={styles.forfeitHeaderRow}>
                      <Flame size={20} color="#EA580C" />
                      <Text style={styles.forfeitTitle}>
                        Playful Forfeit for {guesserName}:
                      </Text>
                    </View>
                    <Text style={styles.forfeitText}>{currentForfeitText}</Text>
                  </View>
                )}

                {/* Next Question / Results Button */}
                {phase === 'reveal' && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNextQuestion}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentIndex + 1 < totalQuestions
                        ? 'Next Question ➡️'
                        : 'Crown the Winner 🎉'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        ) : (
          /* Finished / Winner Coronation Screen */
          <View style={styles.finishedCard}>
            {/* Winner Trophy Circle */}
            <View style={styles.trophyCircle}>
              <Trophy size={48} color="#F59E0B" />
            </View>

            {/* Winner Title */}
            <Text style={styles.finishedTitle}>
              {winner === 'tie'
                ? '✨ Perfect Soulmate Tie! ✨'
                : `👑 ${winnerName} Knows Best!`}
            </Text>

            <Text style={styles.finishedSub}>
              {winner === 'tie'
                ? `You both know each other equally well (${scores.player1} - ${scores.player2})!`
                : `${winnerName} scored higher and earned ultimate couple bragging rights! 💖`}
            </Text>

            {/* Match Compatibility Meter */}
            <View style={styles.scoreMeter}>
              <Text style={styles.scoreMeterNumber}>
                {compatibilityPercent}%
              </Text>
              <Text style={styles.scoreMeterLabel}>
                Overall Couple Compatibility Rating
              </Text>
              <View style={styles.meterProgressBarBg}>
                <View
                  style={[
                    styles.meterProgressBarFill,
                    { width: `${compatibilityPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* Dual Score Cards Breakdown */}
            <View style={styles.dualScoreResultBox}>
              <View style={styles.dualScoreCol}>
                <Text style={styles.dualScoreName}>{player1Name}</Text>
                <Text style={styles.dualScoreNumber}>{scores.player1} pts</Text>
                <Text style={styles.dualScoreSub}>
                  {scores.player1 > scores.player2
                    ? '🏆 Winner'
                    : scores.player1 === scores.player2
                    ? '🤝 Tied'
                    : '🥈 2nd Place'}
                </Text>
              </View>

              <View style={styles.dualScoreDivider} />

              <View style={styles.dualScoreCol}>
                <Text style={styles.dualScoreName}>{player2Name}</Text>
                <Text style={[styles.dualScoreNumber, { color: '#BE185D' }]}>
                  {scores.player2} pts
                </Text>
                <Text style={styles.dualScoreSub}>
                  {scores.player2 > scores.player1
                    ? '🏆 Winner'
                    : scores.player1 === scores.player2
                    ? '🤝 Tied'
                    : '🥈 2nd Place'}
                </Text>
              </View>
            </View>

            {/* Runner-Up Forfeit Challenge */}
            {winner !== 'tie' && (
              <View style={styles.winnerForfeitBox}>
                <Text style={styles.winnerForfeitTitle}>
                  🎁 Runner-Up Reward For {winnerName}:
                </Text>
                <Text style={styles.winnerForfeitText}>
                  {winner === 'player1' ? player2Name : player1Name} must treat{' '}
                  {winnerName} to breakfast in bed or give a 5-minute back rub!
                </Text>
              </View>
            )}

            {/* Detailed Round-by-Round Breakdown */}
            <View style={styles.resultsBreakdown}>
              <Text style={styles.breakdownTitle}>Round-by-Round Summary:</Text>
              {roundResults.map((r, i) => (
                <View key={i} style={styles.breakdownRow}>
                  <View style={styles.breakdownIconBox}>
                    {r.matched ? (
                      <CheckCircle2 size={18} color="#16A34A" />
                    ) : (
                      <XCircle size={18} color="#DC2626" />
                    )}
                  </View>
                  <View style={styles.breakdownInfoCol}>
                    <Text style={styles.breakdownQuestion} numberOfLines={1}>
                      {r.formattedQuestion}
                    </Text>
                    <Text style={styles.breakdownAnswers}>
                      {r.guesserName} guessed:{' '}
                      <Text style={{ fontWeight: '600' }}>{r.guesserGuess}</Text>{' '}
                      • {r.subjectName}’s truth:{' '}
                      <Text style={{ fontWeight: '600' }}>{r.secretTruth}</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.finishedActions}>
              {onShareToChat && (
                <TouchableOpacity
                  style={styles.shareChatBtn}
                  onPress={() => {
                    const message =
                      winner === 'tie'
                        ? `💕 We tied in "Who Knows Who Best?" (${scores.player1} - ${scores.player2}) with ${compatibilityPercent}% Compatibility in "${selectedPack.title}"!`
                        : `🏆 ${winnerName} won "Who Knows Who Best?" against ${
                            winner === 'player1' ? player2Name : player1Name
                          } (${scores.player1} - ${scores.player2}) with ${compatibilityPercent}% Compatibility! 💖`;
                    onShareToChat(message);
                  }}
                >
                  <Share2 size={18} color={colors.textPrimary} />
                  <Text style={styles.shareChatBtnText}>Share Score to Chat</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.playAgainBtn}
                onPress={() => handleRestartMatch()}
              >
                <RotateCcw size={18} color="#FFFFFF" />
                <Text style={styles.playAgainBtnText}>Play Pack Again</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitleContainer: {
    alignItems: 'center',
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
  },

  // Mode Bar
  modeBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: radii.full,
    padding: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },

  // Scoreboard
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  playerScoreCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  playerScoreCardSubject: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  playerScoreCardGuesser: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  playerAvatarBubble: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playerAvatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  playerInfoCol: {
    flex: 1,
  },
  playerNameText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  playerRoleTag: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  scoreBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  vsBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },

  // Pack selector
  packBarScrollView: {
    maxHeight: 46,
  },
  packBar: {
    paddingHorizontal: spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  packPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  packPillActive: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
  },
  packPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  packPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },

  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  progressQuestionCount: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },

  // Privacy Guard Card (Pass & Play)
  privacyGuardCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
    ...shadows.md,
    marginVertical: spacing.lg,
  },
  privacyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  privacyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  privacyDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  privacyReadyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    gap: 8,
    ...shadows.glowRose,
  },
  privacyReadyBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },

  // Waiting Card (Couple Mode)
  waitingCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
    marginVertical: spacing.lg,
  },
  waitingPulseCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  waitingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  waitingSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Instructions
  instructionBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  instructionBoxSubject: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  instructionBoxGuesser: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  instructionBoxMatch: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  instructionBoxMiss: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  instructionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  instructionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  instructionTextMatch: {
    color: '#15803D',
  },
  instructionTextMiss: {
    color: '#B91C1C',
  },
  instructionSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Question Card
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  questionText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 26,
  },

  // Reveal Summary Comparison Box
  revealSummaryBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  revealCol: {
    flex: 1,
  },
  revealColLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  revealColCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    gap: 6,
  },
  revealColCardMatch: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  revealColCardMiss: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  revealColText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    flex: 1,
  },

  // Options List
  optionsList: {
    gap: 10,
    marginBottom: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  optionCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  optionTruthRevealed: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionIncorrect: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  optionContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  optionBadgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  truthTagBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  truthTagBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  guessTagBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  guessTagBadgeMiss: {
    backgroundColor: '#DC2626',
  },
  guessTagBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },

  // Forfeit Card
  forfeitCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: spacing.md,
  },
  forfeitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  forfeitTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#C2410C',
  },
  forfeitText: {
    fontSize: typography.sizes.sm,
    color: '#7C2D12',
    lineHeight: 20,
  },

  // Next Button
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowRose,
  },
  nextButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },

  // Finished Card
  finishedCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: radii.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  finishedTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  finishedSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  // Compatibility Meter
  scoreMeter: {
    width: '100%',
    backgroundColor: colors.primarySubtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreMeterNumber: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
  },
  scoreMeterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  meterProgressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  meterProgressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },

  // Dual Score Result Box
  dualScoreResultBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.cardAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dualScoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  dualScoreName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dualScoreNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
  },
  dualScoreSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dualScoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Winner Forfeit Box
  winnerForfeitBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  winnerForfeitTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#B45309',
    marginBottom: 2,
  },
  winnerForfeitText: {
    fontSize: typography.sizes.xs + 1,
    color: '#92400E',
    lineHeight: 18,
  },

  // Results Breakdown
  resultsBreakdown: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  breakdownTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  breakdownIconBox: {
    marginTop: 2,
  },
  breakdownInfoCol: {
    flex: 1,
  },
  breakdownQuestion: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  breakdownAnswers: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Finished Actions
  finishedActions: {
    width: '100%',
    gap: 10,
  },
  shareChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareChatBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    gap: 8,
    ...shadows.glowRose,
  },
  playAgainBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
});
