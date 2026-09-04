import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Bell, Moon, Sun, Heart, Sparkles, MessageCircle, Camera, CheckSquare, Calendar, Gamepad2 } from 'lucide-react-native';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { NotificationPreferences } from '../types/notifications';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onUpdatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <Bell size={20} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Notification Settings</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section: Daily Connection Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Connection Habits</Text>
            <Text style={styles.sectionSubtitle}>
              Scheduled gentle nudges on this device to keep you two close.
            </Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Sun size={18} color="#EA580C" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Morning Love Note</Text>
                  <Text style={styles.rowDesc}>Daily reminder at {preferences.morningLoveNoteTime}</Text>
                </View>
                <Switch
                  value={preferences.morningLoveNote}
                  onValueChange={(val) => onUpdatePreferences({ morningLoveNote: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.morningLoveNote ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Heart size={18} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Evening Gratitude</Text>
                  <Text style={styles.rowDesc}>Daily reminder at {preferences.eveningGratitudeTime}</Text>
                </View>
                <Switch
                  value={preferences.eveningGratitude}
                  onValueChange={(val) => onUpdatePreferences({ eveningGratitude: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.eveningGratitude ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Sparkles size={18} color="#D97706" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Daily Question Check-in</Text>
                  <Text style={styles.rowDesc}>Reminder if unanswered at {preferences.dailyQuestionReminderTime}</Text>
                </View>
                <Switch
                  value={preferences.dailyQuestionReminder}
                  onValueChange={(val) => onUpdatePreferences({ dailyQuestionReminder: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.dailyQuestionReminder ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Camera size={18} color="#2563EB" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>"What are you doing now?"</Text>
                  <Text style={styles.rowDesc}>Spontaneous daily photo prompt</Text>
                </View>
                <Switch
                  value={preferences.spontaneousPhotoPrompt}
                  onValueChange={(val) => onUpdatePreferences({ spontaneousPhotoPrompt: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.spontaneousPhotoPrompt ? colors.primary : '#FFFFFF'}
                />
              </View>
            </View>
          </View>

          {/* Section: Partner Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partner Activity Alerts</Text>
            <Text style={styles.sectionSubtitle}>
              Push alerts when your partner interacts with you.
            </Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <MessageCircle size={18} color="#16A34A" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Chat & Audio Messages</Text>
                </View>
                <Switch
                  value={preferences.chatMessages}
                  onValueChange={(val) => onUpdatePreferences({ chatMessages: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.chatMessages ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Camera size={18} color="#9333EA" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>New Moments & Photos</Text>
                </View>
                <Switch
                  value={preferences.moments}
                  onValueChange={(val) => onUpdatePreferences({ moments: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.moments ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Sparkles size={18} color="#EA580C" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Daily Question & Reveals</Text>
                </View>
                <Switch
                  value={preferences.dailyQuestions}
                  onValueChange={(val) => onUpdatePreferences({ dailyQuestions: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.dailyQuestions ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <CheckSquare size={18} color="#0D9488" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Shared Notes & Lists</Text>
                </View>
                <Switch
                  value={preferences.coupleNotes}
                  onValueChange={(val) => onUpdatePreferences({ coupleNotes: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.coupleNotes ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Calendar size={18} color="#E11D48" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Dates & Calendar Countdown</Text>
                </View>
                <Switch
                  value={preferences.calendarReminders}
                  onValueChange={(val) => onUpdatePreferences({ calendarReminders: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.calendarReminders ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Gamepad2 size={18} color="#6366F1" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Game Challenges & Turns</Text>
                </View>
                <Switch
                  value={preferences.gameAlerts}
                  onValueChange={(val) => onUpdatePreferences({ gameAlerts: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.gameAlerts ? colors.primary : '#FFFFFF'}
                />
              </View>
            </View>
          </View>

          {/* Section: Quiet Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiet Hours (Do Not Disturb)</Text>
            <Text style={styles.sectionSubtitle}>
              Mute loud notifications while you or your partner are sleeping.
            </Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowIconWrapper}>
                  <Moon size={18} color="#475569" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Enable Quiet Hours</Text>
                  <Text style={styles.rowDesc}>
                    {preferences.quietHoursStart} to {preferences.quietHoursEnd}
                  </Text>
                </View>
                <Switch
                  value={preferences.quietHoursEnabled}
                  onValueChange={(val) => onUpdatePreferences({ quietHoursEnabled: val })}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={preferences.quietHoursEnabled ? colors.primary : '#FFFFFF'}
                />
              </View>
            </View>
          </View>
        </ScrollView>
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
    height: 56,
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
    width: 34,
    height: 34,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: 40,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  rowDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
