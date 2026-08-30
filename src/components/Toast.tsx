import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const timeoutRef = React.useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    fadeAnim.stopAnimation();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setToast(null));
  }, [fadeAnim]);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      fadeAnim.stopAnimation();

      const id = Math.random().toString();
      setToast({ id, type, title, message });

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        timeoutRef.current = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            setToast((current) => (current?.id === id ? null : current));
          });
        }, 3200);
      });
    },
    [fadeAnim]
  );

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            toast.type === 'success' && styles.successContainer,
            toast.type === 'error' && styles.errorContainer,
            toast.type === 'info' && styles.infoContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.iconContainer}>
            {toast.type === 'success' && <CheckCircle2 size={20} color={colors.success} />}
            {toast.type === 'error' && <AlertCircle size={20} color={colors.error} />}
            {toast.type === 'info' && <Info size={20} color={colors.info} />}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (t: ToastType, title: string, m?: string) => console.log(`[Toast ${t}] ${title}: ${m || ''}`),
      success: (title: string, m?: string) => console.log(`[Toast Success] ${title}: ${m || ''}`),
      error: (title: string, m?: string) => console.error(`[Toast Error] ${title}: ${m || ''}`),
      info: (title: string, m?: string) => console.log(`[Toast Info] ${title}: ${m || ''}`),
    };
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  successContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  errorContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  infoContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  message: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
