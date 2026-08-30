import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { colors, radii } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radii.sm,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.textColumn}>
          <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="25%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={180} borderRadius={radii.md} style={{ marginVertical: 12 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="50%" height={14} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    marginLeft: 12,
    flex: 1,
  },
});
