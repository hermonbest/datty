import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Card, EmptyState, Skeleton, useToast, Avatar } from '../../components';
import { useEvents } from './useEvents';
import { NewEventScreen } from './NewEventScreen';
import {
  getNextEventDate,
  getDaysUntil,
  formatEventCountdown,
  parseEventDateParts,
} from './eventUtils';
import {
  Plus,
  Calendar as CalendarIcon,
  Heart,
  Repeat,
  Trash2,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { CoupleEvent } from '../../types';
import { useCouple } from '../../services/coupleContext';

export const CalendarScreen: React.FC = () => {
  const { events, loading, deleteEvent } = useEvents();
  const { partnerProfile } = useCouple();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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

  const getEventCategoryIcon = (title: string, size = 18, color = colors.primary, fill?: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('anniversary') || lower.includes('love') || lower.includes('date')) {
      return <Heart size={size} color={color} fill={fill || colors.primaryLight} />;
    }
    if (lower.includes('birthday') || lower.includes('bday')) {
      return <Sparkles size={size} color={colors.inversePrimary || '#ffb1c1'} />; 
    }
    return <CalendarIcon size={size} color={colors.onSecondaryContainer || '#696162'} />;
  };

  const nextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));
  const prevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));

  // Calendar Grid Data
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => {
      const nextDate = getNextEventDate(e, selectedMonth);
      return isSameDay(nextDate, day);
    });
  };

  const handleDayPress = (day: Date) => {
    const days = getDaysUntil(day);
    const formattedDate = format(day, 'MMMM d, yyyy');
    const dayEvents = getEventsForDay(day);

    if (dayEvents.length === 1) {
      handleEventPress(dayEvents[0]);
      return;
    } else if (dayEvents.length > 1) {
      Alert.alert(
        `Events on ${format(day, 'MMM d')}`,
        dayEvents.map((e) => `• ${e.title}`).join('\n'),
        [
          ...dayEvents.map((e) => ({
            text: `View "${e.title}"`,
            onPress: () => handleEventPress(e),
          })),
          { text: 'Close', style: 'cancel' as const },
        ]
      );
      return;
    }

    let message = '';
    if (days === 0) {
      message = `Today is ${formattedDate}!`;
    } else if (days > 0) {
      message = `There are ${days} days until ${formattedDate}.`;
    } else {
      message = `It has been ${Math.abs(days)} days since ${formattedDate}.`;
    }

    toast.info(format(day, 'MMM d'), message);
  };

  const handleEventPress = (event: CoupleEvent) => {
    const days = getDaysUntil(getNextEventDate(event));
    const countdown = formatEventCountdown(days).text;
    const notesText = event.notes ? event.notes : 'No notes added for this date.';
    
    Alert.alert(
      event.title,
      `Date: ${format(getNextEventDate(event), 'MMMM d, yyyy')}\nCountdown: ${countdown}\n\nNotes:\n${notesText}`,
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(event),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const renderCountdownBadge = (daysUntil: number, isAnniversary: boolean) => {
    const bgStyle = isAnniversary ? styles.countdownBadgeAnniv : styles.countdownBadgeNormal;
    const textStyle = isAnniversary ? styles.countdownNumAnniv : styles.countdownNumNormal;
    const labelStyle = isAnniversary ? styles.countdownLabelAnniv : styles.countdownLabelNormal;

    if (daysUntil === 0) {
      return (
        <View style={[styles.countdownBadge, bgStyle, { justifyContent: 'center' }]}>
          <Text style={[styles.countdownTodayText, isAnniversary && styles.countdownTodayTextAnniv]}>Today</Text>
        </View>
      );
    }

    return (
      <View style={[styles.countdownBadge, bgStyle]}>
        <Text style={[styles.countdownNum, textStyle]}>{Math.abs(daysUntil)}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>{Math.abs(daysUntil) === 1 ? 'day' : 'days'}</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.topAppBar}>
      <View style={styles.headerLeft}>
        <Avatar
          name={partnerProfile?.displayName || 'Partner'}
          photoURL={partnerProfile?.photoURL}
          size="sm"
          style={styles.headerAvatar}
        />
      </View>
      <Text style={styles.headerTitle}>Datty</Text>
      <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
        <Settings size={24} color={colors.onSurfaceVariant} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.calendarSection}>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <ChevronLeft size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(selectedMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <ChevronRight size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        {/* Weekdays */}
        <View style={styles.weekdaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={`weekday-${i}`} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dayEvents = getEventsForDay(day);
            const isAnniversary = dayEvents.some(e => e.title.toLowerCase().includes('anniversary'));
            const isTodayDate = isToday(day);

            return (
              <View key={`day-${i}`} style={styles.dayCellWrapper}>
                <TouchableOpacity
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayCellOutside,
                    isAnniversary && styles.dayCellHighlighted,
                    (isTodayDate && !isAnniversary && isCurrentMonth) && styles.dayCellToday,
                  ]}
                  disabled={!isCurrentMonth}
                  onPress={() => handleDayPress(day)}
                >
                  {isCurrentMonth && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isAnniversary && styles.dayTextHighlighted,
                          (isTodayDate && !isAnniversary) && styles.dayTextToday,
                        ]}
                      >
                        {format(day, 'd')}
                      </Text>
                      {isAnniversary && (
                        <View style={styles.anniversaryBadge}>
                          <Heart size={10} color={colors.inversePrimary || '#ffb1c1'} fill={colors.inversePrimary || '#ffb1c1'} />
                        </View>
                      )}
                      {dayEvents.length > 0 && !isAnniversary && (
                        <View style={styles.eventDot} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={300} borderRadius={12} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {renderCalendar()}
              <Text style={styles.sectionTitle}>Upcoming</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={<CalendarIcon size={32} color={colors.primary} />}
                title="No dates added yet"
                description="Add your anniversary, upcoming trips, date nights, and birthdays to start the countdown."
                actionTitle="Add Special Date"
                onAction={() => setModalVisible(true)}
              />
            </View>
          }
          renderItem={({ item }) => {
            const nextDate = getNextEventDate(item);
            const formattedNext = format(nextDate, 'eeee, MMM d');
            const isAnniversary = item.title.toLowerCase().includes('anniversary');
            const daysUntil = getDaysUntil(nextDate);

            return (
              <TouchableOpacity
                onPress={() => handleEventPress(item)}
                onLongPress={() => handleDelete(item)}
                style={styles.upcomingCard}
                activeOpacity={0.7}
              >
                {renderCountdownBadge(daysUntil, isAnniversary)}
                <View style={styles.upcomingDetails}>
                  <Text style={styles.upcomingTitle}>{item.title}</Text>
                  <Text style={styles.upcomingSubtitle}>{formattedNext}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color={colors.outline || '#867275'} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addEventBtn}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={styles.addEventBtnText}>Add Event</Text>
            </TouchableOpacity>
          }
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
    backgroundColor: colors.background || '#fff8f7',
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 248, 247, 0.8)',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontFamily: 'ebGaramond',
    fontSize: 28,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // Room for bottom nav
  },
  calendarSection: {
    marginBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  monthTitle: {
    fontSize: 24,
    fontFamily: 'ebGaramond',
    fontWeight: '500',
    color: colors.primary,
  },
  gridContainer: {
    backgroundColor: colors.surfaceContainerLowest || '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.outline || '#867275',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellOutside: {
    opacity: 0,
  },
  dayCellHighlighted: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  dayCellToday: {
    backgroundColor: colors.surfaceContainer || '#fceae9',
    borderWidth: 1,
    borderColor: 'rgba(125, 45, 68, 0.2)', // primary-container/20
  },
  dayText: {
    fontSize: 16,
    color: colors.onSurface || '#221919',
    fontWeight: '400',
    fontFamily: 'manrope',
  },
  dayTextHighlighted: {
    color: colors.onPrimary || '#ffffff',
    fontWeight: '700',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '500',
  },
  anniversaryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.surfaceContainerLowest || '#ffffff',
    borderRadius: 10,
    padding: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'ebGaramond',
    fontWeight: '500',
    color: colors.primary,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow || '#fff0f0',
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    marginBottom: 12,
  },
  countdownBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  countdownBadgeNormal: {
    backgroundColor: colors.surfaceContainerHigh || '#f6e4e4',
  },
  countdownBadgeAnniv: {
    backgroundColor: colors.primaryFixed || '#ffd9df',
  },
  countdownNum: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'manrope',
  },
  countdownNumNormal: {
    color: colors.primary,
  },
  countdownNumAnniv: {
    color: colors.onPrimaryFixed || '#3f0018',
  },
  countdownLabel: {
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'manrope',
  },
  countdownLabelNormal: {
    color: colors.secondary,
  },
  countdownLabelAnniv: {
    color: colors.onPrimaryFixed || '#3f0018',
    opacity: 0.8,
  },
  countdownTodayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    fontFamily: 'manrope',
  },
  countdownTodayTextAnniv: {
    color: colors.onPrimaryFixed || '#3f0018',
  },
  upcomingDetails: {
    flex: 1,
    marginLeft: 16,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface || '#221919',
    fontFamily: 'manrope',
  },
  upcomingSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant || '#544245',
    marginTop: 2,
    fontFamily: 'manrope',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer || '#fceae9',
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.4)',
    marginTop: 16,
  },
  addEventBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'manrope',
  },
  loadingContainer: {
    padding: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  }
});
