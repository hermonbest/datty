import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useCouple } from '../services/coupleContext';
import { usePasscode } from '../services/passcodeContext';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { PasscodeScreen } from '../features/passcode/PasscodeScreen';
import { useToast } from './Toast';
import {
  X,
  LogOut,
  Heart,
  Mail,
  ShieldCheck,
  Lock,
  KeyRound,
} from 'lucide-react-native';

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { userProfile, partnerProfile, coupleId, signOut } = useCouple();
  const { lockApp, isConfigured } = usePasscode();
  const { success: showSuccessToast } = useToast();
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          onClose();
          await signOut();
        },
      },
    ]);
  };

  const handleLockNow = () => {
    onClose();
    lockApp();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Change Passcode Modal View */}
          {isChangingPasscode ? (
            <View style={styles.changePasscodeContainer}>
              <PasscodeScreen
                mode="change"
                onCancel={() => setIsChangingPasscode(false)}
                onSuccess={() => {
                  setIsChangingPasscode(false);
                  showSuccessToast('Passcode updated successfully');
                }}
              />
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <View style={styles.modalHeaderIconCircle}>
                    <Heart size={18} color={colors.primary} fill={colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Profile & Settings</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* My Profile Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
                  <View style={styles.profileRow}>
                    <Avatar
                      name={userProfile?.displayName || 'You'}
                      photoURL={userProfile?.photoURL}
                      size="lg"
                    />
                    <View style={styles.profileMeta}>
                      <Text style={styles.profileName}>
                        {userProfile?.displayName || 'You'}
                      </Text>
                      <View style={styles.infoRow}>
                        <Mail size={13} color={colors.textMuted} />
                        <Text style={styles.profileEmail} numberOfLines={1}>
                          {userProfile?.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Partner Connection Card */}
                <View style={[styles.sectionCard, styles.partnerCard]}>
                  <Text style={styles.sectionLabel}>CONNECTED PARTNER</Text>
                  <View style={styles.profileRow}>
                    <Avatar
                      name={partnerProfile?.displayName || 'Partner'}
                      photoURL={partnerProfile?.photoURL}
                      size="lg"
                      highlighted
                      borderColor={colors.primary}
                    />
                    <View style={styles.profileMeta}>
                      <Text style={styles.profileName}>
                        {partnerProfile?.displayName || 'Partner'}
                      </Text>
                      <View style={styles.infoRow}>
                        <Heart size={13} color={colors.primary} fill={colors.primary} />
                        <Text style={styles.partnerEmail} numberOfLines={1}>
                          {partnerProfile?.email || 'Linked & Connected'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {coupleId && (
                    <View style={styles.coupleIdBadge}>
                      <ShieldCheck size={14} color={colors.success} />
                      <Text style={styles.coupleIdText}>
                        Pairing ID: {coupleId.substring(0, 12)}...
                      </Text>
                    </View>
                  )}
                </View>

                {/* Security & Privacy Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionLabel}>SECURITY & PASSCODE</Text>
                  <View style={styles.securityRow}>
                    <View style={styles.securityIconBox}>
                      <ShieldCheck size={20} color={colors.success} />
                    </View>
                    <View style={styles.securityInfo}>
                      <Text style={styles.securityTitle}>Passcode Protection</Text>
                      <Text style={styles.securitySubtitle}>
                        {isConfigured ? 'Active • 4-digit PIN required on app open' : 'Not configured'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.securityActions}>
                    <Button
                      title="Lock App Now"
                      variant="outline"
                      onPress={handleLockNow}
                      leftIcon={<Lock size={16} color={colors.primary} />}
                      style={styles.securityBtn}
                    />
                    <Button
                      title="Change Passcode"
                      variant="secondary"
                      onPress={() => setIsChangingPasscode(true)}
                      leftIcon={<KeyRound size={16} color={colors.textPrimary} />}
                      style={styles.securityBtn}
                    />
                  </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                  <Button
                    title="Log Out"
                    variant="outline"
                    onPress={handleLogout}
                    leftIcon={<LogOut size={18} color={colors.error} />}
                    style={styles.logoutBtn}
                    textStyle={{ color: colors.error }}
                  />
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '88%',
    ...shadows.lg,
  },
  changePasscodeContainer: {
    height: 520,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalHeaderIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs + 2,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  partnerCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileMeta: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileEmail: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  partnerEmail: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
  },
  coupleIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    gap: 6,
  },
  coupleIdText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.semiBold,
    color: colors.success,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  securityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  securitySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  securityActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  securityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  logoutSection: {
    marginTop: spacing.sm,
  },
  logoutBtn: {
    borderColor: colors.errorLight,
    backgroundColor: colors.card,
  },
});
