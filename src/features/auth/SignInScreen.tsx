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
import { Heart, Mail, Lock } from 'lucide-react-native';

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useAuth();
  const toast = useToast();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Missing fields', 'Please enter both your email and password.');
      return;
    }
    try {
      await signIn(email, password);
      toast.success('Welcome back', 'Signed in successfully');
    } catch (e: any) {
      // Error is set in hook
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
          <Text style={styles.title}>Us</Text>
          <Text style={styles.subtitle}>Our private corner of the world</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

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
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            error={error || undefined}
          />

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            size="lg"
            style={styles.signInButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>First time here? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.footerLink}>Create Account</Text>
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
    marginBottom: spacing.xl,
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
  signInButton: {
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
