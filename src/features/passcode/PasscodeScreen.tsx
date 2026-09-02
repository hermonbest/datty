import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePasscode } from '../../services/passcodeContext';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Lock, ShieldCheck, KeyRound, Delete, X } from 'lucide-react-native';

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

  const [step, setStep] = useState<'create' | 'confirm' | 'current' | 'new'>(
    mode === 'setup' ? 'create' : mode === 'change' ? 'current' : 'create'
  );

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [firstEnteredPin, setFirstEnteredPin] = useState<string>('');
  const [oldPin, setOldPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const isLockedOut = lockoutRemainingSeconds > 0;

  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  let title = 'Datty';
  let subtitle = isLockedOut
    ? `Locked for ${lockoutRemainingSeconds}s`
    : 'Enter Passcode to Unlock';
  let iconComponent = <Lock size={36} color={isLockedOut ? colors.error : colors.primary} />;

  if (mode === 'setup') {
    if (step === 'create') {
      title = 'Create Passcode';
      subtitle = 'Set a 4-digit passcode for your space';
      iconComponent = <KeyRound size={36} color={colors.primary} />;
    } else {
      title = 'Confirm Passcode';
      subtitle = 'Re-enter your 4-digit passcode';
      iconComponent = <ShieldCheck size={36} color={colors.primary} />;
    }
  } else if (mode === 'change') {
    if (step === 'current') {
      title = 'Current Passcode';
      subtitle = 'Enter your current 4-digit passcode';
      iconComponent = <KeyRound size={36} color={colors.primary} />;
    } else if (step === 'new') {
      title = 'New Passcode';
      subtitle = 'Choose your new passcode';
      iconComponent = <KeyRound size={36} color={colors.primary} />;
    } else {
      title = 'Confirm New Passcode';
      subtitle = 'Re-enter your new passcode';
      iconComponent = <ShieldCheck size={36} color={colors.primary} />;
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Blurred Mock App Background */}
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwxRCMQ0cqLy9kL23lc6uPqWurzp56r0GcPXIuNE5Uhvp3TisdM64kjCEVCguhnQKT-RZ3JdwzZHRwRXElV_L_gfcMVq9FieSwJsU5tty4JiXP-r83pb5VEGeXd4jg0lI7YaDBfnjtkjQkwFuTWcEEu3n1TLRySoGNhGOe7a8-07c43VD_FqlQXFGw4T09wCSfFvwesiFyBE9Wv2ITAYgoAy0P6Sxdueq08BYeHr5Z-gqihkolzecx' }}
        style={styles.bgImage}
        blurRadius={12}
      />
      
      {/* Glassmorphism Overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {onCancel && (
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <X size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>{iconComponent}</View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* PIN Dots */}
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

          {/* Error Message */}
          <View style={styles.errorContainer}>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          {/* Keypad */}
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
                    activeOpacity={0.7}
                    onPress={() => handleKeyPress(num)}
                    disabled={isVerifying}
                  >
                    <Text style={styles.keyNumber}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.keypadRow}>
              <View style={[styles.keyButton, styles.keyButtonEmpty]} />

              <TouchableOpacity
                style={styles.keyButton}
                activeOpacity={0.7}
                onPress={() => handleKeyPress(0)}
                disabled={isVerifying}
              >
                <Text style={styles.keyNumber}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.keyButton, styles.keyButtonAction]}
                activeOpacity={0.7}
                onPress={handleDelete}
                disabled={isVerifying || enteredPin.length === 0}
              >
                <Delete size={28} color={enteredPin.length === 0 ? colors.outlineVariant : colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          {mode === 'unlock' && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Reset Passcode',
                    'Clear the current passcode on this device?',
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
                <Text style={styles.forgotBtnText}>Forgot Passcode?</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Fallback
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.05 }], // Prevent edge bleed
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252, 234, 233, 0.6)', // surface-container/60
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    maxWidth: 448, // max-w-md
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  iconWrapper: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xxl,
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  dotError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  errorContainer: {
    minHeight: 24,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.error,
    textAlign: 'center',
    lineHeight: 18,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  keyButton: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  keyButtonEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyButtonAction: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyNumber: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    opacity: 0.85,
  },
});

