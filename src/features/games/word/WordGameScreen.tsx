import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Delete,
  Flame,
  KeyRound,
  Clock,
  X,
} from 'lucide-react-native';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import {
  evaluateGuess,
  getDailyCoupleWord,
  getRandomCoupleWord,
  checkWordValid,
  LetterFeedback,
} from './wordGameLogic';
import { gameLog, startGameTimer } from '../gameLogger';

interface WordGameScreenProps {
  onBack: () => void;
  onShareToChat?: (text: string) => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export const WordGameScreen: React.FC<WordGameScreenProps> = ({ onBack, onShareToChat }) => {
  const insets = useSafeAreaInsets();
  const { coupleId, myUid } = useCouple();

  // Challenge mode Firestore state
  const [challengeDoc, setChallengeDoc] = useState<any>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);

  // Local game state
  const [targetWord, setTargetWord] = useState<string>('HEART');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [mode, setMode] = useState<'daily' | 'practice' | 'custom'>('daily');
  const [streak, setStreak] = useState<number>(1);
  const [customWordModalVisible, setCustomWordModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [validating, setValidating] = useState(false);

  const challengeRef = coupleId
    ? doc(db, 'couples', coupleId, 'games', 'word_guess')
    : null;

  // Listen for active challenge
  useEffect(() => {
    if (!challengeRef) {
      setChallengeLoading(false);
      return;
    }
    const unsub = onSnapshot(challengeRef, (snap) => {
      setChallengeDoc(snap.exists() ? snap.data() : null);
      setChallengeLoading(false);
    }, () => {
      setChallengeLoading(false);
    });
    return () => unsub();
  }, [coupleId]);

  // When a challenge becomes active and I'm the guesser, load it
  useEffect(() => {
    if (
      challengeDoc &&
      challengeDoc.setterUid !== myUid &&
      !challengeDoc.guessedBy
    ) {
      // Partner set a word — switch to challenge mode without revealing word until needed
      setMode('custom');
      setTargetWord(challengeDoc.word);
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
    }
  }, [challengeDoc, myUid]);

  // Start new game (daily / practice)
  const initGame = (gameMode: 'daily' | 'practice') => {
    const timer = startGameTimer('WordGame', 'InitGame', { gameMode });
    let word = 'HEART';
    if (gameMode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10);
      word = getDailyCoupleWord(todayStr);
    } else {
      word = getRandomCoupleWord();
    }
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMode(gameMode);
    timer.stop({ wordLength: word.length });
  };

  useEffect(() => {
    initGame('daily');
  }, []);

  const handleKeyPress = useCallback(async (key: string) => {
    if (gameStatus !== 'playing' || validating) return;

    if (key === 'ENTER') {
      const submitTimer = startGameTimer('WordGame', 'SubmitGuess', {
        guess: currentGuess,
        targetLength: targetWord.length,
        guessNumber: guesses.length + 1,
      });

      if (currentGuess.length !== 5) {
        submitTimer.stop({ rejected: 'Too short' });
        Alert.alert('Too Short', 'Word must be 5 letters long.');
        return;
      }
      // In custom (challenge) mode skip dictionary check
      if (mode !== 'custom') {
        setValidating(true);
        const valid = await checkWordValid(currentGuess);
        setValidating(false);
        if (!valid) {
          submitTimer.stop({ rejected: 'Invalid word' });
          Alert.alert('Not a Word', `"${currentGuess}" wasn't found in the dictionary.`);
          return;
        }
      }

      const nextGuesses = [...guesses, currentGuess];
      setGuesses(nextGuesses);
      setCurrentGuess('');

      const isWin = currentGuess.toUpperCase() === targetWord.toUpperCase();
      if (isWin) {
        setGameStatus('won');
        setStreak((s) => s + 1);
        submitTimer.stop({ status: 'won', guessCount: nextGuesses.length });
        // Mark challenge as solved so setter can see result
        if (mode === 'custom' && challengeRef && myUid) {
          setDoc(challengeRef, { guessedBy: myUid, won: true, attempts: nextGuesses.length }, { merge: true });
        }
      } else if (nextGuesses.length >= 6) {
        setGameStatus('lost');
        submitTimer.stop({ status: 'lost', targetWord });
        if (mode === 'custom' && challengeRef && myUid) {
          setDoc(challengeRef, { guessedBy: myUid, won: false, attempts: 6 }, { merge: true });
        }
      } else {
        submitTimer.stop({ status: 'playing', remaining: 6 - nextGuesses.length });
      }
    } else if (key === 'BACK') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else {
      if (currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    }
  }, [gameStatus, validating, currentGuess, guesses, targetWord, mode, streak, challengeRef, myUid]);

  // Submit a challenge word to Firestore
  const submitChallenge = async (word: string) => {
    if (!challengeRef || !myUid) return;
    await setDoc(challengeRef, {
      word: word.toUpperCase(),
      setterUid: myUid,
      guessedBy: null,
      won: null,
      attempts: null,
    });
    setCustomWordModalVisible(false);
    setCustomInput('');
    setMode('custom'); // switch UI to challenge mode for setter
  };

  const cancelChallenge = async () => {
    if (challengeRef) await deleteDoc(challengeRef);
    // Drop back to daily
    initGame('daily');
  };

  // Compute key feedback colors
  const keyFeedbackMap: Record<string, LetterFeedback> = {};
  guesses.forEach((guess) => {
    const feedback = evaluateGuess(guess, targetWord);
    guess.split('').forEach((letter, i) => {
      const currentFeedback = keyFeedbackMap[letter];
      const newFeedback = feedback[i];
      if (newFeedback === 'correct' || (!currentFeedback && newFeedback !== 'empty')) {
        keyFeedbackMap[letter] = newFeedback;
      } else if (newFeedback === 'present' && currentFeedback !== 'correct') {
        keyFeedbackMap[letter] = 'present';
      }
    });
  });

  const getCellBg = (feedback?: LetterFeedback) => {
    switch (feedback) {
      case 'correct': return '#16A34A';
      case 'present': return '#CA8A04';
      case 'absent': return '#78716C';
      default: return colors.card;
    }
  };
  const getCellTextColor = (feedback?: LetterFeedback) =>
    feedback && feedback !== 'empty' ? '#FFFFFF' : colors.textPrimary;
  const getKeyBg = (letter: string) => {
    const f = keyFeedbackMap[letter];
    if (f === 'correct') return '#16A34A';
    if (f === 'present') return '#CA8A04';
    if (f === 'absent') return '#57534E';
    return colors.card;
  };
  const getKeyTextColor = (letter: string) =>
    keyFeedbackMap[letter] ? '#FFFFFF' : colors.textPrimary;

  // ── Setter waiting screen ─────────────────────────────────────────────────
  const amSetter = challengeDoc && challengeDoc.setterUid === myUid && !challengeDoc.guessedBy;
  const challengeResult = challengeDoc && challengeDoc.setterUid === myUid && challengeDoc.guessedBy;

  if (amSetter) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Word Guess</Text>
            <Text style={styles.headerSubtitle}>Partner Challenge</Text>
          </View>
          <TouchableOpacity onPress={cancelChallenge} style={styles.backButton} activeOpacity={0.7}>
            <X size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.waitingContainer}>
          <Clock size={56} color={colors.primary} />
          <Text style={styles.waitingTitle}>Waiting for {'\u2764\uFE0F'}</Text>
          <Text style={styles.waitingBody}>
            Your partner needs to guess the word you set.{'\n'}Come back here when they've played!
          </Text>
          <Text style={styles.waitingWord}>
            Your word: {challengeDoc.word.split('').map(() => '●').join(' ')}
          </Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelChallenge}>
            <Text style={styles.cancelBtnText}>Cancel Challenge</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Setter result screen ──────────────────────────────────────────────────
  if (challengeResult) {
    const won = challengeDoc.won;
    const attempts = challengeDoc.attempts;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Word Guess</Text>
            <Text style={styles.headerSubtitle}>Challenge Result</Text>
          </View>
        </View>
        <View style={styles.waitingContainer}>
          <Trophy size={56} color={won ? '#16A34A' : colors.error} />
          <Text style={styles.waitingTitle}>
            {won ? `Partner got it! 🎉` : `Too tough! 😈`}
          </Text>
          <Text style={styles.waitingBody}>
            The word was{' '}
            <Text style={{ fontWeight: 'bold', color: colors.primary }}>{challengeDoc.word}</Text>
            {won ? `\nGuessed in ${attempts} attempt${attempts !== 1 ? 's' : ''}!` : '\nThey ran out of guesses!'}
          </Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelChallenge}>
            <Text style={styles.cancelBtnText}>Start New Challenge</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Word Guess</Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'daily' ? 'Daily Word' : mode === 'custom' ? 'Partner Challenge' : 'Practice Mode'}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Flame size={16} color="#EA580C" />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modePill, mode === 'daily' && styles.modePillActive]}
          onPress={() => initGame('daily')}
          activeOpacity={0.7}
        >
          <Sparkles size={14} color={mode === 'daily' ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.modePillText, mode === 'daily' && styles.modePillTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modePill, mode === 'practice' && styles.modePillActive]}
          onPress={() => initGame('practice')}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={mode === 'practice' ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.modePillText, mode === 'practice' && styles.modePillTextActive]}>
            Random
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modePill, mode === 'custom' && styles.modePillActive]}
          onPress={() => setCustomWordModalVisible(true)}
          activeOpacity={0.7}
          disabled={challengeLoading}
        >
          <KeyRound size={14} color={mode === 'custom' ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.modePillText, mode === 'custom' && styles.modePillTextActive]}>
            Challenge
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active guesser challenge banner */}
      {mode === 'custom' && challengeDoc && challengeDoc.setterUid !== myUid && !challengeDoc.guessedBy && (
        <View style={styles.challengeBanner}>
          <Text style={styles.challengeBannerText}>
            🎯 Your partner set this word — can you guess it?
          </Text>
        </View>
      )}

      {/* Word Grid */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const isSubmitted = rowIndex < guesses.length;
          const isCurrent = rowIndex === guesses.length;
          const rowGuess = isSubmitted
            ? guesses[rowIndex]
            : isCurrent
            ? currentGuess.padEnd(5, ' ')
            : '     ';
          const feedback = isSubmitted ? evaluateGuess(rowGuess, targetWord) : undefined;

          return (
            <View key={rowIndex} style={styles.gridRow}>
              {Array.from({ length: 5 }).map((__, colIndex) => {
                const char = rowGuess[colIndex] || ' ';
                const cellFeedback = feedback ? feedback[colIndex] : undefined;
                return (
                  <View
                    key={colIndex}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: getCellBg(cellFeedback),
                        borderColor: isCurrent && char !== ' ' ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.cellText, { color: getCellTextColor(cellFeedback) }]}>
                      {char.trim()}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Game Status Result Banner */}
      {gameStatus !== 'playing' && (
        <View style={[styles.resultBanner, gameStatus === 'won' ? styles.wonBanner : styles.lostBanner]}>
          <View style={styles.resultHeader}>
            <Trophy size={20} color={gameStatus === 'won' ? '#16A34A' : '#DC2626'} />
            <Text style={styles.resultTitle}>
              {gameStatus === 'won' ? 'Brilliant! You guessed it! ❤️' : `The word was ${targetWord}`}
            </Text>
          </View>
          <View style={styles.resultActions}>
            {onShareToChat && (
              <TouchableOpacity
                style={styles.resultShareBtn}
                onPress={() =>
                  onShareToChat(
                    `We solved today's Couple Wordle "${targetWord}" in ${guesses.length}/6 attempts! 💖`
                  )
                }
              >
                <Share2 size={16} color={colors.textPrimary} />
                <Text style={styles.resultShareBtnText}>Share to Chat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.resultPlayAgainBtn}
              onPress={() => initGame('practice')}
            >
              <Text style={styles.resultPlayAgainBtnText}>Play Next Word</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Virtual Keyboard */}
      <View style={[styles.keyboardContainer, { paddingBottom: 76 + insets.bottom }]}>
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.keyboardRow}>
            {row.map((key) => {
              const isSpecial = key === 'ENTER' || key === 'BACK';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    isSpecial && styles.specialKey,
                    { backgroundColor: getKeyBg(key) },
                    validating && styles.keyDisabled,
                  ]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                  disabled={validating}
                >
                  {key === 'BACK' ? (
                    <Delete size={18} color={getKeyTextColor(key)} />
                  ) : key === 'ENTER' && validating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.keyText,
                        isSpecial && styles.specialKeyText,
                        { color: getKeyTextColor(key) },
                      ]}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Set Challenge Word Modal */}
      <Modal visible={customWordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set a Secret Word</Text>
            <Text style={styles.modalSubtitle}>
              Type a 5-letter word for your partner to guess — they won't see it until the game ends!
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. KISSY, ROSES, DREAM"
              placeholderTextColor={colors.textMuted}
              value={customInput}
              onChangeText={(t) => setCustomInput(t.toUpperCase())}
              maxLength={5}
              autoCapitalize="characters"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setCustomWordModalVisible(false); setCustomInput(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  if (customInput.trim().length !== 5) {
                    Alert.alert('Invalid', 'Please enter exactly 5 letters.');
                    return;
                  }
                  submitChallenge(customInput.trim());
                }}
              >
                <Text style={styles.modalConfirmText}>Send Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  streakText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#EA580C',
  },
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cellText: {
    fontSize: 20,
    fontWeight: typography.weights.heavy,
  },
  resultBanner: {
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  wonBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  lostBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  resultShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resultShareBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  resultPlayAgainBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  resultPlayAgainBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  keyboardContainer: {
    marginTop: 'auto',
    paddingBottom: spacing.sm,
    width: '100%',
    gap: 5,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  key: {
    flex: 1,
    height: 44,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  specialKey: {
    flex: 1.6,
  },
  keyText: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  specialKeyText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  waitingTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  waitingBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  waitingWord: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 6,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  challengeBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  challengeBannerText: {
    fontSize: typography.sizes.xs,
    color: '#EA580C',
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  keyDisabled: {
    opacity: 0.45,
  },
});
