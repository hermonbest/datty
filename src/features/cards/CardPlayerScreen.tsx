import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CardDeck } from './decksData';
import { getCategoryTheme, ICON_MAP } from './categoryTheme';
import { useDeckAnswers } from './useDeckAnswers';
import { DeckResultsScreen } from './DeckResultsScreen';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import {
  ArrowLeft,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  MessageCircle,
  Sparkles,
  X,
  Check,
  Lock,
  Unlock,
  CheckCircle2,
  BookOpen,
  Edit3,
} from 'lucide-react-native';
import { ChatReplyReference } from '../../types';

interface CardPlayerScreenProps {
  deck: CardDeck;
  onBack: () => void;
  onNavigateToChat?: (replyTo?: ChatReplyReference) => void;
}

/**
 * A question paired with its ORIGINAL index in the deck.
 * Answers in Firestore are keyed by this original index, so the card order
 * can be shuffled freely without mapping answers onto the wrong questions.
 */
interface DeckQuestion {
  text: string;
  originalIndex: number;
}

export const CardPlayerScreen: React.FC<CardPlayerScreenProps> = ({
  deck,
  onBack,
  onNavigateToChat,
}) => {
  const { coupleId, myUid, userProfile, partnerProfile } = useCouple();
  const toast = useToast();
  const theme = getCategoryTheme(deck.category);
  const CategoryIcon = ICON_MAP[deck.iconName] || theme.icon || Sparkles;

  const [questions, setQuestions] = useState<DeckQuestion[]>(() =>
    deck.questions.map((text, originalIndex) => ({ text, originalIndex }))
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [sendingToChat, setSendingToChat] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const {
    answersMap,
    deckProgress,
    submitting,
    submitAnswer,
  } = useDeckAnswers(deck.id, deck.title, deck.category, deck.questions.length);

  const currentQuestion = questions[currentIndex]?.text || '';
  const currentOriginalIndex = questions[currentIndex]?.originalIndex ?? currentIndex;
  const currentCardEntry = answersMap[currentOriginalIndex];
  const hasMyAnswer = Boolean(currentCardEntry?.myAnswer);
  const hasPartnerAnswer = Boolean(currentCardEntry?.partnerAnswer);
  const isDeckRevealed = deckProgress.isDeckRevealed;
  const isFavorite = favorites.has(currentOriginalIndex);

  // Sync input text when switching cards or editing
  useEffect(() => {
    if (currentCardEntry?.myAnswer && !isEditing) {
      setAnswerInput(currentCardEntry.myAnswer);
    } else if (!currentCardEntry?.myAnswer) {
      setAnswerInput('');
      setIsEditing(false);
    }
  }, [currentIndex, currentCardEntry, isEditing]);

  // Find the next unanswered question after a given position, wrapping around
  const findNextUnansweredFrom = (fromPosition: number): number => {
    const len = questions.length;
    for (let step = 1; step <= len; step++) {
      const pos = (fromPosition + step) % len;
      if (!answersMap[questions[pos].originalIndex]?.myAnswer) {
        return pos;
      }
    }
    return -1;
  };

  const handleNext = () => {
    setIsEditing(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reached the end of the card list
      const answeredCount = Object.values(answersMap).filter((a) => a.myAnswer).length;
      if (answeredCount >= questions.length) {
        // All cards completed! Open waiting / results screen
        setShowResults(true);
      } else {
        // Find next unanswered card or loop back
        const nextUnanswered = questions.findIndex(
          (q) => !answersMap[q.originalIndex]?.myAnswer
        );
        if (nextUnanswered !== -1) {
          setCurrentIndex(nextUnanswered);
        } else {
          setShowResults(true);
        }
      }
    }
  };

  const handlePrev = () => {
    setIsEditing(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(questions.length - 1);
    }
  };

  const handleSkip = () => {
    setAnswerInput('');
    setIsEditing(false);
    handleNext();
  };

  const handleSendAnswer = () => {
    const textToSend = answerInput.trim();
    if (!textToSend) {
      toast.error('Empty Answer', 'Please write your response before sending.');
      return;
    }

    const savedPosition = currentIndex;
    const savedOriginalIndex = currentOriginalIndex;
    const savedQuestion = currentQuestion;

    setAnswerInput('');
    setIsEditing(false);

    // Persist to Firestore asynchronously — keyed by the ORIGINAL question index
    submitAnswer(savedOriginalIndex, savedQuestion, textToSend).catch((e) => {
      console.error('[CardPlayer] Failed to save answer:', e);
      toast.error('Submission Failed', 'Could not save answer. Please try again.');
    });

    // Check how many are answered including this one
    const answeredCount =
      Object.values(answersMap).filter(
        (a) => a.myAnswer && a.questionIndex !== savedOriginalIndex
      ).length + 1;

    if (answeredCount >= questions.length) {
      // Completed all questions in the deck!
      toast.success('Deck Completed!', 'Waiting for your partner to finish all cards.');
      setShowResults(true);
      return;
    }

    // Jump to the next unanswered question (wraps around the current order)
    const nextUnanswered = findNextUnansweredFrom(savedPosition);
    if (nextUnanswered !== -1) {
      setCurrentIndex(nextUnanswered);
    } else {
      setShowResults(true);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestions(shuffled);
    setCurrentIndex(0);
    setIsEditing(false);
    toast.success('Deck Shuffled!', 'Ready with a fresh order.');
  };

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(currentOriginalIndex)) {
        next.delete(currentOriginalIndex);
        toast.info('Removed', 'Removed from session favorites.');
      } else {
        next.add(currentOriginalIndex);
        toast.success('Favorited!', 'Card saved in favorites.');
      }
      return next;
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${currentQuestion}"\n\nCandle Couples Cards • ${deck.title}`,
      });
    } catch (e) {
      // Cancelled
    }
  };

  const handleSendToChat = async () => {
    if (!coupleId || !myUid) {
      toast.error('Not Connected', 'Couple connection required to send to chat.');
      return;
    }

    if (onNavigateToChat) {
      onNavigateToChat({
        type: 'card',
        deckTitle: deck.title,
        questionText: currentQuestion,
        authorName: deck.title,
      });
    }
  };

  if (showResults) {
    return (
      <DeckResultsScreen
        deck={deck}
        answersMap={answersMap}
        deckProgress={deckProgress}
        onBack={() => setShowResults(false)}
        onSelectCard={(idx) => {
          // Results screen uses ORIGINAL question indices — map back to the
          // current (possibly shuffled) position.
          const pos = questions.findIndex((q) => q.originalIndex === idx);
          setCurrentIndex(pos >= 0 ? pos : 0);
          setShowResults(false);
        }}
        onNavigateToChat={onNavigateToChat}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {deck.title}
          </Text>
          <View style={[styles.categoryMiniBadge, { backgroundColor: theme.bgLight }]}>
            <Text style={[styles.categoryMiniText, { color: theme.badgeText }]}>
              {theme.emoji} {deck.category}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowResults(true)}
            style={[styles.resultsHeaderBtn, { backgroundColor: theme.bgLight }]}
          >
            <BookOpen size={15} color={theme.color} />
            <Text style={[styles.resultsHeaderBtnText, { color: theme.color }]}>
              {deckProgress.myCount}/{deck.questions.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShuffle} style={styles.iconBtn}>
            <Shuffle size={18} color={theme.color} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Deck Progress Bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelWrap}>
            <Text style={styles.progressText}>
              Card {currentIndex + 1} of {questions.length}
            </Text>

            <View style={styles.deckStatusBadges}>
              {hasMyAnswer && (
                <View style={styles.answeredStatusPill}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={styles.answeredStatusText}>Answered</Text>
                </View>
              )}
              {isDeckRevealed && (
                <View style={[styles.answeredStatusPill, { backgroundColor: colors.accentLight }]}>
                  <Unlock size={12} color={colors.accent} />
                  <Text style={[styles.answeredStatusText, { color: colors.accent }]}>
                    Revealed
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  backgroundColor: theme.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Completion Prompt Banner */}
        {isDeckRevealed ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowResults(true)}
            style={[styles.celebrationBanner, { backgroundColor: colors.successLight }]}
          >
            <Sparkles size={18} color={colors.success} />
            <Text style={[styles.celebrationBannerText, { color: colors.success }]}>
              🎉 Both completed all {deck.questions.length} cards! Tap to view full round results & replies →
            </Text>
          </TouchableOpacity>
        ) : deckProgress.myCount >= deck.questions.length ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowResults(true)}
            style={[styles.celebrationBanner, { backgroundColor: colors.accentLight }]}
          >
            <Lock size={16} color={colors.accent} />
            <Text style={[styles.celebrationBannerText, { color: colors.textPrimary }]}>
              ✨ You answered all {deck.questions.length} cards! Waiting for {partnerProfile?.displayName || 'partner'} ({deckProgress.partnerCount}/{deck.questions.length}) →
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Physical-style Flash Card */}
        <View style={[styles.cardSurface, { borderColor: theme.border }]}>
          {/* Card Top Pill & Favorite */}
          <View style={styles.cardHeader}>
            <CategoryIcon size={20} color={theme.color} />

            <TouchableOpacity onPress={toggleFavorite} style={styles.favBtn}>
              <Heart
                size={22}
                color={isFavorite ? colors.primary : colors.textMuted}
                fill={isFavorite ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>



          {/* Card Question Text */}
          <View style={styles.questionBody}>
            <Text style={styles.questionText}>"{currentQuestion}"</Text>
          </View>

          {/* Interactive Answer Area */}
          <View style={styles.answerSection}>
            {/* Mode 1: Answer is already submitted and NOT in edit mode */}
            {hasMyAnswer && !isEditing ? (
              <View style={styles.submittedContainer}>
                {/* My Answer Box */}
                <View style={styles.submittedCard}>
                  <View style={styles.submittedHeader}>
                    <Avatar
                      name={userProfile?.displayName || 'You'}
                      photoURL={userProfile?.photoURL}
                      size="sm"
                    />
                    <View style={styles.authorMeta}>
                      <Text style={styles.submittedAuthor}>Your Answer</Text>
                      <Text style={styles.submittedStatus}>Locked & saved</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      style={styles.editBtn}
                    >
                      <Edit3 size={14} color={colors.textSecondary} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.submittedText}>{currentCardEntry?.myAnswer}</Text>
                </View>

                {/* Partner Answer or Locked Teaser */}
                {isDeckRevealed ? (
                  <View style={[styles.submittedCard, styles.partnerSubmittedCard]}>
                    <View style={styles.submittedHeader}>
                      <Avatar
                        name={partnerProfile?.displayName || 'Partner'}
                        photoURL={partnerProfile?.photoURL}
                        size="sm"
                        highlighted
                        borderColor={colors.primary}
                      />
                      <View style={styles.authorMeta}>
                        <Text style={styles.submittedAuthor}>
                          {partnerProfile?.displayName || 'Partner'}
                        </Text>
                        <Text style={styles.submittedStatus}>Partner's answer</Text>
                      </View>
                      <Heart size={16} color={colors.primary} fill={colors.primary} />
                    </View>
                    <Text style={styles.submittedText}>
                      {hasPartnerAnswer ? currentCardEntry?.partnerAnswer : '(No answer recorded)'}
                    </Text>

                    {/* Reply in Chat Action */}
                    {hasPartnerAnswer && (
                      <TouchableOpacity
                        onPress={() => {
                          if (onNavigateToChat) {
                            onNavigateToChat({
                              type: 'card',
                              deckTitle: deck.title,
                              questionText: currentQuestion,
                              answerText: currentCardEntry?.partnerAnswer || '',
                              authorName: partnerProfile?.displayName || 'Partner',
                            });
                          }
                        }}
                        style={styles.replyInChatBtn}
                      >
                        <MessageCircle size={14} color={colors.primary} />
                        <Text style={styles.replyInChatBtnText}>Reply in Chat →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.waitingCard}>
                    <Lock size={16} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.waitingTitle}>Answer Hidden</Text>
                      <Text style={styles.waitingText}>
                        Answers reveal when both finish all {deck.questions.length} cards ({deckProgress.myCount}/{deck.questions.length} vs {deckProgress.partnerCount}/{deck.questions.length}).
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* Mode 2: Input Box + Skip / Send buttons */
              <View style={styles.inputArea}>
                <TextInput
                  placeholder="Type your response here... (revealed after both finish all cards in deck)"
                  placeholderTextColor={colors.textMuted}
                  value={answerInput}
                  onChangeText={setAnswerInput}
                  multiline
                  numberOfLines={3}
                  style={styles.textInputBox}
                />

                <View style={styles.actionButtonsRow}>
                  {/* Skip Button */}
                  <TouchableOpacity
                    onPress={handleSkip}
                    activeOpacity={0.75}
                    style={styles.skipIconOnlyBtn}
                    accessibilityLabel="Skip question"
                  >
                    <X size={20} color={colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {/* Send Answer Button */}
                  <TouchableOpacity
                    onPress={handleSendAnswer}
                    disabled={submitting}
                    activeOpacity={0.85}
                    style={[styles.sendIconOnlyBtn, { backgroundColor: theme.color }]}
                    accessibilityLabel="Send answer"
                  >
                    <Check size={22} color="#FFFFFF" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Card Footer Actions */}
          <View style={styles.cardFooter}>
            <TouchableOpacity onPress={handleShare} style={styles.footerActionBtn}>
              <Share2 size={16} color={colors.textSecondary} />
              <Text style={styles.footerActionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendToChat}
              disabled={sendingToChat}
              style={[styles.footerActionBtn, { backgroundColor: theme.bgLight }]}
            >
              <MessageCircle size={16} color={theme.color} />
              <Text style={[styles.footerActionText, { color: theme.color, fontWeight: '700' }]}>
                {sendingToChat ? 'Sending...' : 'Discuss in Chat'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Controls (Prev / Next) */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handlePrev} style={styles.navControlBtn}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextCardHeroBtn, { backgroundColor: theme.color }]}
          >
            <Text style={styles.nextCardHeroText}>Next Card</Text>
            <ChevronRight size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginHorizontal: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  categoryMiniBadge: {
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 1,
    borderRadius: radii.xs,
    marginTop: 2,
  },
  categoryMiniText: {
    fontSize: typography.sizes.xs - 3,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    gap: 4,
  },
  resultsHeaderBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  progressRow: {
    marginBottom: spacing.xs,
  },
  progressLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deckStatusBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  answeredStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 4,
  },
  answeredStatusText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: colors.borderLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  celebrationBannerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    flex: 1,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },
  cardSurface: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1.5,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  deckPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  favBtn: {
    padding: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs + 1,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
  },
  questionBody: {
    paddingVertical: spacing.md,
  },
  questionText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
  },
  answerSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  inputArea: {
    gap: spacing.sm,
  },
  textInputBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 90,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  skipIconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendIconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  submittedContainer: {
    gap: spacing.sm,
  },
  submittedCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  partnerSubmittedCard: {
    backgroundColor: colors.cardAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  submittedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  submittedAuthor: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  submittedStatus: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  editBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  submittedText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  waitingTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  waitingText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    gap: 5,
  },
  footerActionText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  navControlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  nextCardHeroBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  nextCardHeroText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
});
