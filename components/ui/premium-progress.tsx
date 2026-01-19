import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumColors, BorderRadius, Spacing, Typography } from '@/constants/theme';

type PremiumProgressBarProps = {
  progress: number; // 0-100
  gradient: string[];
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
  animated?: boolean;
};

export function PremiumProgressBar({
  progress,
  gradient,
  height = 12,
  showLabel = false,
  label,
  style,
  animated = true,
}: PremiumProgressBarProps) {
  const progressAnim = useSharedValue(0);
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withSpring(progress, {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  useEffect(() => {
    if (animated) {
      shimmerAnim.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [animated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: animated ? interpolate(shimmerAnim.value, [0, 0.5, 1], [0.3, 0.8, 0.3]) : 1,
  }));

  return (
    <View style={[styles.container, style]}>
      {showLabel && label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, progressStyle]}>
          <LinearGradient
            colors={gradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

type CircularProgressProps = {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
};

export function CircularProgress({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
  children,
}: CircularProgressProps) {
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withSpring(progress, {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(progressAnim.value, [0, 100], [0, 360]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.circularTrack}>
        <Animated.View style={[styles.circularFill, animatedStyle, { borderColor: color, borderWidth: strokeWidth }]} />
      </View>
      {children && (
        <View style={styles.circularContent}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...Typography.caption,
    color: PremiumColors.text.secondary,
    marginBottom: Spacing.xs,
  },
  track: {
    backgroundColor: PremiumColors.glass.dark,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.glass.light,
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularTrack: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderColor: 'transparent',
  },
  circularContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

