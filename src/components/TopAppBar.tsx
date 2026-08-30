import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../theme';
import { Avatar } from './Avatar';
import { useCouple } from '../services/coupleContext';

export const TopAppBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { partnerProfile } = useCouple();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.avatarWrapper}>
          <Avatar 
            name={partnerProfile?.displayName || 'Partner'} 
            photoURL={partnerProfile?.photoURL} 
            size="md" 
          />
        </View>
        
        <Text style={styles.title}>Datty</Text>
        
        <TouchableOpacity style={styles.actionBtn}>
          <Heart size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 248, 247, 0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  content: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displayLg,
    color: colors.primary,
    fontSize: 40, // Slightly scaled down from 48px so it doesn't clip in the 64px header, while still maintaining the displayLg font family and weight
    lineHeight: 48,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
