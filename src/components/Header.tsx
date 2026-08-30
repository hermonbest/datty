import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { Avatar } from './Avatar';
import { Heart } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  partnerName?: string;
  partnerPhoto?: string | null;
  rightAction?: React.ReactNode;
  showPartnerPill?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  partnerName,
  partnerPhoto,
  rightAction,
  showPartnerPill = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSection}>
        {showPartnerPill && partnerName && (
          <View style={styles.partnerPill}>
            <Avatar name={partnerName} photoURL={partnerPhoto} size="sm" />
            <Heart size={12} color={colors.primary} fill={colors.primary} style={styles.heartIcon} />
            <Text style={styles.partnerName} numberOfLines={1}>
              {partnerName}
            </Text>
          </View>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  titleColumn: {
    flex: 1,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: 160,
    ...shadows.sm,
  },
  heartIcon: {
    marginHorizontal: 4,
  },
  partnerName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
    marginRight: 4,
  },
});
