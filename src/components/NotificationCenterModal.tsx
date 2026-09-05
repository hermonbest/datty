import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Bell,
  Settings,
  CheckCheck,
  Heart,
  Sparkles,
  MessageCircle,
  Camera,
  Calendar,
  Gamepad2,
  BookOpen,
  Send,
} from 'lucide-react-native';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { AppNotification } from '../types/notifications';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { useNotifications } from '../services/useNotifications';
import { resolveNotificationTarget, navigateFromNotification } from '../services/notificationNavigation';
import { useNotesModal } from '../services/notesModalContext';

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tabName: string, params?: any) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNavigateTab,
}) => {
  const insets = useSafeAreaInsets();
  const { openNotes } = useNotesModal();
  const {
    notifications,
    unreadCount,
    loading,
    preferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    sendNudge,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'nudges' | 'activity'>('all');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sendingNudge, setSendingNudge] = useState<string | null>(null);

  // Filter list
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'nudges') return n.category === 'app_nudge';
    if (activeFilter === 'activity') return n.category === 'feature';
    return true;
  });

  const handleNudgePress = async (type: 'nudge_thinking_of_you' | 'nudge_write_note' | 'nudge_send_photo') => {
    setSendingNudge(type);
    const res = await sendNudge(type);
    setSendingNudge(null);

    if (res.success) {
      const labels = {
        nudge_thinking_of_you: 'Heart pulse sent! 💓',
        nudge_write_note: 'Note nudge sent! 💌',
        nudge_send_photo: 'Photo request sent! 🤳',
      };
      Alert.alert('Sent with love', labels[type]);
    } else if (res.reason === 'throttled') {
      Alert.alert(
        'Cooldown Active',
        `You recently sent this nudge. Please wait ${res.remainingMinutes} minute(s) before sending another.`
      );
    } else {
      Alert.alert('Unable to send', 'Make sure both of you are linked.');
    }
  };

  const handleNotificationPress = async (item: AppNotification) => {
    // 1. Mark as read immediately (non-blocking)
    if (!item.read) {
      markAsRead(item.id).catch(() => {});
    }

    // 2. Always dismiss the notification center modal
    onClose();

    // 3. Resolve destination route & parameters
    const target = resolveNotificationTarget(item);

    // 4. If target is Notes, open Notes modal directly
    if (target.tabName === 'NotesTab') {
      openNotes(target.params?.tab || 'gratitude');
      if (onNavigateTab) {
        onNavigateTab(target.tabName, target.params);
      }
      return;
    }

    // 5. Navigate to destination tab
    if (onNavigateTab) {
      onNavigateTab(target.tabName, target.params);
    } else {
      navigateFromNotification(target.tabName, target.params);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'nudge_thinking_of_you':
      case 'note_gratitude':
        return <Heart size={18} color="#E11D48" />;
      case 'daily_answered':
      case 'daily_revealed':
      case 'habit_daily_question':
        return <Sparkles size={18} color="#D97706" />;
      case 'moment_new':
      case 'nudge_send_photo':
      case 'habit_what_are_you_doing_now':
        return <Camera size={18} color="#2563EB" />;
      case 'chat_message':
        return <MessageCircle size={18} color="#16A34A" />;
      case 'calendar_reminder':
        return <Calendar size={18} color="#9333EA" />;
      case 'game_challenge':
      case 'game_turn':
        return <Gamepad2 size={18} color="#EA580C" />;
      default:
        return <Bell size={18} color={colors.primary} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerUnreadText}>{unreadCount} new</Text>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={markAllAsRead}
                accessibilityLabel="Mark all as read"
              >
                <CheckCheck size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setSettingsVisible(true)}
              accessibilityLabel="Notification Settings"
            >
              <Settings size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Love Nudges Bar */}
        <View style={styles.nudgesBar}>
          <Text style={styles.nudgesLabel}>Send a Quick Nudge</Text>
          <View style={styles.nudgeButtonsRow}>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => handleNudgePress('nudge_thinking_of_you')}
              disabled={Boolean(sendingNudge)}
            >
              <Heart size={16} color="#E11D48" />
              <Text style={styles.nudgeBtnText}>Thinking of you</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => handleNudgePress('nudge_write_note')}
              disabled={Boolean(sendingNudge)}
            >
              <BookOpen size={16} color="#0D9488" />
              <Text style={styles.nudgeBtnText}>Ask for Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => handleNudgePress('nudge_send_photo')}
              disabled={Boolean(sendingNudge)}
            >
              <Camera size={16} color="#2563EB" />
              <Text style={styles.nudgeBtnText}>Ask for Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'nudges' && styles.filterTabActive]}
            onPress={() => setActiveFilter('nudges')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'nudges' && styles.filterTabTextActive,
              ]}
            >
              Love Nudges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'activity' && styles.filterTabActive]}
            onPress={() => setActiveFilter('activity')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'activity' && styles.filterTabTextActive,
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={40} color={colors.border} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'nudges'
                ? 'No love nudges yet. Send one above!'
                : 'No notifications right now.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.itemCard, !item.read && styles.itemCardUnread]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.itemIconWrapper}>{renderIcon(item.type)}</View>

                <View style={styles.itemBody}>
                  <View style={styles.itemHeaderRow}>
                    <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Settings Modal */}
        <NotificationSettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerUnreadText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgesBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  nudgesLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nudgeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  nudgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  nudgeBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
    alignItems: 'center',
  },
  itemCardUnread: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  itemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  itemTitleUnread: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
