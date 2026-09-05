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
import * as ImagePicker from 'expo-image-picker';
import { useCouple } from '../services/coupleContext';
import { usePasscode } from '../services/passcodeContext';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { PasscodeScreen } from '../features/passcode/PasscodeScreen';
import { useToast } from './Toast';
import { uploadFileToCloudinary, getFileSizeBytes } from '../services/fileToBytes';
import {
  X,
  LogOut,
  Heart,
  Mail,
  ShieldCheck,
  Lock,
  KeyRound,
} from 'lucide-react-native';

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { userProfile, partnerProfile, coupleId, myUid, updateProfile, signOut } = useCouple();
  const { lockApp, isConfigured } = usePasscode();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickAvatar = async () => {
    const source = await new Promise<string | null>((resolve) => {
      const options: any[] = [
        { text: 'Take Photo', onPress: () => resolve('camera') },
        { text: 'Choose from Library', onPress: () => resolve('library') },
      ];
      if (userProfile?.photoURL) {
        options.push({
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => resolve('remove'),
        });
      }
      options.push({ text: 'Cancel', style: 'cancel', onPress: () => resolve(null) });

      Alert.alert(
        'Profile Photo',
        userProfile?.photoURL ? 'Change your profile photo.' : 'Choose a profile photo.',
        options
      );
    });

    if (!source) return;
    if (source === 'remove') {
      removeAvatar();
      return;
    }

    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showErrorToast(
          'Permission required',
          source === 'camera'
            ? 'Please grant camera access to take a photo.'
            : 'Please grant access to your photo library.'
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const uri = result.assets[0].uri;
      await saveAvatar(uri);
    } catch (e: any) {
      showErrorToast('Error selecting photo', e.message || 'Please try again.');
    }
  };

  const saveAvatar = async (uri: string) => {
    if (!myUid) {
      showErrorToast('Not signed in', 'Please log in and try again.');
      return;
    }

    try {
      const size = await getFileSizeBytes(uri);
      if (size !== null && size > MAX_AVATAR_BYTES) {
        showErrorToast('Photo too large', 'Please choose a photo under 10MB.');
        return;
      }

      setUploadingPhoto(true);
      const folder = `avatars/${myUid}`;
      const downloadURL = await uploadFileToCloudinary(uri, 'image', folder);
      await updateProfile({ photoURL: downloadURL });
      showSuccessToast('Photo updated', 'Your profile photo has been updated.');
    } catch (e: any) {
      showErrorToast('Upload failed', e.message || 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeAvatar = () => {
    Alert.alert('Remove Photo', 'Remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateProfile({ photoURL: null });
            showSuccessToast('Photo removed', 'Your profile photo has been removed.');
          } catch (e: any) {
            showErrorToast('Failed to remove photo', e.message || 'Please try again.');
          }
        },
      },
    ]);
  };

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
                    <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
                      <Avatar
                        name={userProfile?.displayName || 'You'}
                        photoURL={userProfile?.photoURL}
                        size="lg"
                      />
                    </TouchableOpacity>
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
                      <TouchableOpacity onPress={pickAvatar} activeOpacity={0.7}>
                        <Text style={styles.avatarHint}>
                          {uploadingPhoto
                            ? 'Uploading...'
                            : userProfile?.photoURL
                            ? 'Tap avatar to change photo'
                            : 'Tap avatar to add a photo'}
                        </Text>
                      </TouchableOpacity>
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
  avatarHint: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: spacing.sm,
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
