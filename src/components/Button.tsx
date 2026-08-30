import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  customBgColor?: string;
  customTextColor?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  customBgColor,
  customTextColor,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        customBgColor ? { backgroundColor: customBgColor } : null,
        isDisabled && styles.disabled,
        variant === 'primary' && !isDisabled && !customBgColor && shadows.glowRose,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            customTextColor ||
            (variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textLight)
          }
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              styles.baseText,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              customTextColor ? { color: customTextColor } : null,
              leftIcon ? { marginLeft: spacing.sm } : null,
              rightIcon ? { marginRight: spacing.sm } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
  },
  baseText: {
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },

  // Text Variants
  text_primary: {
    color: colors.textLight,
  },
  text_secondary: {
    color: colors.primaryDark,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.textPrimary,
  },
  text_danger: {
    color: colors.textLight,
  },

  // Sizes
  size_sm: {
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  size_md: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
  },

  // Text Sizes
  textSize_sm: {
    fontSize: typography.sizes.sm,
  },
  textSize_md: {
    fontSize: typography.sizes.md,
  },
  textSize_lg: {
    fontSize: typography.sizes.lg,
  },
});
