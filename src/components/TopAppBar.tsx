import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, BookOpen, Bell } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../theme';
import { Avatar } from './Avatar';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { useCouple } from '../services/coupleContext';
import { useNotifications } from '../services/useNotifications';
import { useNotesModal } from '../services/notesModalContext';
import { navigateFromNotification } from '../services/notificationNavigation';
import { NotificationCenterModal } from './NotificationCenterModal';

export const TopAppBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { partnerProfile } = useCouple();
  const { unreadCount, sendNudge } = useNotifications();
  const { openNotes } = useNotesModal();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [sendingHeart, setSendingHeart] = useState(false);
  const [profileSettingsVisible, setProfileSettingsVisible] = useState(false);

  const handleHeartPress = async () => {
    if (sendingHeart) return;
    setSendingHeart(true);
    const res = await sendNudge('nudge_thinking_of_you');
    setSendingHeart(false);

    if (res.success) {
      Alert.alert('Thinking of you 💓', `Sent a warm heart pulse to ${partnerProfile?.displayName || 'your partner'}!`);
    } else if (res.reason === 'throttled') {
      Alert.alert(
        'Heart Pulse Cooldown',
        `You recently sent a heart pulse. You can send another in ${res.remainingMinutes} minute(s).`
      );
    }
  };

  const handleNavigateFromNotifications = (tabName: string, params?: any) => {
    setNotificationsVisible(false);
    if (tabName === 'NotesTab' || tabName === 'Notes') {
      openNotes(params?.tab || 'gratitude');
    } else {
      navigateFromNotification(tabName as any, params);
    }
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              onPress={() => setProfileSettingsVisible(true)}
              accessibilityLabel="Open Profile & Settings"
            >
              <Avatar 
                name={partnerProfile?.displayName || 'Partner'} 
                photoURL={partnerProfile?.photoURL} 
                size="md" 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>Datty</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setNotificationsVisible(true)}
              accessibilityLabel="Open Notifications"
            >
              <Bell size={22} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openNotes('gratitude')}
              accessibilityLabel="Open Notes & Lists"
            >
              <BookOpen size={22} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleHeartPress}
              accessibilityLabel="Send Thinking of You Pulse"
            >
              <Heart size={22} color={colors.primary} fill={sendingHeart ? colors.primary : 'none'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {notificationsVisible && (
        <NotificationCenterModal
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
          onNavigateTab={handleNavigateFromNotifications}
        />
      )}

      <ProfileSettingsModal
        visible={profileSettingsVisible}
        onClose={() => setProfileSettingsVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 248, 247, 0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  content: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displayLg,
    color: colors.primary,
    fontSize: 40, // Slightly scaled down from 48px so it doesn't clip in the 64px header, while still maintaining the displayLg font family and weight
    lineHeight: 48,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
});
