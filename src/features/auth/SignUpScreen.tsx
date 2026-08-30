import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Input, Button, Card, useToast } from '../../components';
import { useAuth } from './useAuth';
import { Heart, Mail, Lock, User as UserIcon } from 'lucide-react-native';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    try {
      await signUp(email, password, displayName);
      toast.success('Account created', 'Welcome to Us!');
    } catch (e: any) {
      // Error handled in hook
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Heart size={32} color={colors.primary} fill={colors.primary} />
          </View>
          <Text style={styles.title}>Join Us</Text>
          <Text style={styles.subtitle}>Create your private account</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>

          <Input
            label="Your Name or Nickname"
            placeholder="e.g. Alex"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            leftIcon={<UserIcon size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Email"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="•••••••• (min. 6 characters)"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            error={error || undefined}
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            size="lg"
            style={styles.signUpButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignIn}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
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
    marginTop: 4,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radii.xl,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});
