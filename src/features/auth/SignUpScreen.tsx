import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';
import { Input, useToast } from '../../components';
import { useAuth } from './useAuth';
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react-native';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
  onNavigateBack?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn, onNavigateBack }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signUp, loading, error } = useAuth();
  const toast = useToast();

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast.error('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (!termsAccepted) {
      toast.error('Terms not accepted', 'Please agree to the Terms of Service.');
      return;
    }

    try {
      await signUp(email, password, displayName);
      toast.success('Account created', 'Welcome to Datty!');
    } catch (e: any) {
      // Error handled in hook
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconBtn} onPress={onNavigateBack} disabled={!onNavigateBack}>
          {onNavigateBack && <ArrowLeft size={24} color={colors.onSurfaceVariant || '#544245'} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Datty</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <HelpCircle size={24} color={colors.onSurfaceVariant || '#544245'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Start your journey together</Text>
            <Text style={styles.subtitle}>Create a shared sanctuary for your memories.</Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwAVP9tKO46sHpbkBUALpbmgWFqonFKGkXpTKwqCRVVBrr5C0RtbXXSQg29c4s3Qg-OIocmXsUT5PiQq1NZ2g3nmBLq8JVoetH3J7TPoqVg79rERINw6WsNEwu0OJL7QU58dobB-m9p50VhD2s-J14xKTqSv-8xaAIy0ueFAKKtRlJRbAH0pC4bQBqTNRycisYqeGIG5e01rjWZj3uKcaZM1lmSXl-ceccEUpSKuCQSxewjwlLMjg1' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Input
                label="Your Name"
                placeholder="How should we call you?"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                leftIcon={<UserIcon size={20} color={colors.outlineVariant || '#d9c1c4'} />}
                containerStyle={styles.inputSpacing}
              />

              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon={<Mail size={20} color={colors.outlineVariant || '#d9c1c4'} />}
                containerStyle={styles.inputSpacing}
              />

              <Input
                label="Password"
                placeholder="Create a secure password"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Lock size={20} color={colors.outlineVariant || '#d9c1c4'} />}
                containerStyle={styles.inputSpacing}
              />
              
              <Input
                label="Confirm Password"
                placeholder="Confirm your secure password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon={<Lock size={20} color={colors.outlineVariant || '#d9c1c4'} />}
                error={error || undefined}
              />
            </View>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              />
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSignUp}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Creating...' : 'Sign Up'}
                </Text>
                {!loading && <ArrowRight size={20} color={colors.onPrimary || '#ffffff'} />}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={onNavigateToSignIn}>
                  <Text style={styles.footerLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#fff8f7',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    backgroundColor: 'rgba(255, 248, 247, 0.8)',
    zIndex: 50,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: 'ebGaramond',
    fontSize: 28,
    color: colors.primary || '#60162e',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 32, // pt-24 conceptually after header
    paddingBottom: 64, // pb-xxl
    paddingHorizontal: 20,
  },
  mainContent: {
    width: '100%',
    maxWidth: 448, // max-w-md
    gap: 40, // space-y-xl
  },
  headerSection: {
    alignItems: 'center',
    gap: 8, // space-y-sm
    marginBottom: 40,
  },
  title: {
    fontFamily: 'ebGaramond',
    fontSize: 48,
    fontWeight: '500',
    letterSpacing: -0.96,
    color: colors.onBackground || '#221919',
    textAlign: 'center',
    lineHeight: 56,
  },
  subtitle: {
    fontFamily: 'manrope',
    fontSize: 18,
    color: colors.onSurfaceVariant || '#544245',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12, // rounded-xl
    overflow: 'hidden',
    shadowColor: colors.primary || '#60162e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 3,
    marginBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    width: '100%',
    backgroundColor: colors.surfaceContainer || '#fceae9',
    padding: 24, // p-lg
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.5)', // border-outline-variant/50
    shadowColor: colors.primary || '#60162e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: 24, // space-y-lg
  },
  inputGroup: {
    gap: 16, // space-y-md
    marginBottom: 24,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 24, // pt-sm conceptually
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant || '#d9c1c4',
    backgroundColor: colors.background || '#fff8f7',
    marginTop: 4, // mt-1
  },
  checkboxChecked: {
    backgroundColor: colors.primary || '#60162e',
    borderColor: colors.primary || '#60162e',
  },
  termsText: {
    flex: 1,
    fontFamily: 'manrope',
    fontSize: 12, // text-label-sm
    fontWeight: '500',
    color: colors.onSurfaceVariant || '#544245',
    lineHeight: 16,
  },
  linkText: {
    color: colors.primary || '#60162e',
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 16, // space-y-md
  },
  submitBtn: {
    width: '100%',
    backgroundColor: colors.primary || '#60162e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16, // py-4
    borderRadius: 8,
    shadowColor: colors.primary || '#60162e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  submitBtnText: {
    fontFamily: 'manrope',
    fontSize: 14, // text-label-md
    fontWeight: '600',
    letterSpacing: 0.7,
    color: colors.onPrimary || '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'manrope',
    fontSize: 16,
    color: colors.onSurfaceVariant || '#544245',
  },
  footerLink: {
    fontFamily: 'manrope',
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary || '#60162e',
    textDecorationLine: 'underline',
  },
});
