import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { hashPasscode, legacyHashPasscode, generateSalt, validatePasscodeFormat } from './passcodeUtils';

const PASSCODE_HASH_KEY = 'datty_passcode_hash_v2';
const PASSCODE_SALT_KEY = 'datty_passcode_salt_v2';
const LOCKOUT_UNTIL_KEY = '@datty_passcode_lockout_until';
const FAILED_ATTEMPTS_KEY = '@datty_passcode_failed_attempts';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_COOLDOWN_MS = 30000; // 30 seconds

// Cross-platform secure storage helper (Hardware Keychain/Keystore on Native, AsyncStorage fallback on Web)
const secureSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (e) {
      console.warn('[PasscodeStorage] SecureStore set failed, falling back to AsyncStorage', e);
    }
  }
  await AsyncStorage.setItem(key, value);
};

const secureGet = async (key: string): Promise<string | null> => {
  if (Platform.OS !== 'web') {
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    } catch (e) {
      console.warn('[PasscodeStorage] SecureStore get failed, falling back to AsyncStorage', e);
    }
  }
  return await AsyncStorage.getItem(key);
};

const secureRemove = async (key: string): Promise<void> => {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // ignore
    }
  }
  await AsyncStorage.removeItem(key);
};

export { hashPasscode, generateSalt, validatePasscodeFormat };

export interface PasscodeVerificationResult {
  success: boolean;
  isLockedOut?: boolean;
  remainingLockoutSeconds?: number;
  remainingAttempts?: number;
  error?: string;
}

export interface PasscodeContextValue {
  isConfigured: boolean;
  isLocked: boolean;
  loading: boolean;
  lockoutRemainingSeconds: number;
  setupPasscode: (pin: string) => Promise<boolean>;
  verifyPasscode: (pin: string) => Promise<PasscodeVerificationResult>;
  changePasscode: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  lockApp: () => void;
  resetPasscodeForDebug?: () => Promise<void>;
}

const PasscodeContext = createContext<PasscodeContextValue>({
  isConfigured: false,
  isLocked: false,
  loading: true,
  lockoutRemainingSeconds: 0,
  setupPasscode: async () => false,
  verifyPasscode: async () => ({ success: false }),
  changePasscode: async () => ({ success: false }),
  lockApp: () => {},
});

export const PasscodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Periodic timer for active lockout countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkLockout = async () => {
      const storedLockout = await AsyncStorage.getItem(LOCKOUT_UNTIL_KEY);
      if (storedLockout) {
        const lockoutTime = parseInt(storedLockout, 10);
        const now = Date.now();
        if (lockoutTime > now) {
          const remainingSec = Math.ceil((lockoutTime - now) / 1000);
          setLockoutRemainingSeconds(remainingSec);
          interval = setInterval(() => {
            const currentNow = Date.now();
            if (lockoutTime > currentNow) {
              setLockoutRemainingSeconds(Math.ceil((lockoutTime - currentNow) / 1000));
            } else {
              setLockoutRemainingSeconds(0);
              AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY).catch(() => {});
              if (interval) clearInterval(interval);
            }
          }, 1000);
          return;
        } else {
          setLockoutRemainingSeconds(0);
          await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
        }
      }
    };

    checkLockout();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Load initial passcode configuration status on launch
  useEffect(() => {
    let isMounted = true;
    const checkPasscode = async () => {
      try {
        const storedHash = await secureGet(PASSCODE_HASH_KEY);
        if (isMounted) {
          if (storedHash) {
            setIsConfigured(true);
            setIsLocked(true); // Cold start locks app if passcode is configured
          } else {
            setIsConfigured(false);
            setIsLocked(true); // Requires setup first
          }
        }
      } catch (e) {
        console.error('[PasscodeContext] Failed to read passcode status:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkPasscode();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to AppState changes (locks app when closed or put to background and reopened)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current === 'background' || appState.current === 'inactive';
      const isNowActive = nextAppState === 'active';

      if (wasBackground && isNowActive) {
        // App was reopened after being closed / sent to background
        secureGet(PASSCODE_HASH_KEY)
          .then((storedHash) => {
            if (storedHash) {
              setIsLocked(true);
            }
          })
          .catch((e) => {
            console.error('[PasscodeContext] AppState recheck error:', e);
          });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Set up a new passcode
  const setupPasscode = useCallback(async (pin: string): Promise<boolean> => {
    if (!validatePasscodeFormat(pin)) return false;
    try {
      const salt = generateSalt();
      const hash = hashPasscode(pin, salt);
      await secureSet(PASSCODE_HASH_KEY, hash);
      await secureSet(PASSCODE_SALT_KEY, salt);
      await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
      setLockoutRemainingSeconds(0);
      setIsConfigured(true);
      setIsLocked(false);
      return true;
    } catch (e) {
      console.error('[PasscodeContext] setupPasscode error:', e);
      return false;
    }
  }, []);

  // Verify entered passcode with brute-force rate-limiting and lockout protection
  const verifyPasscode = useCallback(async (pin: string): Promise<PasscodeVerificationResult> => {
    try {
      // Check active lockout
      const storedLockout = await AsyncStorage.getItem(LOCKOUT_UNTIL_KEY);
      if (storedLockout) {
        const lockoutTime = parseInt(storedLockout, 10);
        const now = Date.now();
        if (lockoutTime > now) {
          const remainingSec = Math.ceil((lockoutTime - now) / 1000);
          setLockoutRemainingSeconds(remainingSec);
          return {
            success: false,
            isLockedOut: true,
            remainingLockoutSeconds: remainingSec,
            error: `Too many attempts. Try again in ${remainingSec}s`,
          };
        }
      }

      const storedHash = await secureGet(PASSCODE_HASH_KEY);
      const storedSalt = await secureGet(PASSCODE_SALT_KEY);

      if (!storedHash || !storedSalt) {
        return { success: false, error: 'No passcode configured' };
      }

      const inputHash = hashPasscode(pin, storedSalt);
      if (inputHash === storedHash) {
        // Success: Reset failed attempts & lockout
        await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
        await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
        setLockoutRemainingSeconds(0);
        setIsLocked(false);
        return { success: true };
      }

      // Check legacy hash for existing passcodes created before the optimization
      const legacyHash = legacyHashPasscode(pin, storedSalt);
      if (legacyHash === storedHash) {
        // Upgrade to new fast hash so all future unlocks are instant
        await secureSet(PASSCODE_HASH_KEY, inputHash);
        await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
        await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
        setLockoutRemainingSeconds(0);
        setIsLocked(false);
        return { success: true };
      }

      // Failed attempt tracking
      const attemptsStr = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
      const currentAttempts = (attemptsStr ? parseInt(attemptsStr, 10) : 0) + 1;
      await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, currentAttempts.toString());

      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_COOLDOWN_MS;
        await AsyncStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutTime.toString());
        setLockoutRemainingSeconds(30);
        return {
          success: false,
          isLockedOut: true,
          remainingLockoutSeconds: 30,
          error: 'Too many incorrect attempts. Locked for 30 seconds.',
        };
      }

      const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
      return {
        success: false,
        remainingAttempts: remaining,
        error: `Incorrect passcode. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      };
    } catch (e) {
      console.error('[PasscodeContext] verifyPasscode error:', e);
      return { success: false, error: 'Verification failed' };
    }
  }, []);

  // Change existing passcode
  const changePasscode = useCallback(
    async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!validatePasscodeFormat(newPin)) {
        return { success: false, error: 'New passcode must be 4 digits' };
      }
      try {
        const storedHash = await secureGet(PASSCODE_HASH_KEY);
        const storedSalt = await secureGet(PASSCODE_SALT_KEY);

        if (!storedHash || !storedSalt) {
          return { success: false, error: 'No existing passcode found' };
        }

        const inputHash = hashPasscode(oldPin, storedSalt);
        if (inputHash !== storedHash) {
          const legacyHash = legacyHashPasscode(oldPin, storedSalt);
          if (legacyHash !== storedHash) {
            return { success: false, error: 'Current passcode is incorrect' };
          }
        }

        const newSalt = generateSalt();
        const newHash = hashPasscode(newPin, newSalt);
        await secureSet(PASSCODE_HASH_KEY, newHash);
        await secureSet(PASSCODE_SALT_KEY, newSalt);

        return { success: true };
      } catch (e) {
        console.error('[PasscodeContext] changePasscode error:', e);
        return { success: false, error: 'Failed to update passcode' };
      }
    },
    []
  );

  // Manually lock app
  const lockApp = useCallback(() => {
    if (isConfigured) {
      setIsLocked(true);
    }
  }, [isConfigured]);

  const resetPasscodeForDebug = useCallback(async () => {
    await secureRemove(PASSCODE_HASH_KEY);
    await secureRemove(PASSCODE_SALT_KEY);
    await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
    await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
    setLockoutRemainingSeconds(0);
    setIsConfigured(false);
    setIsLocked(true);
  }, []);

  return (
    <PasscodeContext.Provider
      value={{
        isConfigured,
        isLocked,
        loading,
        lockoutRemainingSeconds,
        setupPasscode,
        verifyPasscode,
        changePasscode,
        lockApp,
        resetPasscodeForDebug,
      }}
    >
      {children}
    </PasscodeContext.Provider>
  );
};

export const usePasscode = () => useContext(PasscodeContext);

