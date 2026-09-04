import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Flame, RefreshCw } from 'lucide-react-native';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, spacing, typography } from '../../../theme';

const PROMPTS = [
  "Long distance makes relationships stronger.",
  "You should share all your passwords with your partner.",
  "Sleeping in separate beds is sometimes better.",
  "It's okay to stay friends with exes.",
  "Money is the biggest cause of relationship stress.",
  "Public displays of affection are annoying.",
  "Couples should have shared bank accounts.",
  "White lies are acceptable to spare feelings.",
  "A relationship can survive infidelity.",
  "Opposites attract and make the best couples."
];

interface HotTakesScreenProps {
  onBack: () => void;
}

export const HotTakesScreen: React.FC<HotTakesScreenProps> = ({ onBack }) => {
  const { coupleId, myUid, partnerUid } = useCouple();
  const [session, setSession] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);

  const docRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'hot_takes') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSession(snap.data());
      } else {
        setSession(null);
      }
    }, (err) => {
      console.warn('[HotTakes] snapshot error:', err);
    });
    return () => unsub();
  }, [coupleId]);

  const startNewGame = async () => {
    if (!docRef) return;
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    await setDoc(docRef, {
      promptText: randomPrompt,
      player1Uid: myUid,
      player2Uid: partnerUid,
      [myUid as string]: null,
      [partnerUid as string]: null
    });
  };

  const submitRating = async () => {
    if (!docRef || !myUid) return;
    await setDoc(docRef, { [myUid]: rating }, { merge: true });
  };

  const resetGame = async () => {
    if (docRef) await deleteDoc(docRef);
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Hot Takes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Flame size={64} color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={styles.instructions}>Rate bold statements from 1 (Strongly Disagree) to 10 (Strongly Agree).</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={startNewGame}>
            <Text style={styles.primaryBtnText}>Draw a Prompt</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const myRating = session[myUid || ''];
  const partnerRating = session[partnerUid || ''];
  const isWaitingForMe = myRating === null;
  const isWaitingForPartner = partnerRating === null;

  if (isWaitingForMe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Hot Takes</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.promptCard}>
            <Text style={styles.promptText}>"{session.promptText}"</Text>
          </View>
          
          <Text style={styles.label}>Your Rating: {rating}</Text>
          <View style={styles.ratingRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(val => (
              <TouchableOpacity 
                key={val} 
                style={[styles.ratingBtn, rating === val && styles.ratingBtnActive]}
                onPress={() => setRating(val)}
              >
                <Text style={[styles.ratingBtnText, rating === val && styles.ratingBtnTextActive]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingLabels}>
            <Text style={styles.ratingLabelSm}>Strongly Disagree</Text>
            <Text style={styles.ratingLabelSm}>Strongly Agree</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={submitRating}>
            <Text style={styles.primaryBtnText}>Submit Blind Rating</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isWaitingForPartner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Hot Takes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.instructions}>You rated {myRating}/10.</Text>
          <Text style={styles.instructions}>Waiting for partner to submit their blind rating...</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={resetGame}>
            <Text style={styles.outlineBtnText}>Cancel Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Both have rated
  const gap = Math.abs(myRating - partnerRating);
  let gapText = "You're perfectly aligned! 🎯";
  if (gap > 0 && gap <= 3) gapText = "Pretty close! 🤝";
  if (gap > 3 && gap <= 6) gapText = "Noticeable difference 🤔";
  if (gap > 6) gapText = "Opposite sides! 🌶️";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
        <Text style={styles.title}>The Reveal</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>"{session.promptText}"</Text>
        </View>

        <View style={styles.resultBanner}>
          <Text style={styles.resultBannerText}>{gapText}</Text>
          <Text style={styles.gapText}>Gap: {gap} points</Text>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>You</Text>
            <Text style={styles.scoreValue}>{myRating}/10</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Partner</Text>
            <Text style={styles.scoreValue}>{partnerRating}/10</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={startNewGame}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <RefreshCw size={20} color={colors.onPrimary} style={{marginRight: 8}} />
            <Text style={styles.primaryBtnText}>Next Prompt</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm },
  title: { ...typography.headlineMd, color: colors.onSurface },
  content: { flex: 1, padding: spacing.lg },
  centerContent: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  instructions: { ...typography.bodyLg, textAlign: 'center', marginBottom: spacing.xl, color: colors.onSurfaceVariant },
  promptCard: { backgroundColor: colors.surfaceContainer, padding: spacing.xl, borderRadius: radii.xl, marginBottom: spacing.xl, alignItems: 'center' },
  promptText: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center', fontStyle: 'italic' },
  label: { ...typography.bodyLg, color: colors.onSurface, marginBottom: spacing.md, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  ratingBtnActive: { backgroundColor: colors.primary },
  ratingBtnText: { ...typography.bodyLg, color: colors.onSurface },
  ratingBtnTextActive: { color: colors.onPrimary },
  ratingLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  ratingLabelSm: { ...typography.labelSm, color: colors.onSurfaceVariant },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radii.full, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { ...typography.labelMd, color: colors.onPrimary },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full },
  outlineBtnText: { ...typography.labelMd, color: colors.primary },
  resultBanner: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg, backgroundColor: 'rgba(255, 99, 71, 0.1)', borderRadius: radii.xl },
  resultBannerText: { ...typography.headlineMd, color: colors.primary, textAlign: 'center', marginBottom: 4 },
  gapText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  scoreBoard: { width: '100%', backgroundColor: colors.surfaceContainer, padding: spacing.lg, borderRadius: radii.xl, marginBottom: spacing.xl },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm },
  scoreLabel: { ...typography.bodyLg, color: colors.onSurfaceVariant },
  scoreValue: { ...typography.headlineMd, color: colors.primary, fontWeight: 'bold' },
});
