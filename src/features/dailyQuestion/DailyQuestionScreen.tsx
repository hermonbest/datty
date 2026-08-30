import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { format } from 'date-fns';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Button, Input, Card, Avatar, Skeleton, useToast, ProfileSettingsModal } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { useDailyQuestion } from './useDailyQuestion';
import { getCategoryTheme, ICON_MAP } from '../cards/categoryTheme';
import {
  Sparkles,
  Lock,
  Unlock,
  Clock,
  History,
  CheckCircle2,
  Heart,
  Layers,
  ChevronRight,
} from 'lucide-react-native';

interface DailyQuestionScreenProps {
  onOpenHistory?: () => void;
  onOpenDecks?: () => void;
}

export const DailyQuestionScreen: React.FC<DailyQuestionScreenProps> = ({
  onOpenHistory,
  onOpenDecks,
}) => {
  const { userProfile, partnerProfile, couple } = useCouple();
  const [answerInput, setAnswerInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const toast = useToast();

  const {
    question,
    myAnswer,
    partnerAnswer,
    isRevealed,
    isWaitingForPartner,
    isUnanswered,
    loading,
    submitting,
    submitAnswer,
  } = useDailyQuestion();

  const theme = getCategoryTheme(question?.category);
  const CategoryIcon = ICON_MAP[theme.iconName] || theme.icon || Sparkles;

  const handleSubmit = async () => {
    if (!answerInput.trim()) {
      toast.error('Empty Answer', 'Please write your response before submitting.');
      return;
    }
    const textToSubmit = answerInput.trim();
    setAnswerInput('');
    try {
      await submitAnswer(textToSubmit);
      toast.success('Answer Submitted!', 'Waiting for your partner to reveal.');
    } catch (e) {
      setAnswerInput(textToSubmit);
      toast.error('Submission Failed', 'Please try submitting again.');
    }
  };

  const todayFormatted = React.useMemo(() => {
    if (couple?.timezone) {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: couple.timezone,
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date());
      } catch {
        // fallback
      }
    }
    return format(new Date(), 'EEEE, MMMM d');
  }, [couple?.timezone]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={160} height={18} style={{ marginBottom: 8 }} />
          <Skeleton width={240} height={28} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={160} borderRadius={radii.lg} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={120} borderRadius={radii.lg} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header section */}
        <View style={styles.header}>
          <View style={styles.dateRow}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.dateText}>{todayFormatted}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Daily Question</Text>
            <View style={styles.headerRightActions}>
              {onOpenHistory && (
                <TouchableOpacity onPress={onOpenHistory} style={styles.historyBtn} accessibilityLabel="History">
                  <History size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.profileBtn}
                accessibilityLabel="Open profile and settings"
              >
                <Avatar
                  name={userProfile?.displayName || 'You'}
                  photoURL={userProfile?.photoURL}
                  size="sm"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Question Prompt Card */}
        <Card
          style={[
            styles.questionCard,
            { borderLeftColor: theme.color, borderLeftWidth: 4 },
          ]}
          variant="elevated"
        >
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.bgLight }]}>
              <CategoryIcon size={13} color={theme.color} style={{ marginRight: 4 }} />
              <Text style={[styles.categoryText, { color: theme.badgeText }]}>
                {theme.emoji} {question?.category || 'Deep Talks'}
              </Text>
            </View>
            {question?.deck && (
              <View style={[styles.deckBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={styles.deckText}>{question.deck}</Text>
              </View>
            )}
          </View>

          {question?.subtitle ? (
            <Text style={styles.subtitleText}>"{question.subtitle}"</Text>
          ) : null}

          <Text style={styles.questionText}>"{question?.text}"</Text>

          <View style={styles.privacyBadge}>
            {isRevealed ? (
              <>
                <Unlock size={14} color={colors.success} />
                <Text style={[styles.privacyText, { color: colors.success }]}>
                  Answers Revealed!
                </Text>
              </>
            ) : (
              <>
                <Lock size={14} color={colors.accent} />
                <Text style={styles.privacyText}>
                  Private until both of you answer
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* State 1: Unanswered (Form to submit) */}
        {isUnanswered && (
          <Card style={styles.answerCard}>
            <Text style={styles.answerCardTitle}>Your Private Answer</Text>
            <Input
              placeholder="Speak from your heart... (your partner cannot see this until they submit theirs)"
              value={answerInput}
              onChangeText={setAnswerInput}
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
            <View style={styles.answerCardFooter}>
              <Text style={styles.charCount}>{answerInput.length} chars</Text>
              <Button
                title="Submit Answer"
                onPress={handleSubmit}
                loading={submitting}
                size="md"
                variant="primary"
                leftIcon={<Heart size={16} color={colors.textLight} fill={colors.textLight} />}
              />
            </View>
          </Card>
        )}

        {/* State 2: Waiting for Partner */}
        {isWaitingForPartner && (
          <View style={styles.waitingContainer}>
            {/* My submitted answer preview */}
            <Card style={[styles.responseCard, styles.myResponseCard]}>
              <View style={styles.responseHeader}>
                <Avatar name={userProfile?.displayName || 'You'} photoURL={userProfile?.photoURL} size="sm" />
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>Your Answer</Text>
                  <Text style={styles.statusSub}>Locked & ready</Text>
                </View>
                <CheckCircle2 size={18} color={colors.success} />
              </View>
              <Text style={styles.responseText}>{myAnswer?.text}</Text>
            </Card>

            {/* Waiting status pill */}
            <Card style={styles.waitingCard} variant="highlighted">
              <View style={styles.waitingIconWrapper}>
                <Clock size={28} color={colors.primary} />
              </View>
              <Text style={styles.waitingTitle}>
                Waiting for {partnerProfile?.displayName || 'your partner'}...
              </Text>
              <Text style={styles.waitingSubtitle}>
                As soon as they submit their answer, both responses will unlock side-by-side!
              </Text>
            </Card>
          </View>
        )}

        {/* State 3: Both Answered (Revealed) */}
        {isRevealed && (
          <View style={styles.revealedContainer}>
            <View style={styles.revealBanner}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={styles.revealBannerText}>Both answered! Here's what you wrote:</Text>
            </View>

            {/* My Answer */}
            <Card style={[styles.responseCard, styles.myResponseCard]}>
              <View style={styles.responseHeader}>
                <Avatar name={userProfile?.displayName || 'You'} photoURL={userProfile?.photoURL} size="sm" />
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{userProfile?.displayName || 'You'}</Text>
                  <Text style={styles.statusSub}>You answered</Text>
                </View>
              </View>
              <Text style={styles.responseText}>{myAnswer?.text}</Text>
            </Card>

            {/* Partner's Answer */}
            <Card style={[styles.responseCard, styles.partnerResponseCard]}>
              <View style={styles.responseHeader}>
                <Avatar
                  name={partnerProfile?.displayName || 'Partner'}
                  photoURL={partnerProfile?.photoURL}
                  size="sm"
                  highlighted
                  borderColor={colors.primary}
                />
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{partnerProfile?.displayName || 'Partner'}</Text>
                  <Text style={styles.statusSub}>Partner's answer</Text>
                </View>
                <Heart size={16} color={colors.primary} fill={colors.primary} />
              </View>
              <Text style={styles.responseText}>{partnerAnswer?.text}</Text>
            </Card>
          </View>
        )}

        {/* Explore Card Decks Banner */}
        {onOpenDecks && (
          <TouchableOpacity
            style={styles.decksBanner}
            onPress={onOpenDecks}
            activeOpacity={0.88}
          >
            <View style={styles.decksBannerLeft}>
              <View style={styles.decksBannerIconWrap}>
                <Layers size={22} color={colors.primary} />
              </View>
              <View style={styles.decksBannerTextCol}>
                <Text style={styles.decksBannerTitle}>Want more questions?</Text>
                <Text style={styles.decksBannerSubtitle}>
                  Explore 34 bespoke decks & 850 prompts
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Profile and Settings Modal */}
      <ProfileSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  profileBtn: {
    borderRadius: radii.full,
    ...shadows.sm,
  },
  questionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  deckBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deckText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  subtitleText: {
    fontSize: typography.sizes.xs + 1,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  questionText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
    marginBottom: spacing.md,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  privacyText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  answerCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
  },
  answerCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  answerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  waitingContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  waitingCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
  },
  waitingIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  waitingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    maxWidth: 280,
  },
  revealedContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  revealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderRose,
  },
  revealBannerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  responseCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  myResponseCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  partnerResponseCard: {
    backgroundColor: colors.primarySubtle,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statusSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
  },
  responseText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  decksBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  decksBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  decksBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  decksBannerTextCol: {
    flex: 1,
  },
  decksBannerTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  decksBannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
