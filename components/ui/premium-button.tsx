import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PremiumColors, PremiumShadows, BorderRadius, Typography } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type PremiumButtonProps = {
  onPress: () => void;
  children: React.ReactNode;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  glowColor?: string;
  disabled?: boolean;
};

export function PremiumButton({
  onPress,
  children,
  gradient = ['#ff9933', '#ff6b35'],
  style,
  textStyle,
  glowColor,
  disabled = false,
}: PremiumButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        styles.button,
        glowColor && PremiumShadows.glow(glowColor, 0.5),
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#666', '#444'] : gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, textStyle]}>{children}</Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

type GlassButtonProps = {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  borderColor?: string;
};

export function GlassButton({ onPress, children, style, textStyle, borderColor }: GlassButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.glassButton,
        borderColor && { borderColor },
        style,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.glassText, textStyle]}>{children}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    ...PremiumShadows.medium,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: PremiumColors.text.primary,
    ...Typography.caption,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  glassButton: {
    backgroundColor: PremiumColors.glass.dark,
    borderWidth: 1,
    borderColor: PremiumColors.glass.light,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassText: {
    color: PremiumColors.text.secondary,
    ...Typography.caption,
  },
});

