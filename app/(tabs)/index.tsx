import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  Layout,
  SlideInDown,
  SlideInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// --- TYPES & CONSTANTS ---
type TaskType = 'kriya' | 'gyana' | 'ojas';
type Difficulty = 'laghu' | 'madhya' | 'tivra' | 'custom';

type Task = {
  id: string;
  title: string;
  xp: number;
  type: TaskType;
  difficulty: Difficulty;
  isPreset: boolean;
};

type PresetQuest = {
  title: string;
  xp: number;
  diff: Difficulty;
};

const STORAGE_KEYS = {
  USER: '@mythic_user_name',
  KARMA: '@mythic_karma',
  LEVEL: '@mythic_level',
  PUNA: '@mythic_puna',
  TASKS: '@mythic_tasks',
};

const CATEGORIES = [
  { id: 'kriya', label: 'KRIYA', color: '#ff9933', icon: 'fire', desc: 'Action & Duty' },
  { id: 'gyana', label: 'GYANA', color: '#4facfe', icon: 'water', desc: 'Wisdom & Note' },
  { id: 'ojas', label: 'OJAS', color: '#00f260', icon: 'leaf', desc: 'Health & Vitality' },
];

const QUEST_DB: Record<TaskType, PresetQuest[]> = {
  kriya: [
    { title: "Deep Work (1h)", xp: 50, diff: 'tivra' },
    { title: "Clean Workspace", xp: 20, diff: 'laghu' },
    { title: "Pay Bills / Admin", xp: 30, diff: 'madhya' },
    { title: "Review Goals", xp: 20, diff: 'laghu' }
  ],
  gyana: [
    { title: "Read Book (30m)", xp: 30, diff: 'madhya' },
    { title: "Learn New Skill (1h)", xp: 50, diff: 'tivra' },
    { title: "Journaling", xp: 20, diff: 'laghu' },
    { title: "Meditation (20m)", xp: 30, diff: 'madhya' }
  ],
  ojas: [
    { title: "Workout (45m)", xp: 50, diff: 'tivra' },
    { title: "Drink Water (2L)", xp: 10, diff: 'laghu' },
    { title: "Sleep 8 Hours", xp: 40, diff: 'tivra' },
    { title: "Nature Walk (20m)", xp: 20, diff: 'laghu' }
  ]
};

// --- VISUAL COMPONENTS ---

// 1. AKASH (Breathing Background)
const AkashBackground = () => {
  const breatheInfo = useSharedValue(0);

  useEffect(() => {
    breatheInfo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000 }),
        withTiming(0, { duration: 8000 })
      ), -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breatheInfo.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#09090b', '#1e1b4b', '#0f172a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// 2. STARFIELD (Particle System)
const Star = ({ index }: { index: number }) => {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const size = Math.random() * 2 + 1;
  const duration = 3000 + Math.random() * 5000;

  const opacity = useSharedValue(0.2);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration }), -1, true);
    translateY.value = withRepeat(withTiming(-20, { duration: duration * 2 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    left: x, top: y, width: size, height: size,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', backgroundColor: '#fff', borderRadius: size / 2 }, style]} />
  );
};

const Starfield = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 35 }).map((_, i) => <Star key={i} index={i} />)}
  </View>
);

// --- MAIN COMPONENT ---
export default function HomeScreen() {
  // STATE
  const [username, setUsername] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [karma, setKarma] = useState(0);
  const [level, setLevel] = useState(1);
  const [puna, setPuna] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [inputVal, setInputVal] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType>('kriya');
  const [showWisdom, setShowWisdom] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  // SCROLL ANIMATION
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-50, 0, 100], [1.2, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.6], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  // DATA LOADING
  useEffect(() => {
    const load = async () => {
      try {
        const [u, k, l, p, t] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.KARMA),
          AsyncStorage.getItem(STORAGE_KEYS.LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.PUNA),
          AsyncStorage.getItem(STORAGE_KEYS.TASKS)
        ]);
        if (u) setUsername(u);
        if (k) setKarma(JSON.parse(k));
        if (l) setLevel(JSON.parse(l));
        if (p) setPuna(JSON.parse(p));
        if (t) setTasks(JSON.parse(t));
      } catch (e) { }
    };
    load();
  }, []);

  // DATA SAVING
  useEffect(() => {
    if (!username) return;
    const save = async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.KARMA, JSON.stringify(karma));
      await AsyncStorage.setItem(STORAGE_KEYS.LEVEL, JSON.stringify(level));
      await AsyncStorage.setItem(STORAGE_KEYS.PUNA, JSON.stringify(puna));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    };
    save();
  }, [karma, level, puna, tasks]);

  // LOGIC
  const handleLogin = async () => {
    if (tempName.trim().length < 2) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, tempName);
    setUsername(tempName);
  };

  const addCustomTask = () => {
    if (!inputVal.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const t: Task = { id: Date.now().toString(), title: inputVal, xp: 0, type: selectedType, difficulty: 'custom', isPreset: false };
    setTasks([t, ...tasks]);
    setInputVal('');
  };

  const addPresetQuest = (q: PresetQuest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t: Task = { id: Date.now().toString(), title: q.title, xp: q.xp, type: selectedType, difficulty: q.diff, isPreset: true };
    setTasks([t, ...tasks]);
    setShowLibrary(false);
  };

  const completeTask = (id: string, xp: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const nextKarma = karma + xp;
    if (nextKarma > level * 100) {
      setLevel(l => l + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setKarma(nextKarma);
    setPuna(p => p + (xp / 10));
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getCatColor = (t: TaskType) => CATEGORIES.find(c => c.id === t)?.color || '#fff';

  // --- RENDERING ---

  // LOGIN
  if (!username) {
    return (
      <View style={styles.container}>
        <AkashBackground />
        <Starfield />
        <Animated.View entering={FadeInDown.delay(300).duration(1000)} style={styles.loginContent}>
          <View style={styles.glowingOrb} />
          <Text style={styles.loginTitle}>LILA</Text>
          <Text style={styles.loginSub}>THE COSMIC PLAY</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="Name your Soul..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={tempName}
            onChangeText={setTempName}
          />
          <TouchableOpacity style={styles.enterBtn} onPress={handleLogin}>
            <Text style={styles.enterText}>BEGIN YATRA</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ASHRAM
  return (
    <View style={styles.container}>
      <AkashBackground />
      <Starfield />

      <SafeAreaView style={{ flex: 1 }}>
        {/* LIST */}
        <Animated.FlatList
          data={tasks}
          keyExtractor={item => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150, paddingTop: 10 }}
          ListHeaderComponent={
            <Animated.View style={[styles.headerContainer, headerStyle]}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.divineTitle}>LILA</Text>
                  <Text style={styles.divineSub}>PRANAM, {username.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowWisdom(true)} style={styles.wisdomIcon}>
                  <MaterialCommunityIcons name="script-text-outline" size={24} color="#ffde59" />
                </TouchableOpacity>
              </View>

              {/* HERO STATS */}
              <View style={styles.heroCard}>
                <View style={styles.statRow}>
                  <View>
                    <Text style={styles.statLabel}>KARMA</Text>
                    <Text style={styles.statVal}>{Math.floor(karma)} <Text style={{ fontSize: 14, color: '#888' }}>/ {level * 100}</Text></Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statLabel}>LEVEL</Text>
                    <Text style={[styles.statVal, { color: '#ffde59' }]}>{level}</Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <LinearGradient colors={['#ff9933', '#ff5e62']} style={[styles.fill, { width: `${Math.min((karma / (level * 100)) * 100, 100)}%` }]} />
                </View>
              </View>

              <Text style={styles.sectionTitle}>YOUR DHARMA</Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => {
            const color = getCatColor(item.type);
            return (
              <Animated.View entering={SlideInDown.delay(index * 100).springify()} layout={Layout.springify()} style={[styles.taskCard, { borderLeftColor: color }]}>
                <TouchableOpacity style={styles.taskContent} onPress={() => completeTask(item.id, item.xp)}>
                  <View style={[styles.checkbox, { borderColor: color }]}>
                    {item.xp > 0 && <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <Text style={[styles.taskMeta, { color: color }]}>{item.type.toUpperCase()}</Text>
                      <Text style={styles.taskMeta}>•</Text>
                      {item.xp > 0 ? (
                        <Text style={[styles.taskMeta, { color: '#fff' }]}>+{item.xp} XP</Text>
                      ) : (
                        <Text style={[styles.taskMeta, { color: '#666' }]}>0 XP (CUSTOM)</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />

        {/* INPUT AREA */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputWrapper}>
          <View style={styles.chipsRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { Haptics.selectionAsync(); setSelectedType(cat.id as any); }}
                style={[styles.chip, selectedType === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <Text style={[styles.chipText, selectedType === cat.id ? { color: '#000' } : { color: '#aaa' }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.glassInput, { borderColor: getCatColor(selectedType) }]}>
            <TouchableOpacity style={styles.bookBtn} onPress={() => setShowLibrary(true)}>
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#888" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Manifest a deed..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputVal}
              onChangeText={setInputVal}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={addCustomTask}>
              <Ionicons name="arrow-up-circle" size={38} color={getCatColor(selectedType)} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* WISDOM OVERLAY */}
        {showWisdom && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <TouchableOpacity activeOpacity={1} onPress={() => setShowWisdom(false)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
            <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.wisdomCard}>
              <LinearGradient colors={['#1a1a1a', '#432e00']} style={StyleSheet.absoluteFill} />
              <Text style={styles.wisdomHeader}>THE PATHS</Text>
              {CATEGORIES.map(cat => (
                <View key={cat.id} style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color={cat.color} />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={[styles.wisdomLabel, { color: cat.color }]}>{cat.label}</Text>
                    <Text style={styles.wisdomDesc}>{cat.desc}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        )}

        {/* LIBRARY SHEET */}
        {showLibrary && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowLibrary(false)} />
            <Animated.View entering={SlideInUp.springify()} style={styles.librarySheet}>
              <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={{ flex: 1, borderRadius: 20, padding: 20 }}>
                <View style={styles.libHeader}>
                  <Text style={styles.libTitle}>{selectedType.toUpperCase()} ARCHIVES</Text>
                </View>
                <FlatList
                  data={QUEST_DB[selectedType]}
                  keyExtractor={i => i.title}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.libItem} onPress={() => addPresetQuest(item)}>
                      <View>
                        <Text style={{ color: '#fff', fontSize: 16 }}>{item.title}</Text>
                        <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>{item.diff.toUpperCase()}</Text>
                      </View>
                      <View style={{ backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: '#ffde59', fontWeight: 'bold' }}>+{item.xp}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // LOGIN
  loginContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  glowingOrb: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ff9933', opacity: 0.2, position: 'absolute', top: '22%' },
  loginTitle: { fontSize: 60, color: '#fff', fontWeight: '100', letterSpacing: 10, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  loginSub: { fontSize: 12, color: '#ffde59', letterSpacing: 5, marginTop: 10, opacity: 0.8 },
  loginInput: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', width: '80%', padding: 15, borderRadius: 12, fontSize: 18, textAlign: 'center', marginTop: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  enterBtn: { marginTop: 20, paddingHorizontal: 40, paddingVertical: 15, backgroundColor: '#fff', borderRadius: 30 },
  enterText: { color: '#000', fontWeight: 'bold', letterSpacing: 2 },

  // HEADER & HERO
  headerContainer: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start' },
  divineTitle: { fontSize: 42, color: '#fff', letterSpacing: 8, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  divineSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, marginTop: 5, fontWeight: 'bold' },
  wisdomIcon: { padding: 10, backgroundColor: 'rgba(255,222,89,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,222,89,0.3)' },

  heroCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 30 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 5 },
  statVal: { color: '#fff', fontSize: 28, fontWeight: '300', letterSpacing: 1 },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  fill: { height: '100%', borderRadius: 2 },

  sectionTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 2, fontWeight: '700', marginLeft: 5 },

  // TASKS
  taskCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderLeftWidth: 4 },
  taskContent: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { color: '#eee', fontSize: 16, letterSpacing: 0.5 },
  taskMeta: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // INPUT
  inputWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  chipsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' },
  chipText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 30, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 5 },
  bookBtn: { padding: 10 },
  textInput: { flex: 1, color: '#fff', height: 50, paddingHorizontal: 10 },
  sendBtn: { padding: 5 },

  // OVERLAYS
  wisdomCard: { width: width * 0.85, padding: 25, borderRadius: 20, borderWidth: 2, borderColor: '#5c4000', overflow: 'hidden' },
  wisdomHeader: { color: '#ffde59', fontSize: 22, letterSpacing: 4, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  wisdomLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  wisdomDesc: { color: '#aaa', fontSize: 12, lineHeight: 16 },

  librarySheet: { height: '50%', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  libHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#444' },
  libTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  libItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
});