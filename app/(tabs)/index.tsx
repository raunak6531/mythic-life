import { StyleSheet, Text, View, SafeAreaView, Platform, StatusBar, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons'; 

export default function HomeScreen() {
  const [karma, setKarma] = useState(0);
  const [level, setLevel] = useState(1);
  const [puna, setPuna] = useState(0);
  
  // Default starting task
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Morning Sadhana', xp: 10 },
  ]);
  
  const [newTask, setNewTask] = useState('');

  // --- LOCAL LOGIC (Instant Add) ---
  const addTask = () => {
    if (newTask.trim().length === 0) return;

    // Success Vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const task = {
      id: Date.now().toString(),
      title: newTask, // Uses exactly what you typed
      xp: 10 + Math.floor(Math.random() * 10) // Random XP (10-20)
    };

    setTasks([...tasks, task]);
    setNewTask(''); // Clear input
  };

  const completeTask = (id: string, xp: number) => {
    // Heavy Impact Vibration
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const newKarma = karma + xp;
    setPuna(puna + (xp / 2));

    // Level Up Logic
    if (newKarma >= 100) {
      setLevel(level + 1);
      setKarma(0);
      alert("✨ SIDDHI ATTAINED! Level " + (level + 1));
    } else {
      setKarma(newKarma);
    }
    
    // Remove task from list
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.content}>
        <Text style={styles.title}>PRARAMBH</Text>
        
        {/* STATS HUD */}
        <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>SIDDHI</Text>
                <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>PUNYA</Text>
                <Text style={styles.statValue}>{puna}</Text>
            </View>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${karma}%` }]} />
            </View>
        </View>
        
        {/* TASK LIST */}
        <View style={styles.listContainer}>
            <Text style={styles.questTitle}>MY DHARMA</Text>
            
            <FlatList 
              data={tasks}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.taskButton} onPress={() => completeTask(item.id, item.xp)}>
                    <View style={styles.checkbox} />
                    <View style={{flex: 1}}>
                        <Text style={styles.taskText}>{item.title}</Text>
                    </View>
                    <Text style={styles.xpText}>+{item.xp} XP</Text>
                </TouchableOpacity>
              )}
            />
        </View>

        {/* INPUT AREA */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputWrapper}>
            <TextInput 
                style={styles.input} 
                placeholder="Declare a new feat..." 
                placeholderTextColor="#666"
                value={newTask}
                onChangeText={setNewTask}
            />
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={addTask}
            >
                <Ionicons name="arrow-up" size={24} color="#1a1a1a" />
            </TouchableOpacity>
        </KeyboardAvoidingView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 32, color: '#ff9933', fontWeight: 'bold', marginBottom: 20, textAlign: 'center', letterSpacing: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { backgroundColor: '#2d2d2d', padding: 10, borderRadius: 8, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#d4af37' },
  statLabel: { color: '#888', fontSize: 10, textTransform: 'uppercase' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  progressContainer: { marginBottom: 20 },
  progressBarBackground: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ff9933' },
  listContainer: { flex: 1 },
  questTitle: { color: '#888', fontSize: 12, marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' },
  taskButton: { backgroundColor: '#252525', padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#d4af37' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#666', marginRight: 15 },
  taskText: { color: '#ffbd59', fontSize: 16, fontWeight: '600' },
  xpText: { color: '#ff9933', fontWeight: 'bold', fontSize: 12, marginLeft: 10 },
  inputWrapper: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', color: '#fff', padding: 15, borderRadius: 8, marginRight: 10 },
  addButton: { backgroundColor: '#ff9933', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});