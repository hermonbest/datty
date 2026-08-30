import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Card, EmptyState, Skeleton, useToast } from '../../components';
import { useEvents } from './useEvents';
import { NewEventScreen } from './NewEventScreen';
import {
  getNextEventDate,
  getDaysUntil,
  formatEventCountdown,
} from './eventUtils';
import {
  Plus,
  Calendar as CalendarIcon,
  Heart,
  Repeat,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { CoupleEvent } from '../../types';

export const CalendarScreen: React.FC = () => {
  const { events, loading, deleteEvent } = useEvents();
  const [modalVisible, setModalVisible] = useState(false);
  const toast = useToast();

  const handleDelete = (event: CoupleEvent) => {
    Alert.alert(
      'Delete Date',
      `Are you sure you want to delete "${event.title}" from your calendar?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              toast.success('Deleted', 'Event has been removed.');
            } catch (e: any) {
              toast.error('Error', 'Failed to delete event.');
            }
          },
        },
      ]
    );
  };

  const getEventCategoryIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('anniversary') || lower.includes('love') || lower.includes('date')) {
      return <Heart size={18} color={colors.primary} fill={colors.primaryLight} />;
    }
    if (lower.includes('birthday') || lower.includes('bday')) {
      return <Sparkles size={18} color={colors.accent} />;
    }
    return <CalendarIcon size={18} color={colors.info} />;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Countdowns & special milestones</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addBtnHeader}
        >
          <Plus size={22} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={100} borderRadius={radii.lg} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={100} borderRadius={radii.lg} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={100} borderRadius={radii.lg} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<CalendarIcon size={32} color={colors.primary} />}
            title="No dates added yet"
            description="Add your anniversary, upcoming trips, date nights, and birthdays to start the countdown."
            actionTitle="Add Special Date"
            onAction={() => setModalVisible(true)}
          />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const nextDate = getNextEventDate(item);
            const daysUntil = getDaysUntil(nextDate);
            const countdown = formatEventCountdown(daysUntil);
            const formattedNext = format(nextDate, 'MMMM d, yyyy');

            return (
              <Card
                style={[
                  styles.eventCard,
                  countdown.isToday && styles.todayCard,
                ]}
                variant={countdown.isToday ? 'highlighted' : 'elevated'}
              >
                <View style={styles.eventRow}>
                  {/* Category icon */}
                  <View style={styles.iconCircle}>
                    {getEventCategoryIcon(item.title)}
                  </View>

                  {/* Details */}
                  <View style={styles.detailsCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      {item.recurringYearly && (
                        <View style={styles.repeatBadge}>
                          <Repeat size={10} color={colors.primary} />
                          <Text style={styles.repeatText}>Yearly</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.eventDateText}>{formattedNext}</Text>

                    {item.notes ? (
                      <Text style={styles.eventNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>

                  {/* Countdown Badge & Delete */}
                  <View style={styles.rightCol}>
                    <View
                      style={[
                        styles.countdownPill,
                        countdown.isToday
                          ? styles.countdownToday
                          : countdown.isPast
                          ? styles.countdownPast
                          : styles.countdownUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.countdownText,
                          countdown.isToday
                            ? styles.countdownTextToday
                            : countdown.isPast
                            ? styles.countdownTextPast
                            : styles.countdownTextUpcoming,
                        ]}
                      >
                        {countdown.text}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* New Event Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <NewEventScreen onClose={() => setModalVisible(false)} />
      </Modal>
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  eventCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  todayCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailsCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
    gap: 2,
  },
  repeatText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.medium,
    color: colors.primaryDark,
  },
  eventDateText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventNotes: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    gap: spacing.sm,
  },
  countdownPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  countdownUpcoming: {
    backgroundColor: colors.primaryLight,
  },
  countdownToday: {
    backgroundColor: colors.primary,
  },
  countdownPast: {
    backgroundColor: colors.cardAlt,
  },
  countdownText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  countdownTextUpcoming: {
    color: colors.primaryDark,
  },
  countdownTextToday: {
    color: colors.textLight,
  },
  countdownTextPast: {
    color: colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
});
