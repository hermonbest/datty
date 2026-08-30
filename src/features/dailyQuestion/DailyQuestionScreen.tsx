import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Skeleton, useToast } from '../../components';
import { TopAppBar } from '../../components/TopAppBar';
import { useCouple } from '../../services/coupleContext';
import { useDailyQuestion } from './useDailyQuestion';
import { History, Heart } from 'lucide-react-native';

interface DailyQuestionScreenProps {
  onOpenHistory?: () => void;
  onOpenDecks?: () => void;
}

export const DailyQuestionScreen: React.FC<DailyQuestionScreenProps> = ({
  onOpenHistory,
  onOpenDecks,
}) => {
  const { userProfile, partnerProfile } = useCouple();
  const [answerInput, setAnswerInput] = useState('');
  const toast = useToast();
  const insets = useSafeAreaInsets();

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

  // Pulsing heart animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isWaitingForPartner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isWaitingForPartner, pulseAnim]);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <TopAppBar />
        <View style={[styles.main, { paddingTop: 64 + insets.top + spacing.xl }]}>
          <Skeleton width="100%" height={300} borderRadius={radii.xl} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TopAppBar />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 64 + insets.top + spacing.xl }]} 
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Daily Prompt Card */}
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>Daily Prompt</Text>
          
          <Text style={styles.questionText}>
            {question?.text || 'What is one small thing I did this week that made you feel loved?'}
          </Text>

          {/* User Response Area */}
          <View style={styles.userResponseArea}>
            <View style={styles.responseHeader}>
              <Avatar name={userProfile?.displayName || 'You'} photoURL={userProfile?.photoURL} size="xs" />
              <Text style={styles.responseAuthor}>You</Text>
            </View>
            
            {isUnanswered ? (
              <>
                <TextInput
                  placeholder="Write your thoughts..."
                  placeholderTextColor={colors.outlineVariant}
                  value={answerInput}
                  onChangeText={setAnswerInput}
                  multiline
                  style={styles.textArea}
                />
                <View style={styles.submitRow}>
                  <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    <Text style={styles.submitBtnText}>
                      {submitting ? 'Saving...' : 'Save Answer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.submittedText}>{myAnswer?.text}</Text>
            )}
          </View>

          {/* Partner Response Area */}
          {isWaitingForPartner && (
            <View style={styles.waitingArea}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Heart size={24} color={colors.primaryContainer} fill={colors.primaryContainer} style={styles.waitingIcon} />
              </Animated.View>
              <Text style={styles.waitingText}>
                Waiting for {partnerProfile?.displayName || 'your partner'} to answer...
              </Text>
              <Text style={styles.waitingSubText}>
                Your answer is hidden until they respond.
              </Text>
            </View>
          )}

          {isRevealed && (
            <View style={styles.partnerResponseArea}>
              <View style={styles.responseHeader}>
                <Avatar name={partnerProfile?.displayName || 'Partner'} photoURL={partnerProfile?.photoURL} size="xs" />
                <Text style={styles.responseAuthor}>{partnerProfile?.displayName || 'Partner'}</Text>
              </View>
              <Text style={styles.submittedText}>{partnerAnswer?.text}</Text>
            </View>
          )}

        </View>

        {/* See Past Questions Action */}
        {onOpenHistory && (
          <TouchableOpacity style={styles.historyBtn} onPress={onOpenHistory}>
            <History size={18} color={colors.secondary} />
            <Text style={styles.historyBtnText}>See Past Questions</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xxl,
  },
  promptCard: {
    width: '100%',
    maxWidth: 448, // max-w-md
    backgroundColor: 'rgba(232, 221, 223, 0.3)', // bg-secondary-container/30
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 2, // approximation for android
  },
  promptLabel: {
    ...typography.labelMd,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8,
    marginBottom: spacing.sm,
  },
  questionText: {
    ...typography.headlineLgMobile, 
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  userResponseArea: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  responseAuthor: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  textArea: {
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 96, 
    textAlignVertical: 'top',
  },
  submittedText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  submitRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  submitBtnText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  waitingArea: {
    width: '100%',
    backgroundColor: 'rgba(240, 223, 222, 0.5)', // bg-surface-container-highest/50
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(217, 193, 196, 0.5)', // border-outline-variant/50
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  waitingIcon: {
    marginBottom: spacing.sm,
  },
  waitingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  waitingSubText: {
    ...typography.labelSm,
    color: colors.outline,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  partnerResponseArea: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  historyBtnText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
});
