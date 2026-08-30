import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CardDeck } from './decksData';
import { getCategoryTheme } from './categoryTheme';
import { CardAnswerEntry, DeckProgressState } from './useDeckAnswers';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Card, Avatar } from '../../components';
import { useCouple } from '../../services/coupleContext';
import {
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Heart,
  MessageCircle,
  Clock,
  Layers,
} from 'lucide-react-native';
import { ChatReplyReference } from '../../types';

interface DeckResultsScreenProps {
  deck: CardDeck;
  answersMap: Record<number, CardAnswerEntry>;
  deckProgress: DeckProgressState;
  onBack: () => void;
  onSelectCard: (index: number) => void;
  onNavigateToChat?: (replyTo?: ChatReplyReference) => void;
}

export const DeckResultsScreen: React.FC<DeckResultsScreenProps> = ({
  deck,
  answersMap,
  deckProgress,
  onBack,
  onSelectCard,
  onNavigateToChat,
}) => {
  const { userProfile, partnerProfile } = useCouple();
  const theme = getCategoryTheme(deck.category);

  const isDeckRevealed = deckProgress.isDeckRevealed;
  const myCount = deckProgress.myCount;
  const partnerCount = deckProgress.partnerCount;
  const total = deckProgress.totalQuestions;

  const handleReplyInChat = (qIndex: number, answerText: string) => {
    const qText = deck.questions[qIndex] || answersMap[qIndex]?.questionText || '';
    if (onNavigateToChat) {
      onNavigateToChat({
        type: 'card',
        deckTitle: deck.title,
        questionText: qText,
        answerText,
        authorName: partnerProfile?.displayName || 'Partner',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {deck.title} • Results
          </Text>
          <Text style={styles.headerSubtitle}>
            You: {myCount}/{total} • {partnerProfile?.displayName || 'Partner'}: {partnerCount}/{total}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={deck.questions}
        keyExtractor={(_item, index) => `result-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryBannerWrap}>
            {isDeckRevealed ? (
              <View style={[styles.statusHeroBanner, { backgroundColor: colors.successLight, borderColor: '#86EFAC', borderWidth: 1 }]}>
                <Sparkles size={22} color={colors.success} />
                <View style={styles.statusHeroTextWrap}>
                  <Text style={[styles.statusHeroTitle, { color: colors.success }]}>
                    🎉 Deck Completed & Unlocked!
                  </Text>
                  <Text style={styles.statusHeroSub}>
                    Both of you finished all {total} cards! All answers are revealed below. Tap "Reply in Chat" to discuss any answer!
                  </Text>
                </View>
              </View>
            ) : myCount >= total ? (
              /* Dedicated "Waiting for Partner" state when user finished the deck */
              <View style={styles.waitingHeroCard}>
                <View style={styles.waitingIconCircle}>
                  <Clock size={28} color={colors.primary} />
                </View>
                <Text style={styles.waitingHeroTitle}>
                  Waiting for {partnerProfile?.displayName || 'your partner'}...
                </Text>
                <Text style={styles.waitingHeroSub}>
                  You've answered all {total} cards in this deck! As soon as {partnerProfile?.displayName || 'your partner'} completes theirs ({partnerCount}/{total}), both of your responses will unlock side-by-side.
                </Text>

                {/* Partner Progress Bar */}
                <View style={styles.progressTrackWrapper}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.partnerProgressLabel}>
                      {partnerProfile?.displayName || 'Partner'}'s Progress
                    </Text>
                    <Text style={styles.partnerProgressFraction}>
                      {partnerCount}/{total} cards
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.max(6, (partnerCount / total) * 100)}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.waitingActionsRow}>
                  {onNavigateToChat && (
                    <TouchableOpacity
                      onPress={() =>
                        onNavigateToChat({
                          type: 'card',
                          deckTitle: deck.title,
                          questionText: `I just finished all ${total} cards in ${deck.title}! Ready for you ❤️`,
                          authorName: userProfile?.displayName || 'Me',
                        })
                      }
                      style={styles.nudgeChatBtn}
                      activeOpacity={0.82}
                    >
                      <MessageCircle size={15} color="#FFFFFF" />
                      <Text style={styles.nudgeChatBtnText}>Nudge in Chat</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={onBack}
                    style={styles.backDecksBtn}
                    activeOpacity={0.82}
                  >
                    <Layers size={15} color={colors.textPrimary} />
                    <Text style={styles.backDecksBtnText}>Explore Decks</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.statusHeroBanner, { backgroundColor: theme.bgLight, borderColor: theme.border, borderWidth: 1 }]}>
                <Lock size={20} color={theme.color} />
                <View style={styles.statusHeroTextWrap}>
                  <Text style={[styles.statusHeroTitle, { color: colors.textPrimary }]}>
                    Answers Reveal When Both Finish All {total} Cards
                  </Text>
                  <Text style={styles.statusHeroSub}>
                    Your progress: {myCount}/{total} answered • Partner: {partnerCount}/{total} answered.
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item: qText, index: qIndex }) => {
          const entry = answersMap[qIndex];
          const hasMyAnswer = Boolean(entry?.myAnswer);
          const hasPartnerAnswer = Boolean(entry?.partnerAnswer);

          return (
            <Card style={[styles.resultCard, { borderLeftColor: theme.color, borderLeftWidth: 4 }]}>
              {/* Card Number & Reveal Status */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectCard(qIndex)}
                style={styles.cardHeaderRow}
              >
                <View style={[styles.cardNumBadge, { backgroundColor: theme.bgLight }]}>
                  <Text style={[styles.cardNumText, { color: theme.color }]}>
                    Card #{qIndex + 1}
                  </Text>
                </View>

                <View style={styles.revealStatusPill}>
                  {isDeckRevealed ? (
                    <>
                      <Unlock size={13} color={colors.success} />
                      <Text style={[styles.revealStatusText, { color: colors.success }]}>
                        Unlocked
                      </Text>
                    </>
                  ) : hasMyAnswer ? (
                    <>
                      <CheckCircle2 size={13} color={theme.color} />
                      <Text style={[styles.revealStatusText, { color: theme.color }]}>
                        Answer Locked
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.revealStatusText, { color: colors.textMuted }]}>
                      Unanswered
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Question Text */}
              <Text style={styles.questionText}>"{qText}"</Text>

              {/* Answers Area */}
              <View style={styles.answersContainer}>
                {/* 1. My Answer */}
                {hasMyAnswer ? (
                  <View style={styles.answerBox}>
                    <View style={styles.authorRow}>
                      <Avatar
                        name={userProfile?.displayName || 'You'}
                        photoURL={userProfile?.photoURL}
                        size="sm"
                      />
                      <Text style={styles.authorName}>
                        {userProfile?.displayName || 'You'}
                      </Text>
                      <CheckCircle2 size={13} color={colors.success} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.answerText}>{entry.myAnswer}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => onSelectCard(qIndex)}
                    style={styles.unansweredPromptBox}
                  >
                    <Text style={styles.unansweredPromptText}>
                      ✍️ Tap to answer this card
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 2. Partner's Answer */}
                {isDeckRevealed ? (
                  <View style={[styles.answerBox, styles.partnerAnswerBox]}>
                    <View style={styles.authorRow}>
                      <Avatar
                        name={partnerProfile?.displayName || 'Partner'}
                        photoURL={partnerProfile?.photoURL}
                        size="sm"
                        highlighted
                        borderColor={colors.primary}
                      />
                      <Text style={styles.authorName}>
                        {partnerProfile?.displayName || 'Partner'}
                      </Text>
                      <Heart size={13} color={colors.primary} fill={colors.primary} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.answerText}>
                      {hasPartnerAnswer ? entry.partnerAnswer : '(No answer recorded)'}
                    </Text>

                    {/* Reply in Chat Action */}
                    {hasPartnerAnswer && (
                      <TouchableOpacity
                        onPress={() => handleReplyInChat(qIndex, entry.partnerAnswer || '')}
                        style={styles.replyInChatBtn}
                      >
                        <MessageCircle size={13} color={colors.primary} />
                        <Text style={styles.replyInChatBtnText}>Reply in Chat →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={[styles.answerBox, styles.partnerAnswerLocked]}>
                    <View style={styles.authorRow}>
                      <Avatar
                        name={partnerProfile?.displayName || 'Partner'}
                        photoURL={partnerProfile?.photoURL}
                        size="sm"
                      />
                      <Text style={styles.authorName}>
                        {partnerProfile?.displayName || 'Partner'}
                      </Text>
                      <Lock size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.lockedPlaceholderText}>
                      🔒 Hidden until both finish all {total} cards.
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryBannerWrap: {
    marginBottom: spacing.md,
  },
  statusHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  statusHeroTextWrap: {
    flex: 1,
  },
  statusHeroTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  statusHeroSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },
  resultCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardNumBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  cardNumText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  revealStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  revealStatusText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  questionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  answersContainer: {
    gap: spacing.sm,
  },
  answerBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  partnerAnswerBox: {
    backgroundColor: colors.cardAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  partnerAnswerLocked: {
    backgroundColor: colors.cardAlt,
    opacity: 0.85,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  answerText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  unansweredPromptBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  unansweredPromptText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
  },
  lockedPlaceholderText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  replyInChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  replyInChatBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  waitingHeroCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderRose,
    ...shadows.md,
  },
  waitingIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  waitingHeroTitle: {
    fontSize: typography.sizes.md + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingHeroSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    maxWidth: 320,
    marginBottom: spacing.md,
  },
  progressTrackWrapper: {
    width: '100%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  partnerProgressLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  partnerProgressFraction: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  waitingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  nudgeChatBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.sm,
  },
  nudgeChatBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  backDecksBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backDecksBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
