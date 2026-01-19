import {
  PremiumColors,
  PremiumGradients,
  PremiumShadows,
} from "@/constants/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={PremiumGradients.cosmic}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated particles background */}
      <View style={styles.particlesContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 100).duration(1000)}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={PremiumGradients.divine}
              style={styles.iconGradient}
            >
              <Ionicons name="book" size={48} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>LILA</Text>
          <Text style={styles.subtitle}>The Rules of the Cosmic Play</Text>
        </Animated.View>

        {/* SECTION 1: THE CURRENCIES */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionHeader}>YOUR SOUL STATS</Text>
            <View style={styles.sectionLine} />
          </View>

          <InfoRow
            label="KARMA"
            sub="XP / Experience"
            desc="The result of your actions. Accumulate Karma to attain higher levels of Siddhi."
            color={PremiumColors.karma}
            icon="infinity"
            delay={500}
          />
          <InfoRow
            label="PUNYA"
            sub="Merit Points"
            desc="Good merit earned alongside Karma. In the future, spend Punya to unlock themes."
            color={PremiumColors.punya}
            icon="star-circle"
            delay={600}
          />
          <InfoRow
            label="SIDDHI"
            sub="Level"
            desc="Your spiritual level. As you complete tasks, your Siddhi grows."
            color={PremiumColors.siddhi}
            icon="trophy"
            delay={700}
          />
        </Animated.View>

        <View style={styles.divider} />

        {/* SECTION 2: THE 3 ENERGIES */}
        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionHeader}>THE THREE PATHS</Text>
            <View style={styles.sectionLine} />
          </View>

          <InfoRow
            label="KRIYA"
            sub="Action (Fire)"
            desc="Tasks related to work, duty, career, and coding. The energy of doing."
            color={PremiumColors.kriya.primary}
            icon="fire"
            delay={900}
          />
          <InfoRow
            label="GYANA"
            sub="Wisdom (Water)"
            desc="Tasks related to learning, reading, planning, and intellect."
            color={PremiumColors.gyana.primary}
            icon="water"
            delay={1000}
          />
          <InfoRow
            label="OJAS"
            sub="Vitality (Earth)"
            desc="Tasks related to health, fitness, meditation, and the body."
            color={PremiumColors.ojas.primary}
            icon="leaf"
            delay={1100}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Helper Component for premium info rows
function InfoRow({ label, sub, desc, color, icon, delay }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.row}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}05`] as any}
        style={styles.rowGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${color}30` }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={styles.sub}> • {sub}</Text>
          </View>
          <Text style={styles.desc}>{desc}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none" as const,
  },
  particle: {
    position: "absolute" as const,
    backgroundColor: PremiumColors.text.muted,
    borderRadius: 999,
    opacity: 0.3,
  },
  content: {
    padding: 30,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center" as const,
    marginBottom: 50,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
    borderRadius: 999,
    overflow: "hidden" as const,
    ...PremiumShadows.glow(PremiumColors.gold.primary, 0.6),
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 999,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold" as const,
    color: PremiumColors.text.primary,
    letterSpacing: 8,
    marginTop: 10,
    textShadowColor: PremiumColors.gold.glow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: PremiumColors.text.tertiary,
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },

  section: {
    marginBottom: 20,
  },
  sectionHeaderContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 25,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: PremiumColors.glass.light,
  },
  sectionHeader: {
    color: PremiumColors.text.muted,
    fontSize: 11,
    fontWeight: "bold" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  divider: {
    height: 1,
    backgroundColor: PremiumColors.glass.light,
    marginVertical: 40,
    opacity: 0.3,
  },

  row: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden" as const,
  },
  rowGradient: {
    padding: 20,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    borderWidth: 1,
    borderColor: PremiumColors.glass.light,
    borderRadius: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold" as const,
    letterSpacing: 1.5,
  },
  sub: {
    color: PremiumColors.text.muted,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  desc: {
    color: PremiumColors.text.tertiary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
});
