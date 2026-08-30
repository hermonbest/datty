import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, shadows, typography } from '../theme';

interface AvatarProps {
  name?: string;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'You',
  photoURL,
  size = 'md',
  style,
  highlighted = false,
  borderColor,
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase() || 'U';
  };

  const sizePixels = {
    xs: 24,
    sm: 34,
    md: 46,
    lg: 64,
    xl: 88,
  }[size];

  const fontSize = {
    xs: 10,
    sm: typography.sizes.xs,
    md: typography.sizes.sm,
    lg: typography.sizes.lg,
    xl: typography.sizes.xxl,
  }[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: sizePixels,
          height: sizePixels,
          borderRadius: sizePixels / 2,
        },
        highlighted && styles.highlighted,
        borderColor ? { borderColor, borderWidth: 2 } : null,
        style,
      ]}
    >
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{
            width: sizePixels,
            height: sizePixels,
            borderRadius: sizePixels / 2,
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: sizePixels,
              height: sizePixels,
              borderRadius: sizePixels / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },
});
