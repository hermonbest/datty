import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Button, Card, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { HeartHandshake, Copy, RefreshCw, LogOut, Check } from 'lucide-react-native';

export const UnlinkedCoupleScreen: React.FC = () => {
  const { userProfile, user, refreshCouple, signOut, loading } = useCouple();
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopyEmail = async () => {
    const emailToCopy = userProfile?.email || user?.email || '';
    if (emailToCopy) {
      try {
        await Clipboard.setStringAsync(emailToCopy);
        setCopied(true);
        toast.info('Copied!', 'Email copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (e: any) {
        toast.error('Copy Failed', 'Could not copy to clipboard.');
      }
    }
  };

  const handleRefresh = async () => {
    toast.info('Checking...', 'Checking link status with your partner');
    await refreshCouple();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <HeartHandshake size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>Almost Ready!</Text>
        <Text style={styles.subtitle}>
          Your account is created. To link you with your partner, run the setup script once from the admin console or laptop:
        </Text>

        <Card style={styles.infoCard}>
          <Text style={styles.codeLabel}>One-time setup command:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>
              node scripts/setupCouple.js {userProfile?.email || 'your-email@example.com'} partner@example.com
            </Text>
          </View>

          <View style={styles.userBox}>
            <View style={styles.userBoxInfo}>
              <Text style={styles.userLabel}>Signed in as:</Text>
              <Text style={styles.userEmail}>{userProfile?.email || user?.email}</Text>
              <Text style={styles.userUid}>UID: {user?.uid}</Text>
            </View>
            <TouchableOpacity onPress={handleCopyEmail} style={styles.copyBtn}>
              {copied ? <Check size={18} color={colors.success} /> : <Copy size={18} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Check Link Status"
            onPress={handleRefresh}
            loading={loading}
            size="lg"
            variant="primary"
            leftIcon={<RefreshCw size={18} color={colors.textLight} />}
            style={styles.btn}
          />

          <Button
            title="Sign Out"
            onPress={signOut}
            size="md"
            variant="outline"
            leftIcon={<LogOut size={18} color={colors.primary} />}
            style={styles.btn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    maxWidth: 320,
  },
  infoCard: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  codeLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  codeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  codeText: {
    fontSize: typography.sizes.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textPrimary,
  },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardAlt,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  userBoxInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  userUid: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
    marginTop: 2,
  },
  copyBtn: {
    padding: spacing.sm,
  },
  actions: {
    width: '100%',
  },
  btn: {
    marginBottom: spacing.sm,
  },
});
