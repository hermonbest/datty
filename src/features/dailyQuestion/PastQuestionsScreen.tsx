import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCouple } from '../../services/coupleContext';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Card, Avatar, Skeleton, EmptyState } from '../../components';
import { getCategoryTheme } from '../cards/categoryTheme';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react-native';

interface PastQuestionEntry {
  dateId: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  questionText?: string;
  category?: string;
}

interface PastQuestionsScreenProps {
  onBack: () => void;
}

export const PastQuestionsScreen: React.FC<PastQuestionsScreenProps> = ({ onBack }) => {
  const { coupleId, myUid, partnerUid, userProfile, partnerProfile } = useCouple();
  const [entries, setEntries] = useState<PastQuestionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!coupleId || !myUid) {
        setLoading(false);
        return;
      }

      try {
        const dqCol = collection(db, 'couples', coupleId, 'dailyQuestions');
        const snap = await getDocs(dqCol);
        const list: PastQuestionEntry[] = [];

        for (const d of snap.docs) {
          const dateId = d.id;
          let myAns: string | null = null;
          let partnerAns: string | null = null;

          // Fetch my answer
          try {
            const mySnap = await getDoc(doc(db, 'couples', coupleId, 'dailyQuestions', dateId, 'answers', myUid));
            if (mySnap.exists()) myAns = mySnap.data().text;
          } catch (e) {}

          // Fetch partner answer
          if (partnerUid) {
            try {
              const pSnap = await getDoc(doc(db, 'couples', coupleId, 'dailyQuestions', dateId, 'answers', partnerUid));
              if (pSnap.exists()) partnerAns = pSnap.data().text;
            } catch (e) {}
          }

          if (myAns) {
            list.push({
              dateId,
              myAnswer: myAns,
              partnerAnswer: partnerAns,
              questionText: d.data()?.questionText || 'Daily Question',
              category: d.data()?.category || 'Deep Questions',
            });
          }
        }

        list.sort((a, b) => b.dateId.localeCompare(a.dateId));
        setEntries(list);
      } catch (err) {
        console.warn('[PastQuestions] Fetch history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [coupleId, myUid, partnerUid]);

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Questions</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={140} borderRadius={radii.lg} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={140} borderRadius={radii.lg} />
        </View>
      ) : entries.length === 0 ? (
        <View style={{ padding: spacing.lg }}>
          <EmptyState
            icon={<BookOpen size={28} color={colors.primary} />}
            title="No past entries yet"
            description="As you and your partner answer questions each day, your shared memories will be safely archived here."
            actionTitle="Go Back to Today"
            onAction={onBack}
          />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.dateId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const theme = getCategoryTheme(item.category);

            return (
              <Card style={[styles.historyCard, { borderLeftColor: theme.color, borderLeftWidth: 4 }]}>
                <View style={styles.badgesRow}>
                  <View style={styles.dateBadge}>
                    <Calendar size={13} color={colors.primary} />
                    <Text style={styles.dateBadgeText}>{item.dateId}</Text>
                  </View>

                  <View style={[styles.categoryBadge, { backgroundColor: theme.bgLight }]}>
                    <Text style={[styles.categoryBadgeText, { color: theme.badgeText }]}>
                      {theme.emoji} {item.category}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyQuestionText}>"{item.questionText}"</Text>

                <View style={styles.answersRow}>
                  {/* My response */}
                  <View style={styles.answerBox}>
                    <View style={styles.avatarRow}>
                      <Avatar name={userProfile?.displayName || 'You'} photoURL={userProfile?.photoURL} size="sm" />
                      <Text style={styles.boxAuthor}>You</Text>
                    </View>
                    <Text style={styles.boxText}>{item.myAnswer}</Text>
                  </View>

                  {/* Partner response */}
                  <View style={[styles.answerBox, styles.partnerBox]}>
                    <View style={styles.avatarRow}>
                      <Avatar
                        name={partnerProfile?.displayName || 'Partner'}
                        photoURL={partnerProfile?.photoURL}
                        size="sm"
                        highlighted
                        borderColor={colors.primary}
                      />
                      <Text style={styles.boxAuthor}>{partnerProfile?.displayName || 'Partner'}</Text>
                    </View>
                    <Text style={styles.boxText}>
                      {item.partnerAnswer ? item.partnerAnswer : '(Awaiting partner response)'}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
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
  backBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
  },
  historyCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  dateBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryBadgeText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  historyQuestionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  answersRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  answerBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  partnerBox: {
    backgroundColor: colors.primarySubtle,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  boxAuthor: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  boxText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
});
