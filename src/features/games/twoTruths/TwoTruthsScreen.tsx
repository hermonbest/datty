import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, Check, X } from 'lucide-react-native';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, spacing, typography } from '../../../theme';

interface TwoTruthsScreenProps {
  onBack: () => void;
}

export const TwoTruthsScreen: React.FC<TwoTruthsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { coupleId, myUid, partnerUid } = useCouple();
  const [session, setSession] = useState<any>(null);
  
  // Creator form state
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [lieIndex, setLieIndex] = useState(0);

  const docRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'two_truths') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSession(snap.data());
      } else {
        setSession(null);
      }
    }, (err) => {
      console.warn('[TwoTruths] snapshot error:', err);
    });
    return () => unsub();
  }, [coupleId]);

  const submitGame = async () => {
    if (!docRef || !s1.trim() || !s2.trim() || !s3.trim()) return;
    
    const statements = [
      { text: s1, isLie: lieIndex === 0 },
      { text: s2, isLie: lieIndex === 1 },
      { text: s3, isLie: lieIndex === 2 },
    ];
    
    await setDoc(docRef, {
      creatorUid: myUid,
      guesserUid: partnerUid,
      statements,
      guessedIndex: null
    });
  };

  const makeGuess = async (index: number) => {
    if (!docRef) return;
    await setDoc(docRef, { guessedIndex: index }, { merge: true });
  };

  const resetGame = async () => {
    if (docRef) await deleteDoc(docRef);
  };

  // Render logic based on session state
  if (!session) {
    // Phase 1: Create Game
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Two Truths, One Lie</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.instructions}>Enter 3 statements. Select the one that is a lie.</Text>
          {[0,1,2].map(idx => (
            <View key={idx} style={[styles.inputRow, lieIndex === idx && styles.selectedRow]}>
              <TouchableOpacity onPress={() => setLieIndex(idx)} style={styles.radio}>
                {lieIndex === idx && <View style={styles.radioInner} />}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder={`Statement ${idx + 1}`}
                placeholderTextColor={colors.onSurfaceVariant}
                value={idx === 0 ? s1 : idx === 1 ? s2 : s3}
                onChangeText={idx === 0 ? setS1 : idx === 1 ? setS2 : setS3}
                multiline
              />
            </View>
          ))}
          <TouchableOpacity 
            style={[styles.primaryBtn, (!s1 || !s2 || !s3) && {opacity: 0.5}]} 
            onPress={submitGame}
            disabled={!s1 || !s2 || !s3}
          >
            <Text style={styles.primaryBtnText}>Send to Partner</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isCreator = session.creatorUid === myUid;
  const isWaiting = session.guessedIndex === null;

  if (isWaiting) {
    if (isCreator) {
      // Phase 2a: Creator waiting
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
            <Text style={styles.title}>Two Truths, One Lie</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <MessageSquare size={64} color={colors.primary} style={{ marginBottom: 24 }} />
            <Text style={styles.instructions}>Waiting for your partner to guess...</Text>
            <TouchableOpacity style={styles.outlineBtn} onPress={resetGame}>
              <Text style={styles.outlineBtnText}>Cancel Game</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    } else {
      // Phase 2b: Guesser guessing
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
            <Text style={styles.title}>Two Truths, One Lie</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
            <Text style={styles.instructions}>Your partner sent these. Which one is the lie?</Text>
            {session.statements.map((stmt: any, idx: number) => (
              <TouchableOpacity key={idx} style={styles.guessCard} onPress={() => makeGuess(idx)}>
                <Text style={styles.guessCardText}>{stmt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      );
    }
  }

  // Phase 3: Revealed
  const correctLieIndex = session.statements.findIndex((s: any) => s.isLie);
  const guessedCorrectly = session.guessedIndex === correctLieIndex;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
        <Text style={styles.title}>Results</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
        <View style={styles.resultBanner}>
          <Text style={styles.resultBannerText}>
            {guessedCorrectly ? (isCreator ? "They guessed it! 🎯" : "You got it right! 🎯") : (isCreator ? "They got fooled! 🎭" : "You got fooled! 🎭")}
          </Text>
        </View>

        {session.statements.map((stmt: any, idx: number) => {
          const isLie = stmt.isLie;
          const wasGuessed = session.guessedIndex === idx;
          
          let bgColor = colors.surfaceContainer;
          let borderColor = 'transparent';
          
          if (isLie) {
            bgColor = 'rgba(255, 99, 71, 0.1)';
            borderColor = 'tomato';
          }
          if (wasGuessed && !isLie) {
            bgColor = 'rgba(255, 99, 71, 0.05)';
            borderColor = colors.error;
          }

          return (
            <View key={idx} style={[styles.resultCard, { backgroundColor: bgColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.resultRow}>
                <Text style={styles.resultText}>{stmt.text}</Text>
                {isLie && <Text style={{color: 'tomato', fontWeight: 'bold'}}>LIE</Text>}
                {!isLie && <Text style={{color: colors.primary, fontWeight: 'bold'}}>TRUTH</Text>}
              </View>
              {wasGuessed && (
                <View style={{marginTop: 8}}>
                  <Text style={{color: colors.onSurfaceVariant, fontSize: 12}}>
                    {isCreator ? "Partner guessed this" : "You guessed this"}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={resetGame}>
          <Text style={styles.primaryBtnText}>Play Again</Text>
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
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg, flexGrow: 1 },
  centerContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  instructions: { ...typography.bodyLg, textAlign: 'center', marginBottom: spacing.xl, color: colors.onSurfaceVariant },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: radii.lg, padding: spacing.md },
  selectedRow: { borderColor: colors.primary, borderWidth: 1 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface, minHeight: 60, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radii.full, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { ...typography.labelMd, color: colors.onPrimary },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full },
  outlineBtnText: { ...typography.labelMd, color: colors.primary },
  guessCard: { backgroundColor: colors.surfaceContainer, padding: spacing.xl, borderRadius: radii.xl, marginBottom: spacing.md },
  guessCardText: { ...typography.bodyLg, color: colors.onSurface },
  resultBanner: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg },
  resultBannerText: { ...typography.headlineLg, color: colors.primary, textAlign: 'center' },
  resultCard: { padding: spacing.lg, borderRadius: radii.lg, marginBottom: spacing.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultText: { ...typography.bodyLg, color: colors.onSurface, flex: 1, marginRight: 8 },
});
