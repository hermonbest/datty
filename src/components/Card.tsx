import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'flat' | 'elevated' | 'highlighted' | 'rose';
  categoryColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  categoryColor,
}) => {
  const containerStyle = [
    styles.card,
    variant === 'flat' && styles.flat,
    variant === 'elevated' && styles.elevated,
    variant === 'highlighted' && styles.highlighted,
    variant === 'rose' && styles.rose,
    categoryColor ? { borderColor: categoryColor, borderLeftWidth: 4 } : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  flat: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  elevated: {
    ...shadows.md,
    borderColor: colors.borderLight,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.blushLight,
    ...shadows.sm,
  },
  rose: {
    borderColor: colors.borderRose,
    borderWidth: 1.5,
    backgroundColor: colors.primarySubtle,
    ...shadows.sm,
  },
});
