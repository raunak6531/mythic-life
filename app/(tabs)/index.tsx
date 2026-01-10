import { StyleSheet, Text, View, SafeAreaView, Platform, StatusBar, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Animated, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';

// --- TYPES ---
type TaskType = 'kriya' | 'gyana' | 'ojas';

type Task = {
  id: string;
  title: string;
  xp: number;
  type: TaskType;
};

// --- CONSTANTS ---
const STORAGE_KEY_KARMA = '@mythic_karma';
const STORAGE_KEY_LEVEL = '@mythic_level';
const STORAGE_KEY_PUNA = '@mythic_puna';
const STORAGE_KEY_TASKS = '@mythic_tasks';

const CATEGORIES: { id: TaskType; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'kriya', label: 'KRIYA', color: '#ff9933', icon: 'fire', desc: 'Action & Duty' },
  { id: 'gyana', label: 'GYANA', color: '#4facfe', icon: 'water', desc: 'Wisdom & Study' },
  { id: 'ojas', label: 'OJAS', color: '#00f260', icon: 'leaf', desc: 'Health & Vitality' },
];

export default function HomeScreen() {
  // Game State
  const [karma, setKarma] = useState(0);
  const [level, setLevel] = useState(1);
  const [puna, setPuna] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Inputs
  const [newTask, setNewTask] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType>('kriya');
  const [isLoading, setIsLoading] = useState(true);

  // Level Up Modal State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current; // Pop-up animation

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current; 

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedKarma, storedLevel, storedPuna, storedTasks] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_KARMA),
          AsyncStorage.getItem(STORAGE_KEY_LEVEL),
          AsyncStorage.getItem(STORAGE_KEY_PUNA),
          AsyncStorage.getItem(STORAGE_KEY_TASKS)
        ]);

        if (storedKarma) setKarma(JSON.parse(storedKarma));
        if (storedLevel) setLevel(JSON.parse(storedLevel));
        if (storedPuna) setPuna(JSON.parse(storedPuna));
        if (storedTasks) setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error("Failed to load records", e);
      } finally {
        setIsLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
    };
    loadData();
  }, []);

  // --- SAVE DATA ---
  useEffect(() => {
    if (isLoading) return;
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_KARMA, JSON.stringify(karma));
        await AsyncStorage.setItem(STORAGE_KEY_LEVEL, JSON.stringify(level));
        await AsyncStorage.setItem(STORAGE_KEY_PUNA, JSON.stringify(puna));
        await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      } catch (e) { console.error(e); }
    };
    saveData();
  }, [karma, level, puna, tasks]);

  // --- LOGIC ---
  const addTask = () => {
    if (newTask.trim().length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      xp: 10 + Math.floor(Math.random() * 10),
      type: selectedType
    };

    setTasks([...tasks, task]);
    setNewTask(''); 
  };

  const completeTask = (id: string, xp: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const newKarma = karma + xp;
    setPuna(puna + (xp / 2));

    const threshold = 100 * level;

    if (newKarma >= threshold) { 
      // LEVEL UP MOMENT
      setLevel(level + 1);
      setKarma(newKarma - threshold);
      triggerLevelUpEffect();
    } else {
      setKarma(newKarma);
    }
    
    setTasks(tasks.filter(t => t.id !== id));
  };

  const triggerLevelUpEffect = () => {
    setShowLevelUp(true);
    Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const closeLevelUp = () => {
    setShowLevelUp(false);
    scaleAnim.setValue(0);
  };

  const getCategoryColor = (type: TaskType) => CATEGORIES.find(c => c.id === type)?.color || '#fff';

  // --- RENDER HELPERS ---
  const renderItem = ({ item }: { item: Task }) => {
    const categoryColor = getCategoryColor(item.type);
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
        <LinearGradient
          colors={['#252525', '#1a1a1a']} 
          style={[styles.taskCard, { borderLeftColor: categoryColor }]}
        >
          <TouchableOpacity style={styles.taskContent} onPress={() => completeTask(item.id, item.xp)}>
            <View style={[styles.checkboxContainer, { borderColor: categoryColor }]}>
               <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColor, opacity: 0.5 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={[styles.taskSub, { color: categoryColor }]}>
                {item.type.toUpperCase()} • +{item.xp} XP
              </Text>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: categoryColor + '20' }]}>
               <MaterialCommunityIcons 
                 name={CATEGORIES.find(c => c.id === item.type)?.icon as any} 
                 size={18} 
                 color={categoryColor} 
               />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
             <Text style={styles.appName}>PRARAMBH</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <View style={styles.levelBadge}>
                <Text style={styles.levelText}>LVL {level}</Text>
            </View>
            <Link href="/modal" asChild>
                <TouchableOpacity>
                    <Ionicons name="information-circle-outline" size={28} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* HERO STATS */}
        <LinearGradient
          colors={['#ff9966', '#ff5e62']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.heroCard}
        >
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statLabel}>KARMA</Text>
              <Text style={styles.statNumber}>{Math.floor(karma)} / {100 * level}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statLabel}>PUNYA</Text>
              <Text style={styles.statNumber}>{Math.floor(puna)}</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(karma / (100 * level)) * 100}%` }]} />
          </View>
        </LinearGradient>

        {/* TASK LIST */}
        <FlatList 
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 160 }} 
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.sectionTitle}>YOUR DHARMA</Text>}
        />

        {/* INPUT AREA */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          style={styles.inputWrapper}
        >
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => { Haptics.selectionAsync(); setSelectedType(cat.id); }}
                style={[styles.chip, selectedType === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <Text style={[styles.chipText, selectedType === cat.id ? { color: '#000', fontWeight: 'bold' } : { color: cat.color }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputContainer, { borderColor: getCategoryColor(selectedType) }]}>
            <TextInput 
              style={styles.input} 
              placeholder={`Add a ${selectedType} feat...`}
              placeholderTextColor="#888"
              value={newTask}
              onChangeText={setNewTask}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: getCategoryColor(selectedType) }]} 
              onPress={addTask}
            >
              <Ionicons name="arrow-up" size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* --- LEVEL UP MODAL --- */}
        <Modal visible={showLevelUp} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.levelUpCard, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#43cea2', '#185a9d']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.levelContent}>
                        <MaterialCommunityIcons name="meditation" size={80} color="#fff" />
                        <Text style={styles.levelTitle}>SIDDHI ATTAINED</Text>
                        <Text style={styles.levelSub}>You have reached Level {level}!</Text>
                        <Text style={styles.levelDesc}>Your consciousness expands. The path becomes clearer.</Text>
                        
                        <TouchableOpacity style={styles.claimButton} onPress={closeLevelUp}>
                            <Text style={styles.claimText}>ACCEPT DESTINY</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  levelText: { color: '#ffde59', fontWeight: 'bold', fontSize: 12 },
  
  heroCard: { padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#ff5e62', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  progressBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },

  sectionTitle: { color: '#888', letterSpacing: 1.5, fontSize: 12, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },

  // Task Card
  taskCard: { borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 5 },
  taskContent: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { color: '#eee', fontSize: 16, fontWeight: '600' },
  taskSub: { fontSize: 11, fontWeight: 'bold', marginTop: 2, letterSpacing: 0.5 },
  iconBadge: { padding: 8, borderRadius: 12, marginLeft: 10 },

  // Input Area
  inputWrapper: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  chipContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: 'rgba(0,0,0,0.5)' },
  chipText: { fontSize: 12, letterSpacing: 1 },

  inputContainer: { flexDirection: 'row', backgroundColor: '#252525', borderRadius: 30, padding: 5, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  input: { flex: 1, color: '#fff', paddingHorizontal: 20, height: 50 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },

  // Level Up Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  levelUpCard: { width: '85%', height: 400, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  levelContent: { alignItems: 'center', padding: 30, width: '100%' },
  levelTitle: { fontSize: 26, color: '#fff', fontWeight: 'bold', letterSpacing: 3, marginTop: 20, textAlign: 'center' },
  levelSub: { fontSize: 18, color: '#d4af37', marginTop: 10, fontWeight: '600' },
  levelDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 15, lineHeight: 22 },
  claimButton: { marginTop: 40, backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  claimText: { color: '#185a9d', fontWeight: 'bold', letterSpacing: 1 }
});