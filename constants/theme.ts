/**
 * Premium Theme System for LILA - The Cosmic Play
 * Mythological-inspired design tokens with premium aesthetics
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

// Premium Color Palette - Mythological Theme
export const PremiumColors = {
  // Primary Paths
  kriya: {
    primary: "#ff9933",
    light: "#ffb366",
    dark: "#cc7a29",
    glow: "rgba(255, 153, 51, 0.4)",
    gradient: ["#ff9933", "#ff6b35"],
  },
  gyana: {
    primary: "#4facfe",
    light: "#72c0ff",
    dark: "#3d8ace",
    glow: "rgba(79, 172, 254, 0.4)",
    gradient: ["#4facfe", "#00f2fe"],
  },
  ojas: {
    primary: "#00f260",
    light: "#5fff9a",
    dark: "#00c24d",
    glow: "rgba(0, 242, 96, 0.4)",
    gradient: ["#00f260", "#0575e6"],
  },

  // Divine Accents
  gold: {
    primary: "#FFD700",
    light: "#FFE55C",
    dark: "#D4AF37",
    glow: "rgba(255, 215, 0, 0.5)",
  },

  // Status Colors
  karma: "#ff5e62",
  punya: "#ffde59",
  siddhi: "#d4af37",

  // Backgrounds
  cosmic: {
    deep: "#09090b",
    void: "#0f0c29",
    nebula: "#1e1b4b",
    space: "#0f172a",
  },

  // Glass & Overlays
  glass: {
    light: "rgba(255, 255, 255, 0.1)",
    medium: "rgba(255, 255, 255, 0.15)",
    dark: "rgba(0, 0, 0, 0.3)",
    darker: "rgba(0, 0, 0, 0.6)",
  },

  // Text
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.8)",
    tertiary: "rgba(255, 255, 255, 0.6)",
    muted: "rgba(255, 255, 255, 0.4)",
    disabled: "rgba(255, 255, 255, 0.3)",
  },
};

// Premium Gradients
export const PremiumGradients = {
  cosmic: ["#09090b", "#1e1b4b", "#0f172a"] as const,
  cosmicAlt: ["#1a1a2e", "#16213e", "#1a1a2e"] as const,
  fire: ["#ff9933", "#ff6b35", "#ff5e62"] as const,
  water: ["#4facfe", "#00f2fe", "#43e97b"] as const,
  earth: ["#00f260", "#0575e6", "#00d2ff"] as const,
  divine: ["#FFD700", "#FFA500", "#FF6347"] as const,
  shadow: ["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)", "transparent"] as const,
  glass: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"] as const,
  darkGlass: ["rgba(0,0,0,0.4)", "rgba(0,0,0,0.2)"] as const,
};

// Premium Shadows
export const PremiumShadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string, opacity = 0.5) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: 12,
    elevation: 6,
  }),
  divine: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Premium Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Premium Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Premium Typography
export const Typography = {
  hero: {
    fontSize: 48,
    fontWeight: "700" as const,
    letterSpacing: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "600" as const,
    letterSpacing: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600" as const,
    letterSpacing: 2,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1.5,
  },
  tiny: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
