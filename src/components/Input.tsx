import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  isPassword = false,
  containerStyle,
  leftIcon,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          props.multiline ? styles.multilineWrapper : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
