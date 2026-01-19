import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { PremiumColors, PremiumShadows, BorderRadius, Spacing } from '@/constants/theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  borderColor?: string;
  gradient?: string[];
};

export function GlassCard({ children, style, glowColor, borderColor, gradient }: GlassCardProps) {
  return (
    <Animated.View
      entering={FadeIn}
      layout={Layout.springify()}
      style={[
        styles.glassCard,
        glowColor && PremiumShadows.glow(glowColor, 0.3),
        borderColor && { borderColor },
        style,
      ]}
    >
      {gradient && (
        <LinearGradient
          colors={gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.glassOverlay}>
        {children}
      </View>
    </Animated.View>
  );
}

type PremiumCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: string[];
  borderColor?: string;
  glowColor?: string;
};

export function PremiumCard({ children, style, gradient, borderColor, glowColor }: PremiumCardProps) {
  return (
    <Animated.View
      entering={FadeIn}
      layout={Layout.springify()}
      style={[
        styles.premiumCard,
        glowColor && PremiumShadows.glow(glowColor, 0.4),
        borderColor && { borderColor },
        style,
      ]}
    >
      {gradient && (
        <LinearGradient
          colors={gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.cardContent}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: PremiumColors.glass.light,
    overflow: 'hidden',
    backgroundColor: PremiumColors.glass.dark,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
  },
  premiumCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...PremiumShadows.large,
  },
  cardContent: {
    padding: Spacing.xl,
  },
});

