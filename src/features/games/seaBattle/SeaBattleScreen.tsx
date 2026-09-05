import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Anchor } from 'lucide-react-native';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, spacing, typography } from '../../../theme';

interface SeaBattleScreenProps {
  onBack: () => void;
}

const BOARD_SIZE = 5;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
const REQUIRED_SHIPS = 5;

export const SeaBattleScreen: React.FC<SeaBattleScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { coupleId, myUid, partnerUid } = useCouple();
  const [session, setSession] = useState<any>(null);
  
  // Local setup state
  const [mySetupShips, setMySetupShips] = useState<number[]>([]);

  const docRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'sea_battle') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSession(snap.data());
      } else {
        setSession(null);
      }
    }, (err) => {
      console.warn('[SeaBattle] snapshot error:', err);
    });
    return () => unsub();
  }, [coupleId]);

  const startNewGame = async () => {
    if (!docRef) return;
    await setDoc(docRef, {
      player1Uid: myUid,
      player2Uid: partnerUid,
      status: 'setup',
      p1Ships: [],
      p2Ships: [],
      p1Guesses: [],
      p2Guesses: [],
      turn: myUid
    });
    setMySetupShips([]);
  };

  const submitSetup = async () => {
    if (!docRef || !myUid) return;
    const isP1 = session.player1Uid === myUid;
    const update: any = isP1 ? { p1Ships: mySetupShips } : { p2Ships: mySetupShips };
    
    // Check if partner also setup, then move to playing
    const partnerShips = isP1 ? session.p2Ships : session.p1Ships;
    if (partnerShips && partnerShips.length === REQUIRED_SHIPS) {
      update.status = 'playing';
    }
    
    await setDoc(docRef, update, { merge: true });
  };

  const makeGuess = async (index: number) => {
    if (!docRef || !myUid || session.turn !== myUid || session.status !== 'playing') return;
    
    const isP1 = session.player1Uid === myUid;
    const myGuesses = isP1 ? session.p1Guesses || [] : session.p2Guesses || [];
    if (myGuesses.includes(index)) return; // already guessed
    
    const newGuesses = [...myGuesses, index];
    const update: any = isP1 ? { p1Guesses: newGuesses } : { p2Guesses: newGuesses };
    
    // Check win
    const partnerShips = isP1 ? session.p2Ships : session.p1Ships;
    const hits = newGuesses.filter(g => partnerShips.includes(g)).length;
    
    if (hits === REQUIRED_SHIPS) {
      update.status = 'gameOver';
      update.winner = myUid;
    } else {
      update.turn = partnerUid; // pass turn
    }
    
    await setDoc(docRef, update, { merge: true });
  };

  const resetGame = async () => {
    if (docRef) await deleteDoc(docRef);
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Sea Battle</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <Anchor size={64} color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={styles.instructions}>Hide 5 ships on a 5x5 grid and take turns guessing your partner's ship locations.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={startNewGame}>
            <Text style={styles.primaryBtnText}>Start Game</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isP1 = session.player1Uid === myUid;
  const myShips = isP1 ? session.p1Ships : session.p2Ships;
  const partnerShips = isP1 ? session.p2Ships : session.p1Ships;
  const myGuesses = isP1 ? session.p1Guesses || [] : session.p2Guesses || [];
  const partnerGuesses = isP1 ? session.p2Guesses || [] : session.p1Guesses || [];

  const iHaveSetup = myShips && myShips.length === REQUIRED_SHIPS;

  if (session.status === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Setup Fleet</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {!iHaveSetup ? (
            <>
              <Text style={styles.instructions}>Tap 5 squares to hide your ships ({mySetupShips.length}/{REQUIRED_SHIPS})</Text>
              <View style={styles.board}>
                {Array.from({length: TOTAL_CELLS}).map((_, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.cell, mySetupShips.includes(i) && styles.cellShip]}
                    onPress={() => {
                      if (mySetupShips.includes(i)) setMySetupShips(s => s.filter(x => x !== i));
                      else if (mySetupShips.length < REQUIRED_SHIPS) setMySetupShips(s => [...s, i]);
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity 
                style={[styles.primaryBtn, mySetupShips.length < REQUIRED_SHIPS && {opacity: 0.5}]} 
                onPress={submitSetup}
                disabled={mySetupShips.length < REQUIRED_SHIPS}
              >
                <Text style={styles.primaryBtnText}>Ready</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.instructions}>Waiting for partner to set up their fleet...</Text>
              <TouchableOpacity style={styles.outlineBtn} onPress={resetGame}>
                <Text style={styles.outlineBtnText}>Cancel Game</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isMyTurn = session.turn === myUid;

  if (session.status === 'playing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>{isMyTurn ? "Your Turn" : "Partner's Turn"}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Enemy Waters</Text>
          <View style={styles.board}>
            {Array.from({length: TOTAL_CELLS}).map((_, i) => {
              const isGuessed = myGuesses.includes(i);
              const isHit = isGuessed && partnerShips.includes(i);
              const isMiss = isGuessed && !isHit;
              
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.cell, 
                    isHit && styles.cellHit,
                    isMiss && styles.cellMiss,
                    !isMyTurn && {opacity: 0.8}
                  ]}
                  onPress={() => makeGuess(i)}
                  disabled={!isMyTurn || isGuessed}
                >
                  {isHit && <Text style={styles.cellText}>💥</Text>}
                  {isMiss && <Text style={styles.cellText}>🌊</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{height: 24}} />
          <Text style={styles.label}>Your Waters (Hits taken: {partnerGuesses.filter((g:number) => myShips.includes(g)).length}/{REQUIRED_SHIPS})</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // gameOver
  const iWon = session.winner === myUid;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
        <Text style={styles.title}>Game Over</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultBannerText}>{iWon ? "You sank their fleet! 🏆" : "Your fleet was sunk! ☠️"}</Text>
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
  centerContent: { flexGrow: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  instructions: { ...typography.bodyLg, textAlign: 'center', marginBottom: spacing.xl, color: colors.onSurfaceVariant },
  label: { ...typography.bodyLg, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  board: { width: 300, height: 300, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surfaceContainerHigh, padding: 4, borderRadius: radii.md },
  cell: { width: '18%', height: '18%', margin: '1%', backgroundColor: colors.surfaceContainerHighest, borderRadius: radii.sm, justifyContent: 'center', alignItems: 'center' },
  cellShip: { backgroundColor: colors.primary },
  cellHit: { backgroundColor: colors.error },
  cellMiss: { backgroundColor: 'lightblue' },
  cellText: { fontSize: 24 },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.full, alignItems: 'center', marginTop: spacing.xl },
  primaryBtnText: { ...typography.labelMd, color: colors.onPrimary },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full, marginTop: spacing.xl },
  outlineBtnText: { ...typography.labelMd, color: colors.primary },
  resultBannerText: { ...typography.headlineLg, color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
});
