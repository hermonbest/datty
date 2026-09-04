import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCouple } from '../../../services/coupleContext';
import { colors, radii, spacing, typography } from '../../../theme';

interface CheckersScreenProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 400);
const CELL_SIZE = BOARD_SIZE / 8;

// Initial board: 8x8. 'b' for black (top), 'w' for white (bottom)
const getInitialBoard = () => {
  const b = Array(64).fill('');
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    if ((row + col) % 2 === 1) {
      if (row < 3) b[i] = 'b';
      else if (row > 4) b[i] = 'w';
    }
  }
  return b;
};

export const CheckersScreen: React.FC<CheckersScreenProps> = ({ onBack }) => {
  const { coupleId, myUid, partnerUid } = useCouple();
  const [session, setSession] = useState<any>(null);
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const docRef = coupleId ? doc(db, 'couples', coupleId, 'games', 'checkers') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSession(snap.data());
      } else {
        setSession(null);
      }
    }, (err) => {
      console.warn('[Checkers] snapshot error:', err);
    });
    return () => unsub();
  }, [coupleId]);

  const startNewGame = async () => {
    if (!docRef) return;
    await setDoc(docRef, {
      player1Uid: myUid, // white
      player2Uid: partnerUid, // black
      board: getInitialBoard(),
      turn: 'w',
      winner: null
    });
  };

  const resetGame = async () => {
    if (docRef) await deleteDoc(docRef);
  };

  const handleCellPress = async (idx: number) => {
    if (!session || session.winner) return;
    const isP1 = session.player1Uid === myUid;
    const myColor = isP1 ? 'w' : 'b';
    
    if (session.turn !== myColor) return; // not my turn

    const piece = session.board[idx];
    
    // Select my piece
    if (piece.toLowerCase() === myColor) {
      setSelectedIdx(idx);
      return;
    }

    // Try to move to empty square
    if (selectedIdx !== null && piece === '') {
      const fromRow = Math.floor(selectedIdx / 8);
      const fromCol = selectedIdx % 8;
      const toRow = Math.floor(idx / 8);
      const toCol = idx % 8;
      
      const rowDiff = toRow - fromRow;
      const colDiff = Math.abs(toCol - fromCol);
      const selPiece = session.board[selectedIdx];
      const isKing = selPiece === selPiece.toUpperCase();

      // Direction check
      const validDir = isKing || (myColor === 'w' ? rowDiff < 0 : rowDiff > 0);
      
      if (validDir) {
        let isValidMove = false;
        let captureIdx = -1;

        // Simple move
        if (Math.abs(rowDiff) === 1 && colDiff === 1) {
          isValidMove = true;
        } 
        // Jump move
        else if (Math.abs(rowDiff) === 2 && colDiff === 2) {
          const midRow = fromRow + rowDiff / 2;
          const midCol = fromCol + (toCol - fromCol) / 2;
          captureIdx = midRow * 8 + midCol;
          const midPiece = session.board[captureIdx];
          if (midPiece && midPiece.toLowerCase() !== myColor) {
            isValidMove = true;
          }
        }

        if (isValidMove) {
          const newBoard = [...session.board];
          newBoard[idx] = selPiece;
          newBoard[selectedIdx] = '';
          if (captureIdx !== -1) newBoard[captureIdx] = '';
          
          // King promotion
          if (myColor === 'w' && toRow === 0) newBoard[idx] = 'W';
          if (myColor === 'b' && toRow === 7) newBoard[idx] = 'B';

          // Check win condition (no enemy pieces left)
          const enemyColor = myColor === 'w' ? 'b' : 'w';
          const hasEnemy = newBoard.some(p => p.toLowerCase() === enemyColor);
          
          await setDoc(docRef!, {
            board: newBoard,
            turn: enemyColor,
            winner: hasEnemy ? null : myUid
          }, { merge: true });
          
          setSelectedIdx(null);
        }
      }
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={styles.title}>Checkers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.instructions}>Play a classic game of Checkers.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={startNewGame}>
            <Text style={styles.primaryBtnText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isP1 = session.player1Uid === myUid;
  const myColor = isP1 ? 'w' : 'b';
  const isMyTurn = session.turn === myColor;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={colors.onSurface} /></TouchableOpacity>
        <Text style={styles.title}>Checkers</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.centerContent}>
        {session.winner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{session.winner === myUid ? 'You Won! 🏆' : 'Partner Won! 😅'}</Text>
          </View>
        ) : (
          <View style={styles.banner}>
            <Text style={[styles.bannerText, {color: isMyTurn ? colors.primary : colors.onSurfaceVariant}]}>
              {isMyTurn ? "Your Turn" : "Partner's Turn"}
            </Text>
          </View>
        )}

        <View style={[styles.boardContainer, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {session.board.map((piece: string, i: number) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isDark = (row + col) % 2 === 1;
            const isSelected = selectedIdx === i;

            // Invert board if black, so my pieces are always at the bottom
            const visualRow = myColor === 'w' ? row : 7 - row;
            const visualCol = myColor === 'w' ? col : 7 - col;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cell,
                  { 
                    backgroundColor: isDark ? colors.primary + '40' : colors.surfaceContainer,
                    top: visualRow * CELL_SIZE,
                    left: visualCol * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  },
                  isSelected && { borderWidth: 2, borderColor: colors.primary }
                ]}
                onPress={() => handleCellPress(i)}
                activeOpacity={0.8}
              >
                {piece !== '' && (
                  <View style={[
                    styles.piece,
                    piece.toLowerCase() === 'w' ? styles.pieceWhite : styles.pieceBlack
                  ]}>
                    {piece === piece.toUpperCase() && <Text style={{color: 'gold', fontWeight: 'bold'}}>K</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <TouchableOpacity style={styles.outlineBtn} onPress={resetGame}>
          <Text style={styles.outlineBtnText}>Reset Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm },
  title: { ...typography.headlineMd, color: colors.onSurface },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  instructions: { ...typography.bodyLg, textAlign: 'center', marginBottom: spacing.xl, color: colors.onSurfaceVariant },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.full },
  primaryBtnText: { ...typography.labelMd, color: colors.onPrimary },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full, marginTop: spacing.xl },
  outlineBtnText: { ...typography.labelMd, color: colors.primary },
  banner: { marginBottom: spacing.xl },
  bannerText: { ...typography.headlineMd },
  boardContainer: { backgroundColor: colors.surfaceContainer, borderWidth: 2, borderColor: colors.outline },
  cell: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  piece: { width: '80%', height: '80%', borderRadius: 999, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4 },
  pieceWhite: { backgroundColor: '#f0f0f0', borderWidth: 2, borderColor: '#ccc' },
  pieceBlack: { backgroundColor: '#222', borderWidth: 2, borderColor: '#000' },
});
