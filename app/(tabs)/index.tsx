import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  Layout,
  SlideInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated';

// --- TYPES & CONSTANTS ---
type AppState = 'portal' | 'ashram';
type TaskType = 'kriya' | 'gyana' | 'ojas';

type Task = {
  id: string;
  title: string;
  xp: number;
  type: TaskType;
};

const STORAGE_KEYS = {
  USER: '@mythic_user_name',
  KARMA: '@mythic_karma',
  LEVEL: '@mythic_level',
  PUNA: '@mythic_puna',
  TASKS: '@mythic_tasks',
};

const CATEGORIES: { id: TaskType; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'kriya', label: 'KRIYA', color: '#ff9933', icon: 'fire', desc: 'Action & Duty' },
  { id: 'gyana', label: 'GYANA', color: '#00d2ff', icon: 'water', desc: 'Wisdom & Note' },
  { id: 'ojas', label: 'OJAS', color: '#00f260', icon: 'leaf', desc: 'Vitality & Health' },
];

const { width, height } = Dimensions.get('window');

// --- COMPONENTS ---

// 1. THE AKASH (Breathing Background)
const AkashBackground = () => {
  const breatheInfo = useSharedValue(0);

  useEffect(() => {
    breatheInfo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000 }), // Inhale
        withTiming(0, { duration: 8000 })  // Exhale
      ),
      -1, // Infinite
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breatheInfo.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base Layer: Void Black to Deep Indigo */}
      <LinearGradient
        colors={['#09090b', '#1e1b4b', '#0f172a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Breathe Layer: Purple/Magenta Mist */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// 2. STARFIELD (Particle System)
const STAR_COUNT = 35;
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
    left: x,
    top: y,
    width: size,
    height: size,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', backgroundColor: '#fff', borderRadius: size / 2 },
        style
      ]}
    />
  );
};

const Starfield = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <Star key={i} index={i} />
      ))}
    </View>
  );
};

// 3. THE PORTAL (Login State)
const Portal = ({ onEnter }: { onEnter: (name: string) => void }) => {
  const [name, setName] = useState('');

  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.5, 1], [0.95, 1.05]) }]
  }));

  const handleEnter = () => {
    if (name.trim().length > 0) {
      onEnter(name);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Animated.View exiting={FadeOut.duration(800)} style={styles.portalContainer}>
      <Animated.View style={[styles.portalLogoContainer, logoStyle]}>
        <Text style={styles.portalTitle}>LILA</Text>
        <Text style={styles.portalSub}>THE COSMIC PLAY</Text>
      </Animated.View>

      <View style={styles.portalInputContainer}>
        <TextInput
          style={styles.portalInput}
          placeholder="Name your Soul..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.portalButton} onPress={handleEnter}>
        <Text style={styles.portalButtonText}>BEGIN YATRA</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 4. THE WISDOM SCROLL (Overlay)
const WisdomScroll = ({ onClose }: { onClose: () => void }) => {
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
      {/* Backdrop */}
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />

      {/* Scroll Content */}
      <Animated.View
        entering={ZoomIn.springify()}
        exiting={ZoomOut.duration(300)}
        style={styles.scrollPaper}
      >
        <LinearGradient
          colors={['#1a1a1a', '#432e00']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.scrollHeader}>
          <MaterialCommunityIcons name="scroll-text" size={32} color="#ffde59" />
          <Text style={styles.scrollTitle}>THE THREE PATHS</Text>
        </View>

        {CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.scrollItem}>
            <View style={[styles.scrollIconBox, { borderColor: cat.color }]}>
              <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.scrollItemTitle, { color: cat.color }]}>{cat.label}</Text>
              <Text style={styles.scrollItemDesc}>{cat.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.sealButton} onPress={onClose}>
          <Text style={styles.sealText}>CARRY ON</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

// 5. MAIN SCREEN LOGIC
export default function HomeScreen() {
  // --- APP STATE ---
  const [appState, setAppState] = useState<AppState>('portal'); // start at portal, check auth later
  const [showScroll, setShowScroll] = useState(false);
  const [userName, setUserName] = useState('');
  const [authChecked, setAuthChecked] = useState(false); // New loading state

  // --- GAME STATE ---
  const [karma, setKarma] = useState(0);
  const [level, setLevel] = useState(1);
  const [puna, setPuna] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [newTask, setNewTask] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType>('kriya');

  // --- SCROLL ANIMATION ---
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // --- INITIAL LOAD & AUTH CHECK ---
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

        if (u) {
          setUserName(u);
          setAppState('ashram');
        } else {
          setAppState('portal');
        }

        if (k) setKarma(JSON.parse(k));
        if (l) setLevel(JSON.parse(l));
        if (p) setPuna(JSON.parse(p));
        if (t) setTasks(JSON.parse(t));
      } catch (e) {
        console.log('Error loading', e);
      } finally {
        setAuthChecked(true);
      }
    };
    load();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (!authChecked) return;
    const save = async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.KARMA, JSON.stringify(karma));
      await AsyncStorage.setItem(STORAGE_KEYS.LEVEL, JSON.stringify(level));
      await AsyncStorage.setItem(STORAGE_KEYS.PUNA, JSON.stringify(puna));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      if (userName) await AsyncStorage.setItem(STORAGE_KEYS.USER, userName);
    };
    save();
  }, [karma, level, puna, tasks, userName, authChecked]);

  // --- ACTIONS ---
  const handleLogin = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUserName(name);
    setAppState('ashram');
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      xp: Math.floor(Math.random() * 15) + 10,
      type: selectedType
    };
    setTasks(prev => [task, ...prev]);
    setNewTask('');
  };

  const handleComplete = (id: string, xp: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const nextKarma = karma + xp;
    const threshold = level * 100;

    if (nextKarma >= threshold) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLevel(l => l + 1);
      setKarma(nextKarma - threshold);
    } else {
      setKarma(nextKarma);
    }

    setPuna(p => p + (xp * 0.5));
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- ANIMATED STYLES ---
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-50, 0, 100], [1.2, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.6], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
      paddingTop: interpolate(scrollY.value, [0, 100], [40, 20], Extrapolation.CLAMP),
    };
  });

  const getCategoryColor = (t: TaskType) => CATEGORIES.find(c => c.id === t)?.color || '#fff';

  const renderItem = useCallback(({ item, index }: { item: Task, index: number }) => {
    const color = getCategoryColor(item.type);

    return (
      <Animated.View
        entering={SlideInDown.delay(index * 100).springify()}
        exiting={FadeOut}
        layout={Layout.springify()}
        style={[styles.glassCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      >
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => handleComplete(item.id, item.xp)}
        >
          <View style={[styles.checkbox, { borderColor: color }]}>
            <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, opacity: 0.6 }} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={[styles.taskSub, { color }]}>{item.type.toUpperCase()} • +{item.xp} XP</Text>
          </View>

          <Ionicons name="sparkles-outline" size={16} color={color} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, []);

  if (!authChecked) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AkashBackground />
      <Starfield />

      {/* STATE 1: PORTAL */}
      {appState === 'portal' && (
        <Portal onEnter={handleLogin} />
      )}

      {/* STATE 2: ASHRAM (Main) */}
      {appState === 'ashram' && (
        <Animated.View entering={FadeIn.duration(1000)} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <Animated.FlatList
              data={tasks}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150, paddingTop: 10 }}
              ListHeaderComponent={
                <Animated.View style={[styles.headerContainer, headerStyle]}>
                  <View style={styles.headerTopDisplay}>
                    <View>
                      <Text style={styles.divineTitle}>LILA</Text>
                      <Text style={styles.divineSub}>WELCOME, {userName.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowScroll(true)} style={styles.wisdomIcon}>
                      <MaterialCommunityIcons name="script-text-outline" size={26} color="#ffde59" />
                    </TouchableOpacity>
                  </View>

                  {/* HERO STATS */}
                  <View style={styles.glassCardHero}>
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
                    {/* Progress Line */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${(karma / (level * 100)) * 100}%` }]} />
                    </View>
                  </View>

                  <Text style={styles.sectionHeader}>YOUR DHARMA</Text>
                </Animated.View>
              }
            />

            {/* INPUT BAR */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
              style={styles.inputWrapper}
            >
              <View style={styles.chipsRow}>
                {CATEGORIES.map(cat => {
                  const isActive = selectedType === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedType(cat.id);
                      }}
                      style={[
                        styles.chip,
                        isActive && { backgroundColor: cat.color, borderColor: cat.color, shadowColor: cat.color, shadowOpacity: 0.5, shadowRadius: 10 }
                      ]}
                    >
                      <Text style={[styles.chipText, isActive ? { color: '#000', fontWeight: '800' } : { color: '#aaa' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={[
                styles.glassInput,
                { borderColor: getCategoryColor(selectedType), shadowColor: getCategoryColor(selectedType) }
              ]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Manifest a new deed..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newTask}
                  onChangeText={setNewTask}
                  enableFocusRing={false}
                />
                <TouchableOpacity onPress={handleAddTask} style={styles.sendBtn}>
                  <Ionicons name="arrow-up-circle" size={38} color={getCategoryColor(selectedType)} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* STATE 3: WISDOM SCROLL OVERLAY */}
      {showScroll && <WisdomScroll onClose={() => setShowScroll(false)} />}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // --- HEADER & MAIN ---
  headerContainer: { marginBottom: 20 },
  headerTopDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, paddingHorizontal: 5 },
  wisdomIcon: { padding: 10, borderRadius: 20, backgroundColor: 'rgba(255, 222, 89, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 222, 89, 0.3)' },
  divineTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontSize: 42,
    color: '#fff',
    letterSpacing: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20
  },
  divineSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: 5,
    fontWeight: 'bold'
  },

  // --- PORTAL ---
  portalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  portalLogoContainer: { alignItems: 'center', marginBottom: 60 },
  portalTitle: { fontSize: 60, color: '#fff', fontWeight: '100', fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', letterSpacing: 10 },
  portalSub: { color: '#ffde59', fontSize: 14, letterSpacing: 5, marginTop: 10, opacity: 0.8 },
  portalInputContainer: { width: '100%', maxWidth: 300, marginBottom: 30 },
  portalInput: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, padding: 15, fontSize: 18, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  portalButton: { backgroundColor: '#fff', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  portalButtonText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, color: '#000' },

  // --- WISDOM SCROLL ---
  scrollPaper: { width: width * 0.85, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#5c4000', padding: 25 },
  scrollHeader: { alignItems: 'center', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 222, 89, 0.3)', paddingBottom: 15 },
  scrollTitle: { color: '#ffde59', fontSize: 22, letterSpacing: 4, fontWeight: 'bold', marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  scrollItem: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  scrollIconBox: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  scrollItemTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  scrollItemDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 },
  sealButton: { alignSelf: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  sealText: { color: 'rgba(255,255,255,0.7)', letterSpacing: 2, fontSize: 10, fontWeight: 'bold' },

  // --- GLASS COMPONENTS ---
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  glassCardHero: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 30
  },

  // Hero Stats
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 5 },
  statVal: { color: '#fff', fontSize: 28, fontWeight: '300', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2, shadowColor: '#fff', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8 },

  // List
  sectionHeader: { alignSelf: 'flex-start', color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 2, fontWeight: '700', marginBottom: 20, marginLeft: 5 },
  taskContent: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { color: '#eee', fontSize: 16, letterSpacing: 0.5, fontWeight: '400' },
  taskSub: { fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 1, opacity: 0.8 },

  // Input
  inputWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  chipsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' },
  chipText: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },

  glassInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(20px)',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  textInput: { flex: 1, color: '#fff', paddingHorizontal: 20, height: 50, fontSize: 16 },
  sendBtn: { padding: 5 }
});