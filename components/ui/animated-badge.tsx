import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumColors, PremiumShadows, BorderRadius, Typography, Spacing } from '@/constants/theme';

type AnimatedBadgeProps = {
  icon: string;
  value: string | number;
  color: string;
  label?: string;
  style?: ViewStyle;
  pulse?: boolean;
};

export function AnimatedBadge({ icon, value, color, label, style, pulse = false }: AnimatedBadgeProps) {
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    if (pulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulse ? interpolate(pulseAnim.value, [0, 1], [1, 1.05]) : 1 },
    ],
    opacity: pulse ? interpolate(pulseAnim.value, [0, 1], [0.9, 1]) : 1,
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle, style]}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.badgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.badgeContent}>
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
          <Text style={[styles.badgeValue, { color }]}>{value}</Text>
          {label && <Text style={styles.badgeLabel}>{label}</Text>}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

type GlowingBadgeProps = {
  icon: string;
  value: string | number;
  gradient: string[];
  style?: ViewStyle;
};

export function GlowingBadge({ icon, value, gradient, style }: GlowingBadgeProps) {
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        styles.glowingBadge,
        {
          shadowColor: gradient[0],
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
          elevation: 8,
        },
        animatedGlowStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.glowingGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color="#fff" />
        <Text style={styles.glowingValue}>{value}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: PremiumColors.glass.light,
    overflow: 'hidden',
    ...PremiumShadows.small,
  },
  badgeGradient: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeValue: {
    ...Typography.tiny,
    fontWeight: '700',
  },
  badgeLabel: {
    ...Typography.tiny,
    color: PremiumColors.text.muted,
    marginLeft: Spacing.xs,
  },
  glowingBadge: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  glowingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  glowingValue: {
    ...Typography.caption,
    color: PremiumColors.text.primary,
    fontWeight: '700',
  },
});

