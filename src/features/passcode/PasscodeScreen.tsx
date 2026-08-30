import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { usePasscode } from '../../services/passcodeContext';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Lock, ShieldCheck, KeyRound, Delete, Heart, X } from 'lucide-react-native';

const PIN_LENGTH = 4;

export type PasscodeMode = 'setup' | 'unlock' | 'change';

interface PasscodeScreenProps {
  mode?: PasscodeMode;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PasscodeScreen: React.FC<PasscodeScreenProps> = ({
  mode = 'unlock',
  onSuccess,
  onCancel,
}) => {
  const {
    setupPasscode,
    verifyPasscode,
    changePasscode,
    isConfigured,
    lockoutRemainingSeconds,
    resetPasscodeForDebug,
  } = usePasscode();

  // For setup mode: 'create' | 'confirm'
  // For change mode: 'current' | 'new' | 'confirm'
  const [step, setStep] = useState<'create' | 'confirm' | 'current' | 'new'>(
    mode === 'setup' ? 'create' : mode === 'change' ? 'current' : 'create'
  );

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [firstEnteredPin, setFirstEnteredPin] = useState<string>('');
  const [oldPin, setOldPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const isLockedOut = lockoutRemainingSeconds > 0;

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Trigger shake animation on error
  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (num: number) => {
    if (isLockedOut) return;
    if (enteredPin.length < PIN_LENGTH && !isVerifying) {
      setErrorMessage('');
      setEnteredPin((prev) => prev + num.toString());
    }
  };

  const handleDelete = () => {
    if (isLockedOut) return;
    if (enteredPin.length > 0 && !isVerifying) {
      setErrorMessage('');
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  // Evaluate complete PIN
  useEffect(() => {
    if (enteredPin.length === PIN_LENGTH && !isLockedOut) {
      handleCompletePin(enteredPin);
    }
  }, [enteredPin, isLockedOut]);

  const handleCompletePin = async (pin: string) => {
    if (isLockedOut) {
      setEnteredPin('');
      return;
    }
    setIsVerifying(true);

    if (mode === 'setup') {
      if (step === 'create') {
        setFirstEnteredPin(pin);
        setEnteredPin('');
        setStep('confirm');
        setIsVerifying(false);
      } else if (step === 'confirm') {
        if (pin === firstEnteredPin) {
          const success = await setupPasscode(pin);
          if (success) {
            onSuccess?.();
          } else {
            triggerShake('Could not save passcode. Please try again.');
            setEnteredPin('');
            setStep('create');
          }
        } else {
          triggerShake('Passcodes did not match. Let’s try again.');
          setEnteredPin('');
          setFirstEnteredPin('');
          setStep('create');
        }
        setIsVerifying(false);
      }
    } else if (mode === 'unlock') {
      const result = await verifyPasscode(pin);
      if (result.success) {
        onSuccess?.();
      } else {
        triggerShake(result.error || 'Incorrect passcode. Please try again.');
        setEnteredPin('');
      }
      setIsVerifying(false);
    } else if (mode === 'change') {
      if (step === 'current') {
        const result = await verifyPasscode(pin);
        if (result.success) {
          setOldPin(pin);
          setEnteredPin('');
          setStep('new');
        } else {
          triggerShake(result.error || 'Current passcode is incorrect.');
          setEnteredPin('');
        }
        setIsVerifying(false);
      } else if (step === 'new') {
        setFirstEnteredPin(pin);
        setEnteredPin('');
        setStep('confirm');
        setIsVerifying(false);
      } else if (step === 'confirm') {
        if (pin === firstEnteredPin) {
          const result = await changePasscode(oldPin, pin);
          if (result.success) {
            onSuccess?.();
          } else {
            triggerShake(result.error || 'Failed to update passcode.');
            setEnteredPin('');
            setStep('new');
          }
        } else {
          triggerShake('New passcodes did not match.');
          setEnteredPin('');
          setStep('new');
        }
        setIsVerifying(false);
      }
    }
  };

  // Helper titles and descriptions
  let title = 'Enter Passcode';
  let subtitle = isLockedOut
    ? `Too many failed attempts. Locked for ${lockoutRemainingSeconds}s`
    : 'Enter your 4-digit passcode to unlock Us';
  let iconComponent = <Lock size={32} color={isLockedOut ? colors.error : colors.primary} />;

  if (mode === 'setup') {
    if (step === 'create') {
      title = 'Create App Passcode';
      subtitle = 'Set a 4-digit passcode to secure your private space';
      iconComponent = <KeyRound size={32} color={colors.primary} />;
    } else {
      title = 'Confirm Passcode';
      subtitle = 'Re-enter your 4-digit passcode to confirm';
      iconComponent = <ShieldCheck size={32} color={colors.primary} />;
    }
  } else if (mode === 'change') {
    if (step === 'current') {
      title = 'Current Passcode';
      subtitle = 'Enter your current 4-digit passcode';
      iconComponent = <KeyRound size={32} color={colors.primary} />;
    } else if (step === 'new') {
      title = 'New Passcode';
      subtitle = 'Choose your new 4-digit passcode';
      iconComponent = <KeyRound size={32} color={colors.primary} />;
    } else {
      title = 'Confirm New Passcode';
      subtitle = 'Re-enter your new passcode to verify';
      iconComponent = <ShieldCheck size={32} color={colors.primary} />;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Top action button (Cancel in modal/change mode) */}
      {onCancel && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        {/* Header section with badge */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>{iconComponent}</View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* PIN Dot Indicators */}
        <Animated.View
          style={[
            styles.dotsContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const isFilled = index < enteredPin.length;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  errorMessage.length > 0 && isFilled && styles.dotError,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error message text */}
        <View style={styles.errorContainer}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : (
            <Text style={styles.hintText}>
              {mode === 'setup' && step === 'create'
                ? 'Your passcode will be required whenever the app opens'
                : ' '}
            </Text>
          )}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keyButton}
                  activeOpacity={0.65}
                  onPress={() => handleKeyPress(num)}
                  disabled={isVerifying}
                >
                  <Text style={styles.keyNumber}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom row: Empty / Heart, 0, Backspace */}
          <View style={styles.keypadRow}>
            <View style={[styles.keyButton, styles.keyButtonEmpty]}>
              <Heart size={20} color={colors.primaryLight} fill={colors.primaryLight} />
            </View>

            <TouchableOpacity
              style={styles.keyButton}
              activeOpacity={0.65}
              onPress={() => handleKeyPress(0)}
              disabled={isVerifying}
            >
              <Text style={styles.keyNumber}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keyButton, styles.keyButtonAction]}
              activeOpacity={0.65}
              onPress={handleDelete}
              disabled={isVerifying || enteredPin.length === 0}
            >
              <Delete
                size={24}
                color={enteredPin.length === 0 ? colors.textMuted : colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot / Reset Passcode option */}
        {mode === 'unlock' && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              Alert.alert(
                'Reset Passcode',
                'Reset and clear the current passcode on this device so you can create a new one?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset Passcode',
                    style: 'destructive',
                    onPress: async () => {
                      if (resetPasscodeForDebug) {
                        await resetPasscodeForDebug();
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotBtnText}>Forgot Passcode? Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.15 }],
    ...shadows.glowRose,
  },
  dotError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  errorContainer: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.error,
    textAlign: 'center',
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    gap: spacing.md,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  keyButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  keyButtonAction: {
    backgroundColor: colors.surfaceSubtle,
  },
  keyNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  forgotBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  forgotBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    textDecorationLine: 'underline',
  },
});
