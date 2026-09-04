import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ArrowLeft, Zap } from 'lucide-react-native';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, spacing, typography } from '../../../theme';

interface TapBattleScreenProps {
  onBack: () => void;
}

const GAME_DURATION = 5;

export const TapBattleScreen: React.FC<TapBattleScreenProps> = ({ onBack }) => {
  const { coupleId, myUid, partnerUid } = useCouple();
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing' | 'result'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [clicks, setClicks] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];
  const docRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'tap_battle') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const todayData = snap.data()?.[today] || null;
        setSessionData(todayData);
        if (todayData?.[myUid || ''] !== undefined && phase === 'intro') {
          setPhase('result');
        }
      }
    }, (err) => {
      console.warn('[TapBattle] snapshot error:', err);
    });
    return () => unsub();
  }, [coupleId, myUid, phase, today]);

  const startGame = () => {
    setPhase('countdown');
    setCountdown(3);
    setClicks(0);
    setTimeLeft(GAME_DURATION);
  };

  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        setPhase('playing');
      }
    } else if (phase === 'playing') {
      if (timeLeft > 0) {
        const t = setTimeout(() => setTimeLeft(l => l - 1), 1000);
        return () => clearTimeout(t);
      } else {
        endGame();
      }
    }
  }, [phase, countdown, timeLeft]);

  const handleTap = () => {
    if (phase === 'playing') {
      setClicks(c => c + 1);
    }
  };

  const endGame = async () => {
    setPhase('result');
    if (docRef && myUid) {
      await setDoc(docRef, {
        [today]: {
          [myUid]: clicks
        }
      }, { merge: true });
    }
  };

  const myScore = sessionData?.[myUid || ''] ?? null;
  const partnerScore = sessionData?.[partnerUid || ''] ?? null;
  
  let resultText = "Waiting for partner...";
  if (myScore !== null && partnerScore !== null) {
    if (myScore > partnerScore) resultText = "You won! 🏆";
    else if (partnerScore > myScore) resultText = "Partner won! 😅";
    else resultText = "It's a tie! 🤝";
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Tap Battle</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {phase === 'intro' && (
          <View style={styles.center}>
            <Zap size={64} color={colors.primary} style={{ marginBottom: 24 }} />
            <Text style={styles.instructions}>Tap as fast as you can for {GAME_DURATION} seconds.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
              <Text style={styles.primaryBtnText}>Start Battle</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'countdown' && (
          <View style={styles.center}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {phase === 'playing' && (
          <TouchableOpacity activeOpacity={0.9} style={styles.tapArea} onPress={handleTap}>
            <Text style={styles.timeLeft}>{timeLeft}s</Text>
            <Text style={styles.scoreText}>{clicks}</Text>
            <Text style={styles.tapHint}>TAP!</Text>
          </TouchableOpacity>
        )}

        {phase === 'result' && (
          <View style={styles.center}>
            <Text style={styles.resultTitle}>Today's Results</Text>
            <View style={styles.scoreBoard}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>You</Text>
                <Text style={styles.scoreValue}>{myScore !== null ? myScore : '...'}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Partner</Text>
                <Text style={styles.scoreValue}>{partnerScore !== null ? partnerScore : '...'}</Text>
              </View>
            </View>
            <Text style={styles.winnerText}>{resultText}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm },
  title: { ...typography.headlineMd, color: colors.onSurface },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  center: { alignItems: 'center' },
  instructions: { ...typography.bodyLg, textAlign: 'center', marginBottom: spacing.xl, color: colors.onSurfaceVariant },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full },
  primaryBtnText: { ...typography.labelMd, color: colors.onPrimary },
  countdownText: { fontSize: 120, fontWeight: 'bold', color: colors.primary },
  tapArea: { flex: 1, backgroundColor: colors.primaryContainer, borderRadius: radii.xl, justifyContent: 'center', alignItems: 'center' },
  timeLeft: { position: 'absolute', top: spacing.xl, ...typography.headlineMd, color: colors.onPrimaryContainer },
  scoreText: { fontSize: 80, fontWeight: 'bold', color: colors.onPrimaryContainer },
  tapHint: { position: 'absolute', bottom: spacing.xl, ...typography.bodyLg, color: colors.onPrimaryContainer, opacity: 0.5 },
  resultTitle: { ...typography.headlineMd, marginBottom: spacing.xl },
  scoreBoard: { width: '100%', backgroundColor: colors.surfaceContainer, padding: spacing.lg, borderRadius: radii.xl, marginBottom: spacing.xl },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm },
  scoreLabel: { ...typography.bodyLg, color: colors.onSurfaceVariant },
  scoreValue: { ...typography.headlineMd, color: colors.onSurface },
  winnerText: { ...typography.headlineMd, color: colors.primary, textAlign: 'center' },
});
