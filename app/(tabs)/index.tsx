import { StyleSheet, Text, View, SafeAreaView, Platform, StatusBar, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Alert, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TYPES ---
type Task = {
  id: string;
  title: string;
  xp: number;
  type: 'dharma' | 'karma' | 'gyana'; // Adding categories for future use
};

// --- KEYS FOR STORAGE ---
const STORAGE_KEY_KARMA = '@mythic_karma';
const STORAGE_KEY_LEVEL = '@mythic_level';
const STORAGE_KEY_PUNA = '@mythic_puna';
const STORAGE_KEY_TASKS = '@mythic_tasks';

export default function HomeScreen() {
  // Game State
  const [karma, setKarma] = useState(0);
  const [level, setLevel] = useState(1);
  const [puna, setPuna] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current; // For screen load

  // --- INITIAL LOAD (The "Akashic Record") ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedKarma = await AsyncStorage.getItem(STORAGE_KEY_KARMA);
        const storedLevel = await AsyncStorage.getItem(STORAGE_KEY_LEVEL);
        const storedPuna = await AsyncStorage.getItem(STORAGE_KEY_PUNA);
        const storedTasks = await AsyncStorage.getItem(STORAGE_KEY_TASKS);

        if (storedKarma) setKarma(JSON.parse(storedKarma));
        if (storedLevel) setLevel(JSON.parse(storedLevel));
        if (storedPuna) setPuna(JSON.parse(storedPuna));
        
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        } else {
          // Default start for new user
          setTasks([{ id: '1', title: 'Pratah Smaran (Morning Reflection)', xp: 15, type: 'dharma' }]);
        }
      } catch (e) {
        console.error("Failed to load records from Akash", e);
      } finally {
        setIsLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    };
    loadData();
  }, []);

  // --- SAVE DATA SIDE EFFECT ---
  useEffect(() => {
    if (isLoading) return; // Don't save zero values during load
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_KARMA, JSON.stringify(karma));
        await AsyncStorage.setItem(STORAGE_KEY_LEVEL, JSON.stringify(level));
        await AsyncStorage.setItem(STORAGE_KEY_PUNA, JSON.stringify(puna));
        await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      } catch (e) {
        console.error("Failed to write to Akash", e);
      }
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
      xp: 15 + Math.floor(Math.random() * 15),
      type: 'karma'
    };

    setTasks([...tasks, task]);
    setNewTask(''); 
  };

  const completeTask = (id: string, xp: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Animate removal (simple version: just update state)
    const newKarma = karma + xp;
    setPuna(puna + (xp / 2));

    if (newKarma >= 100 * level) { // Harder to level up as you go
      setLevel(level + 1);
      setKarma(newKarma - (100 * level));
      Alert.alert("✨ SIDDHI ATTAINED", `You have reached Level ${level + 1}! The universe expands.`);
    } else {
      setKarma(newKarma);
    }
    
    setTasks(tasks.filter(t => t.id !== id));
  };

  // --- RENDER HELPERS ---
  const renderItem = ({ item, index }: { item: Task, index: number }) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.taskCard}
      >
        <TouchableOpacity style={styles.taskContent} onPress={() => completeTask(item.id, item.xp)}>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxInner} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskSub}>+ {item.xp} Prana</Text>
          </View>
          <MaterialCommunityIcons name="fire" size={20} color="#ff9933" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* BACKGROUND GRADIENT - The Void/Akash */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.appName}>PRARAMBH</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {level}</Text>
          </View>
        </View>

        {/* HERO CARD - THE SOUL STATS */}
        <LinearGradient
          colors={['#ff9966', '#ff5e62']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
          
          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(karma / (100 * level)) * 100}%` }]} />
          </View>
        </LinearGradient>

        {/* LIST */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR DHARMA</Text>
            <Ionicons name="infinite" size={18} color="#888" />
          </View>

          <FlatList 
            data={tasks}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* FLOATING INPUT */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          style={styles.inputWrapper}
        >
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="What is your duty today?" 
              placeholderTextColor="#aaa"
              value={newTask}
              onChangeText={setNewTask}
            />
            <TouchableOpacity style={styles.sendButton} onPress={addTask}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium' },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  levelText: { color: '#ffde59', fontWeight: 'bold', fontSize: 12 },
  
  heroCard: { padding: 20, borderRadius: 24, marginBottom: 30, shadowColor: '#ff5e62', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  progressBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#888', letterSpacing: 1.5, fontSize: 12, fontWeight: 'bold' },
  
  listContainer: { flex: 1 },
  taskCard: { borderRadius: 16, padding: 1, marginBottom: 12, overflow: 'hidden' }, // padding 1 for border effect if needed later
  taskContent: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#555', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkboxInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'transparent' },
  taskTitle: { color: '#eee', fontSize: 16, fontWeight: '600' },
  taskSub: { color: '#ff9933', fontSize: 12, marginTop: 2 },

  inputWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  inputContainer: { flexDirection: 'row', backgroundColor: '#252525', borderRadius: 30, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,  borderWidth: 1, borderColor: '#333' },
  input: { flex: 1, color: '#fff', paddingHorizontal: 20, height: 50 },
  sendButton: { width: 50, height: 50, backgroundColor: '#ff9933', borderRadius: 25, justifyContent: 'center', alignItems: 'center' }
});