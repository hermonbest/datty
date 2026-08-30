import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Image,
  Animated
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { Copy, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const UnlinkedCoupleScreen: React.FC = () => {
  const { userProfile, user, refreshCouple, signOut, loading } = useCouple();
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true, // For scale
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleCopyCode = async () => {
    const code = `node scripts/setupCouple.js ${userProfile?.email || 'your-email@example.com'} partner@example.com`;
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      toast.error('Copy Failed', 'Could not copy to clipboard.');
    }
  };

  const handleRefresh = async () => {
    toast.info('Checking...', 'Checking link status with your partner');
    await refreshCouple();
  };

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Datty</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 64 + spacing.xl }]}>
        
        {/* Illustration Area */}
        <Animated.View style={[styles.illustrationWrapper, { transform: [{ scale }] }]}>
          {/* We emulate the box-shadow pulsing by just pulsing the image slightly, 
              as dynamic shadow pulsing is expensive in React Native */}
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3qjsyA8IXIlOWWLPp18E6p0LFAnFzBiBca5SrtjRo7dA9QMLDU93Hn85Jf7R9-ClBn2Vzjn0Xt27EhQzApDIV0QdcXB8x2SuH9jEwVhVcqu1LWtAKQPeojrrmV911U9IiqcajXfylJ6d_u_7q8tkSHehNbUeeTeE_8fnaQT6DjTPwou2EUQ8PuDGInHKEf8KshCgLWTvOVYd1wSvCSA8YooF9IuyNAxPAH7xI1fVXfrFF0VtW0t-A' }} 
            style={styles.illustration}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Copy */}
        <View style={styles.copyArea}>
          <Text style={styles.title}>Almost there.</Text>
          <Text style={styles.subtitle}>
            Datty is a shared space. Invite your partner to begin your journey together.
          </Text>
        </View>

        {/* Invite Code Section */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteLabel}>Your Unique Invite Code</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeText} numberOfLines={1} ellipsizeMode="tail">
              {userProfile?.email || user?.email}
            </Text>
            <TouchableOpacity 
              style={styles.copyBtn} 
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Copy size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.feedbackText, { opacity: copied ? 1 : 0 }]}>
            Copied to clipboard!
          </Text>
        </View>

        {/* Primary Action */}
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={handleRefresh}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Send size={20} color={colors.onPrimary} />
          <Text style={styles.primaryBtnText}>
            {loading ? 'Checking...' : 'Share Invite Link'}
          </Text>
        </TouchableOpacity>

        {/* Skip Action */}
        <TouchableOpacity 
          style={styles.skipBtn}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>I'll do this later</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
    backgroundColor: 'rgba(255, 248, 247, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64, // plus insets in component
  },
  headerTitle: {
    ...typography.headlineLgMobile,
    color: colors.primary,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xxl,
    maxWidth: 512, // max-w-lg
    alignSelf: 'center',
    width: '100%',
  },
  illustrationWrapper: {
    width: 192, // w-48
    height: 192,
    marginBottom: spacing.lg,
    borderRadius: 96,
    shadowColor: colors.surfaceTint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 96,
  },
  copyArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm, // px-4
    marginBottom: spacing.md,
  },
  title: {
    ...typography.displayLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 384, // max-w-sm
  },
  inviteSection: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)', // border-outline-variant/30
  },
  inviteLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.5)',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  codeText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    letterSpacing: 2, // tracking-widest
    paddingLeft: spacing.md,
    paddingVertical: 12,
    flex: 1,
  },
  copyBtn: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
    minHeight: 16,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md, // py-4 equivalent
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
  },
  skipBtnText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
});
