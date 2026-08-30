import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Delete,
  Flame,
  KeyRound,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import {
  evaluateGuess,
  getDailyCoupleWord,
  getRandomCoupleWord,
  isValidWord,
  LetterFeedback,
} from './wordGameLogic';

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
  const [targetWord, setTargetWord] = useState<string>('HEART');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [mode, setMode] = useState<'daily' | 'practice' | 'custom'>('daily');
  const [streak, setStreak] = useState<number>(1);
  const [customWordModalVisible, setCustomWordModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Start new game
  const initGame = (gameMode: 'daily' | 'practice' | 'custom', customWord?: string) => {
    let word = 'HEART';
    if (gameMode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10);
      word = getDailyCoupleWord(todayStr);
    } else if (gameMode === 'practice') {
      word = getRandomCoupleWord();
    } else if (gameMode === 'custom' && customWord) {
      word = customWord.toUpperCase();
    }
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMode(gameMode);
  };

  useEffect(() => {
    initGame('daily');
  }, []);

  const handleKeyPress = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        Alert.alert('Too Short', 'Word must be 5 letters long.');
        return;
      }
      if (!isValidWord(currentGuess) && mode !== 'custom') {
        Alert.alert('Not in Word List', 'Please enter a valid 5-letter word.');
        return;
      }

      const nextGuesses = [...guesses, currentGuess];
      setGuesses(nextGuesses);
      setCurrentGuess('');

      if (currentGuess.toUpperCase() === targetWord.toUpperCase()) {
        setGameStatus('won');
        setStreak((s) => s + 1);
      } else if (nextGuesses.length >= 6) {
        setGameStatus('lost');
      }
    } else if (key === 'BACK') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else {
      if (currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    }
  };

  // Compute key feedback colors for virtual keyboard
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
      case 'correct':
        return '#16A34A'; // Green
      case 'present':
        return '#CA8A04'; // Yellow
      case 'absent':
        return '#78716C'; // Gray
      default:
        return colors.card;
    }
  };

  const getCellTextColor = (feedback?: LetterFeedback) => {
    return feedback && feedback !== 'empty' ? '#FFFFFF' : colors.textPrimary;
  };

  const getKeyBg = (letter: string) => {
    const feedback = keyFeedbackMap[letter];
    if (feedback === 'correct') return '#16A34A';
    if (feedback === 'present') return '#CA8A04';
    if (feedback === 'absent') return '#57534E';
    return colors.card;
  };

  const getKeyTextColor = (letter: string) => {
    const feedback = keyFeedbackMap[letter];
    if (feedback) return '#FFFFFF';
    return colors.textPrimary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Couple Wordle</Text>
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
        >
          <KeyRound size={14} color={mode === 'custom' ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.modePillText, mode === 'custom' && styles.modePillTextActive]}>
            Challenge
          </Text>
        </TouchableOpacity>
      </View>

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
      <View style={styles.keyboardContainer}>
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
                  ]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  {key === 'BACK' ? (
                    <Delete size={18} color={getKeyTextColor(key)} />
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

      {/* Custom Word Modal */}
      <Modal visible={customWordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set a Secret Word</Text>
            <Text style={styles.modalSubtitle}>
              Type a 5-letter romantic or secret word for your partner to guess!
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
                onPress={() => setCustomWordModalVisible(false)}
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
                  setCustomWordModalVisible(false);
                  initGame('custom', customInput.trim());
                  setCustomInput('');
                }}
              >
                <Text style={styles.modalConfirmText}>Start Challenge</Text>
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
    marginVertical: spacing.sm,
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cellText: {
    fontSize: 22,
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
    paddingHorizontal: 4,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  key: {
    minWidth: 32,
    height: 44,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  specialKey: {
    minWidth: 50,
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
});
