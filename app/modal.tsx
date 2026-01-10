import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1a1a1a', '#0f0c29']} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="book" size={40} color="#ff9933" />
          <Text style={styles.title}>LILA</Text>
          <Text style={styles.subtitle}>The Rules of the Game</Text>
        </View>

        {/* SECTION 1: THE CURRENCIES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>YOUR SOUL STATS</Text>
          
          <InfoRow 
            label="KARMA" 
            sub="XP / Experience"
            desc="The result of your actions. Accumulate Karma to attain higher levels of Siddhi."
            color="#ff5e62"
          />
          <InfoRow 
            label="PUNYA" 
            sub="Merit Points"
            desc="Good merit earned alongside Karma. In the future, spend Punya to unlock themes."
            color="#fff"
          />
           <InfoRow 
            label="SIDDHI" 
            sub="Level"
            desc="Your spiritual level. As you complete tasks, your Siddhi grows."
            color="#ffde59"
          />
        </View>

        <View style={styles.divider} />

        {/* SECTION 2: THE 3 ENERGIES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>THE THREE PATHS</Text>
          
          <InfoRow 
            label="KRIYA" 
            sub="Action (Fire)"
            desc="Tasks related to work, duty, career, and coding. The energy of doing."
            color="#ff9933"
            icon="fire"
          />
          <InfoRow 
            label="GYANA" 
            sub="Wisdom (Water)"
            desc="Tasks related to learning, reading, planning, and intellect."
            color="#4facfe"
            icon="water"
          />
          <InfoRow 
            label="OJAS" 
            sub="Vitality (Earth)"
            desc="Tasks related to health, fitness, meditation, and the body."
            color="#00f260"
            icon="leaf"
          />
        </View>

      </ScrollView>
    </View>
  );
}

// Helper Component for neat rows
function InfoRow({ label, sub, desc, color, icon }: any) {
  return (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
            {icon && <MaterialCommunityIcons name={icon} size={16} color={color} style={{marginRight: 8}} />}
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={styles.sub}> • {sub}</Text>
        </View>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 30, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 4, marginTop: 10 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 5, letterSpacing: 1 },
  
  section: { marginBottom: 10 },
  sectionHeader: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 30 },

  row: { flexDirection: 'row', marginBottom: 25 },
  textContainer: { flex: 1 },
  label: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  sub: { color: '#aaa', fontSize: 14 },
  desc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20, marginTop: 2 },
});