import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Extrapolation,
    FadeInDown,
    FadeOut,
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
    ZoomOut,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// --- TYPES & CONSTANTS ---
type TaskType = "kriya" | "gyana" | "ojas";
type Difficulty = "laghu" | "madhya" | "tivra" | "custom";

type Task = {
  id: string;
  title: string;
  xp: number;
  type: TaskType;
  difficulty: Difficulty;
  isPreset: boolean;
};

type PresetQuest = {
  id: string;
  title: string;
  xp: number;
  diff: Difficulty;
  cooldownMin: number;
  dailyCap: number;
};

type QuestLog = {
  [questId: string]: {
    lastCompleted: number;
    countToday: number;
    lastDate: string;
  };
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type:
      | "tasks_completed"
      | "streak_days"
      | "level_reached"
      | "karma_earned"
      | "path_tasks";
    value: number;
    path?: TaskType;
  };
  unlocked: boolean;
  unlockedAt?: number;
};

type Boss = {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  currentHp: number;
  damagePerTask: number;
  lootPunya: number;
  weekStart: string;
  defeated: boolean;
};

const STORAGE_KEYS = {
  USER: "@mythic_user_name",
  KARMA: "@mythic_karma",
  PUNA: "@mythic_puna",
  TASKS: "@mythic_tasks",
  STREAK: "@mythic_streak",
  LAST_DATE: "@mythic_last_date",
  QUEST_LOG: "@mythic_quest_log",
  ACHIEVEMENTS: "@mythic_achievements",
  BOSS: "@mythic_boss",
  TOTAL_TASKS: "@mythic_total_tasks",
};

const CATEGORIES = [
  {
    id: "kriya",
    label: "KRIYA",
    color: "#ff9933",
    icon: "fire",
    desc: "Action & Duty",
  },
  {
    id: "gyana",
    label: "GYANA",
    color: "#4facfe",
    icon: "water",
    desc: "Wisdom & Note",
  },
  {
    id: "ojas",
    label: "OJAS",
    color: "#00f260",
    icon: "leaf",
    desc: "Health & Vitality",
  },
];

const QUEST_DB: Record<TaskType, PresetQuest[]> = {
  kriya: [
    {
      id: "kriya_deep_work",
      title: "Deep Work (1h)",
      xp: 50,
      diff: "tivra",
      cooldownMin: 120,
      dailyCap: 3,
    },
    {
      id: "kriya_clean",
      title: "Clean Workspace",
      xp: 20,
      diff: "laghu",
      cooldownMin: 240,
      dailyCap: 2,
    },
    {
      id: "kriya_admin",
      title: "Pay Bills / Admin",
      xp: 30,
      diff: "madhya",
      cooldownMin: 360,
      dailyCap: 1,
    },
    {
      id: "kriya_goals",
      title: "Review Goals",
      xp: 20,
      diff: "laghu",
      cooldownMin: 720,
      dailyCap: 1,
    },
  ],
  gyana: [
    {
      id: "gyana_read",
      title: "Read Book (30m)",
      xp: 30,
      diff: "madhya",
      cooldownMin: 90,
      dailyCap: 4,
    },
    {
      id: "gyana_learn",
      title: "Learn New Skill (1h)",
      xp: 50,
      diff: "tivra",
      cooldownMin: 180,
      dailyCap: 2,
    },
    {
      id: "gyana_journal",
      title: "Journaling",
      xp: 20,
      diff: "laghu",
      cooldownMin: 360,
      dailyCap: 2,
    },
    {
      id: "gyana_meditate",
      title: "Meditation (20m)",
      xp: 30,
      diff: "madhya",
      cooldownMin: 240,
      dailyCap: 3,
    },
  ],
  ojas: [
    {
      id: "ojas_workout",
      title: "Workout (45m)",
      xp: 50,
      diff: "tivra",
      cooldownMin: 360,
      dailyCap: 2,
    },
    {
      id: "ojas_water",
      title: "Drink Water (2L)",
      xp: 10,
      diff: "laghu",
      cooldownMin: 60,
      dailyCap: 8,
    },
    {
      id: "ojas_sleep",
      title: "Sleep 8 Hours",
      xp: 40,
      diff: "tivra",
      cooldownMin: 1440,
      dailyCap: 1,
    },
    {
      id: "ojas_walk",
      title: "Nature Walk (20m)",
      xp: 20,
      diff: "laghu",
      cooldownMin: 180,
      dailyCap: 3,
    },
  ],
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Complete your first task",
    icon: "foot-print",
    color: "#4facfe",
    requirement: { type: "tasks_completed", value: 1 },
    unlocked: false,
  },
  {
    id: "dedicated",
    title: "Dedicated",
    description: "Maintain a 7-day streak",
    icon: "calendar-check",
    color: "#ff9933",
    requirement: { type: "streak_days", value: 7 },
    unlocked: false,
  },
  {
    id: "ascetic",
    title: "Ascetic",
    description: "Maintain a 30-day streak",
    icon: "meditation",
    color: "#ff5e62",
    requirement: { type: "streak_days", value: 30 },
    unlocked: false,
  },
  {
    id: "enlightened",
    title: "Enlightened",
    description: "Reach Level 10",
    icon: "star-circle",
    color: "#ffde59",
    requirement: { type: "level_reached", value: 10 },
    unlocked: false,
  },
  {
    id: "karma_collector",
    title: "Karma Collector",
    description: "Earn 1000 Karma",
    icon: "infinity",
    color: "#00f260",
    requirement: { type: "karma_earned", value: 1000 },
    unlocked: false,
  },
  {
    id: "kriya_master",
    title: "Kriya Master",
    description: "Complete 50 Kriya tasks",
    icon: "fire",
    color: "#ff9933",
    requirement: { type: "path_tasks", value: 50, path: "kriya" },
    unlocked: false,
  },
  {
    id: "gyana_seeker",
    title: "Gyana Seeker",
    description: "Complete 50 Gyana tasks",
    icon: "water",
    color: "#4facfe",
    requirement: { type: "path_tasks", value: 50, path: "gyana" },
    unlocked: false,
  },
  {
    id: "ojas_champion",
    title: "Ojas Champion",
    description: "Complete 50 Ojas tasks",
    icon: "leaf",
    color: "#00f260",
    requirement: { type: "path_tasks", value: 50, path: "ojas" },
    unlocked: false,
  },
  {
    id: "century",
    title: "Century",
    description: "Complete 100 total tasks",
    icon: "trophy",
    color: "#d4af37",
    requirement: { type: "tasks_completed", value: 100 },
    unlocked: false,
  },
  {
    id: "balanced_soul",
    title: "Balanced Soul",
    description: "Complete 10 tasks in each path",
    icon: "yin-yang",
    color: "#fff",
    requirement: { type: "tasks_completed", value: 30 },
    unlocked: false,
  },
];

const BOSS_ROSTER = [
  {
    id: "kama",
    name: "Kama",
    description: "Demon of Desire",
    maxHp: 500,
    damagePerTask: 15,
    lootPunya: 200,
  },
  {
    id: "krodha",
    name: "Krodha",
    description: "Demon of Anger",
    maxHp: 600,
    damagePerTask: 12,
    lootPunya: 250,
  },
  {
    id: "lobha",
    name: "Lobha",
    description: "Demon of Greed",
    maxHp: 700,
    damagePerTask: 10,
    lootPunya: 300,
  },
  {
    id: "moha",
    name: "Moha",
    description: "Demon of Delusion",
    maxHp: 800,
    damagePerTask: 9,
    lootPunya: 350,
  },
  {
    id: "mada",
    name: "Mada",
    description: "Demon of Pride",
    maxHp: 900,
    damagePerTask: 8,
    lootPunya: 400,
  },
  {
    id: "matsarya",
    name: "Matsarya",
    description: "Demon of Envy",
    maxHp: 1000,
    damagePerTask: 7,
    lootPunya: 500,
  },
];

// --- VISUAL COMPONENTS ---

const AkashBackground = () => {
  const breatheInfo = useSharedValue(0);

  useEffect(() => {
    breatheInfo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000 }),
        withTiming(0, { duration: 8000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breatheInfo.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#09090b", "#1e1b4b", "#0f172a"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#1a1a2e"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const Star = ({ index }: { index: number }) => {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const size = Math.random() * 2 + 1;
  const duration = 3000 + Math.random() * 5000;

  const opacity = useSharedValue(0.2);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration }), -1, true);
    translateY.value = withRepeat(
      withTiming(-20, { duration: duration * 2 }),
      -1,
      true,
    );
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
        {
          position: "absolute",
          backgroundColor: "#fff",
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
};

const Starfield = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 35 }).map((_, i) => (
      <Star key={i} index={i} />
    ))}
  </View>
);

// --- MAIN COMPONENT ---
export default function HomeScreen() {
  // STATE
  const [username, setUsername] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // Game Stats
  const [karma, setKarma] = useState(0);
  const [puna, setPuna] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questLog, setQuestLog] = useState<QuestLog>({});
  const [totalTasks, setTotalTasks] = useState(0);
  const [pathCounts, setPathCounts] = useState({ kriya: 0, gyana: 0, ojas: 0 });

  // New Features
  const [achievements, setAchievements] =
    useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null,
  );

  // UI State
  const [inputVal, setInputVal] = useState("");
  const [selectedType, setSelectedType] = useState<TaskType>("kriya");
  const [showWisdom, setShowWisdom] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBoss, setShowBoss] = useState(false);

  // COMPUTED LEVEL
  const level = Math.floor(Math.sqrt(karma / 100)) + 1;
  const nextLevelKarma = 100 * Math.pow(level, 2);
  const currentLevelBaseKarma = 100 * Math.pow(level - 1, 2);
  const progressPercent =
    Math.min(
      Math.max(
        (karma - currentLevelBaseKarma) /
          (nextLevelKarma - currentLevelBaseKarma),
        0,
      ),
      1,
    ) * 100;

  // SCROLL ANIMATION
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-50, 0, 100],
      [1.2, 1, 0.9],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.6],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  // DATA LOADING
  useEffect(() => {
    const load = async () => {
      try {
        const [u, k, p, t, s, d, ql, a, b, tt, pc] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.KARMA),
          AsyncStorage.getItem(STORAGE_KEYS.PUNA),
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.STREAK),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE),
          AsyncStorage.getItem(STORAGE_KEYS.QUEST_LOG),
          AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.BOSS),
          AsyncStorage.getItem(STORAGE_KEYS.TOTAL_TASKS),
          AsyncStorage.getItem("@mythic_path_counts"),
        ]);
        if (u) setUsername(u);
        if (k) setKarma(JSON.parse(k));
        if (p) setPuna(JSON.parse(p));
        if (t) setTasks(JSON.parse(t));
        if (s) setStreak(JSON.parse(s));
        if (d) setLastDate(d);
        if (ql) setQuestLog(JSON.parse(ql));
        if (a) setAchievements(JSON.parse(a));
        if (b) setBoss(JSON.parse(b));
        if (tt) setTotalTasks(JSON.parse(tt));
        if (pc) setPathCounts(JSON.parse(pc));
      } catch (e) {}
    };
    load();
  }, []);

  // DATA SAVING
  useEffect(() => {
    if (!username) return;
    const save = async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.KARMA, JSON.stringify(karma));
      await AsyncStorage.setItem(STORAGE_KEYS.PUNA, JSON.stringify(puna));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
      await AsyncStorage.setItem(
        STORAGE_KEYS.QUEST_LOG,
        JSON.stringify(questLog),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACHIEVEMENTS,
        JSON.stringify(achievements),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOTAL_TASKS,
        JSON.stringify(totalTasks),
      );
      await AsyncStorage.setItem(
        "@mythic_path_counts",
        JSON.stringify(pathCounts),
      );
      if (boss)
        await AsyncStorage.setItem(STORAGE_KEYS.BOSS, JSON.stringify(boss));
      if (lastDate)
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, lastDate);
    };
    save();
  }, [
    karma,
    puna,
    tasks,
    streak,
    lastDate,
    questLog,
    achievements,
    boss,
    totalTasks,
    pathCounts,
  ]);

  // BOSS MANAGEMENT
  useEffect(() => {
    const initBoss = () => {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const weekStart = monday.toISOString().split("T")[0];

      if (!boss || boss.weekStart !== weekStart) {
        const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        const bossTemplate = BOSS_ROSTER[weekNum % BOSS_ROSTER.length];
        setBoss({
          ...bossTemplate,
          currentHp: bossTemplate.maxHp,
          weekStart,
          defeated: false,
        });
      }
    };
    if (username) initBoss();
  }, [username]);

  // LOGIC
  const handleLogin = async () => {
    if (tempName.trim().length < 2) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, tempName);
    setUsername(tempName);
  };

  const updateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    if (lastDate === yStr) {
      setStreak((s) => s + 1);
    } else {
      setStreak(1);
    }
    setLastDate(today);
  };

  const checkAchievements = (
    newTotalTasks: number,
    newPathCounts: any,
    newKarma: number,
    newLevel: number,
    newStreak: number,
  ) => {
    const toCheck = [...achievements];
    let unlocked = false;

    toCheck.forEach((ach) => {
      if (ach.unlocked) return;

      let shouldUnlock = false;
      switch (ach.requirement.type) {
        case "tasks_completed":
          shouldUnlock = newTotalTasks >= ach.requirement.value;
          break;
        case "streak_days":
          shouldUnlock = newStreak >= ach.requirement.value;
          break;
        case "level_reached":
          shouldUnlock = newLevel >= ach.requirement.value;
          break;
        case "karma_earned":
          shouldUnlock = newKarma >= ach.requirement.value;
          break;
        case "path_tasks":
          if (ach.requirement.path) {
            shouldUnlock =
              newPathCounts[ach.requirement.path] >= ach.requirement.value;
          }
          break;
      }

      if (shouldUnlock) {
        ach.unlocked = true;
        ach.unlockedAt = Date.now();
        setNewAchievement(ach);
        unlocked = true;
        setTimeout(() => setNewAchievement(null), 3000);
      }
    });

    if (unlocked) {
      setAchievements([...toCheck]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const addCustomTask = () => {
    if (!inputVal.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const t: Task = {
      id: Date.now().toString(),
      title: inputVal,
      xp: 0,
      type: selectedType,
      difficulty: "custom",
      isPreset: false,
    };
    setTasks([t, ...tasks]);
    setInputVal("");
  };

  const canAddQuest = (
    quest: PresetQuest,
  ): { allowed: boolean; reason?: string; timeLeft?: number } => {
    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const log = questLog[quest.id];

    if (!log) return { allowed: true };
    if (log.lastDate !== today) return { allowed: true };
    if (log.countToday >= quest.dailyCap) {
      return {
        allowed: false,
        reason: `Daily limit (${quest.dailyCap}) reached`,
      };
    }

    const timeSinceLastMs = now - log.lastCompleted;
    const cooldownMs = quest.cooldownMin * 60 * 1000;

    if (timeSinceLastMs < cooldownMs) {
      const timeLeftMs = cooldownMs - timeSinceLastMs;
      const minutesLeft = Math.ceil(timeLeftMs / 60000);
      return { allowed: false, reason: `Cooldown`, timeLeft: minutesLeft };
    }

    return { allowed: true };
  };

  const addPresetQuest = (quest: PresetQuest) => {
    const check = canAddQuest(quest);

    if (!check.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t: Task = {
      id: Date.now().toString(),
      title: quest.title,
      xp: quest.xp,
      type: selectedType,
      difficulty: quest.diff,
      isPreset: true,
    };
    setTasks([t, ...tasks]);

    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const currentLog = questLog[quest.id];

    setQuestLog({
      ...questLog,
      [quest.id]: {
        lastCompleted: now,
        countToday:
          (currentLog?.lastDate === today ? currentLog.countToday : 0) + 1,
        lastDate: today,
      },
    });

    setShowLibrary(false);
  };

  const completeTask = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const newKarma = karma + task.xp;
    const oldLevel = Math.floor(Math.sqrt(karma / 100)) + 1;
    const newLevel = Math.floor(Math.sqrt(newKarma / 100)) + 1;

    if (newLevel > oldLevel) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setKarma(newKarma);
    setPuna((p) => p + task.xp / 10);

    const newTotalTasks = totalTasks + 1;
    setTotalTasks(newTotalTasks);

    const newPathCounts = { ...pathCounts };
    newPathCounts[task.type]++;
    setPathCounts(newPathCounts);

    updateStreak();

    // Boss damage
    if (boss && !boss.defeated && task.xp > 0) {
      const newHp = Math.max(0, boss.currentHp - boss.damagePerTask);
      if (newHp === 0 && !boss.defeated) {
        setBoss({ ...boss, currentHp: 0, defeated: true });
        setPuna((p) => p + boss.lootPunya);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setBoss({ ...boss, currentHp: newHp });
      }
    }

    checkAchievements(newTotalTasks, newPathCounts, newKarma, newLevel, streak);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const getCatColor = (t: TaskType) =>
    CATEGORIES.find((c) => c.id === t)?.color || "#fff";

  // --- RENDERING ---

  // LOGIN
  if (!username) {
    return (
      <View style={styles.container}>
        <AkashBackground />
        <Starfield />
        <Animated.View
          entering={FadeInDown.delay(300).duration(1000)}
          style={styles.loginContent}
        >
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

      <SafeAreaView style={{ flex: 1, paddingTop: 10 }}>
        <Animated.FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 5,
          }}
          ListHeaderComponent={
            <Animated.View
              style={[
                styles.headerContainer,
                headerStyle,
                { marginBottom: 10 },
              ]}
            >
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.divineTitle}>LILA</Text>
                  <Text style={styles.divineSub}>
                    PRANAM, {username.toUpperCase()}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setShowAchievements(true)}
                    style={styles.iconBtn}
                  >
                    <MaterialCommunityIcons
                      name="trophy"
                      size={20}
                      color="#d4af37"
                    />
                  </TouchableOpacity>
                  <View style={styles.streakBadge}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={18}
                      color="#ff5e62"
                    />
                    <Text style={styles.streakText}>{streak}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowWisdom(true)}
                    style={styles.wisdomIcon}
                  >
                    <MaterialCommunityIcons
                      name="script-text-outline"
                      size={20}
                      color="#ffde59"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.heroCard}>
                <View style={styles.statRow}>
                  <View>
                    <Text style={styles.statLabel}>KARMA</Text>
                    <Text style={styles.statVal}>
                      {Math.floor(karma)}{" "}
                      <Text style={{ fontSize: 14, color: "#888" }}>
                        / {Math.floor(nextLevelKarma)}
                      </Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.statLabel}>LEVEL</Text>
                    <Text style={[styles.statVal, { color: "#ffde59" }]}>
                      {level}
                    </Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <LinearGradient
                    colors={["#ff9933", "#ff5e62"]}
                    style={[styles.fill, { width: `${progressPercent}%` }]}
                  />
                </View>
              </View>

              {boss && !boss.defeated && (
                <TouchableOpacity
                  onPress={() => setShowBoss(true)}
                  style={styles.bossPill}
                >
                  <MaterialCommunityIcons
                    name="skull"
                    size={18}
                    color="#ff5e62"
                  />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.bossPillTitle}>{boss.name}</Text>
                    <Text style={styles.bossPillMeta}>
                      {boss.currentHp} / {boss.maxHp} HP
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <Text style={styles.sectionTitle}>YOUR DHARMA</Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => {
            const color = getCatColor(item.type);
            return (
              <Animated.View
                entering={SlideInDown.delay(index * 100).springify()}
                layout={Layout.springify()}
                style={[styles.taskCard, { borderLeftColor: color }]}
              >
                <TouchableOpacity
                  style={styles.taskContent}
                  onPress={() => completeTask(item)}
                >
                  <View style={[styles.checkbox, { borderColor: color }]}>
                    {item.xp > 0 && (
                      <View
                        style={{
                          backgroundColor: color,
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <View
                      style={{ flexDirection: "row", gap: 6, marginTop: 4 }}
                    >
                      <Text style={[styles.taskMeta, { color: color }]}>
                        {item.type.toUpperCase()}
                      </Text>
                      <Text style={styles.taskMeta}>•</Text>
                      {item.xp > 0 ? (
                        <Text style={[styles.taskMeta, { color: "#fff" }]}>
                          +{item.xp} XP
                        </Text>
                      ) : (
                        <Text style={[styles.taskMeta, { color: "#666" }]}>
                          0 XP (CUSTOM)
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />

        {/* INPUT AREA */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputWrapper}
        >
          <View style={styles.chipsRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedType(cat.id as any);
                }}
                style={[
                  styles.chip,
                  selectedType === cat.id && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedType === cat.id
                      ? { color: "#000" }
                      : { color: "#aaa" },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={[
              styles.glassInput,
              { borderColor: getCatColor(selectedType) },
            ]}
          >
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => setShowLibrary(true)}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={24}
                color="#888"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Manifest a deed..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputVal}
              onChangeText={setInputVal}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={addCustomTask}>
              <Ionicons
                name="arrow-up-circle"
                size={38}
                color={getCatColor(selectedType)}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* ACHIEVEMENT NOTIFICATION */}
        {newAchievement && (
          <Animated.View
            entering={SlideInDown.springify()}
            exiting={FadeOut}
            style={styles.achievementNotif}
          >
            <LinearGradient
              colors={["rgba(212,175,55,0.3)", "rgba(212,175,55,0.1)"]}
              style={styles.achievementNotifBg}
            >
              <MaterialCommunityIcons
                name={newAchievement.icon as any}
                size={32}
                color={newAchievement.color}
              />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.achievementNotifTitle}>
                  Achievement Unlocked!
                </Text>
                <Text style={styles.achievementNotifDesc}>
                  {newAchievement.title}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* MODALS */}
        {showWisdom && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { justifyContent: "center", alignItems: "center", zIndex: 100 },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowWisdom(false)}
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.8)" },
              ]}
            />
            <Animated.View
              entering={ZoomIn}
              exiting={ZoomOut}
              style={styles.wisdomCard}
            >
              <LinearGradient
                colors={["#1a1a1a", "#432e00"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.wisdomHeader}>THE PATHS</Text>
              {CATEGORIES.map((cat) => (
                <View
                  key={cat.id}
                  style={{ flexDirection: "row", marginBottom: 20 }}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={24}
                    color={cat.color}
                  />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={[styles.wisdomLabel, { color: cat.color }]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.wisdomDesc}>{cat.desc}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        )}

        {showLibrary && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 100,
                backgroundColor: "rgba(0,0,0,0.8)",
                justifyContent: "flex-end",
              },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowLibrary(false)}
            />
            <Animated.View
              entering={SlideInUp.springify()}
              style={styles.librarySheet}
            >
              <LinearGradient
                colors={["#1a1a1a", "#2d2d2d"]}
                style={{ flex: 1, borderRadius: 20, padding: 20 }}
              >
                <View style={styles.libHeader}>
                  <Text style={styles.libTitle}>
                    {selectedType.toUpperCase()} ARCHIVES
                  </Text>
                </View>
                <FlatList
                  data={QUEST_DB[selectedType]}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => {
                    const check = canAddQuest(item);
                    const today = new Date().toISOString().split("T")[0];
                    const log = questLog[item.id];
                    const count = log?.lastDate === today ? log.countToday : 0;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.libItem,
                          !check.allowed && { opacity: 0.4 },
                        ]}
                        onPress={() => addPresetQuest(item)}
                        disabled={!check.allowed}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text style={{ color: "#fff", fontSize: 16 }}>
                              {item.title}
                            </Text>
                            {!check.allowed && (
                              <Ionicons
                                name="lock-closed"
                                size={14}
                                color="#ff5e62"
                              />
                            )}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: "#666",
                                fontSize: 10,
                                fontWeight: "bold",
                              }}
                            >
                              {item.diff.toUpperCase()}
                            </Text>
                            <Text style={{ color: "#666", fontSize: 10 }}>
                              •
                            </Text>
                            <Text style={{ color: "#888", fontSize: 10 }}>
                              {count}/{item.dailyCap} today
                            </Text>
                          </View>
                          {!check.allowed && check.reason && (
                            <Text
                              style={{
                                color: "#ff5e62",
                                fontSize: 10,
                                marginTop: 2,
                              }}
                            >
                              {check.reason}
                              {check.timeLeft ? ` (${check.timeLeft}m)` : ""}
                            </Text>
                          )}
                        </View>
                        <View
                          style={{
                            backgroundColor: "#333",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{ color: "#ffde59", fontWeight: "bold" }}
                          >
                            +{item.xp}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {/* ACHIEVEMENTS MODAL */}
        <Modal visible={showAchievements} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SIDDHIS</Text>
                <TouchableOpacity onPress={() => setShowAchievements(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {achievements.map((ach) => (
                  <View
                    key={ach.id}
                    style={[
                      styles.achievementItem,
                      ach.unlocked && { opacity: 1 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={ach.icon as any}
                      size={32}
                      color={ach.unlocked ? ach.color : "#444"}
                    />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text
                        style={[
                          styles.achievementTitle,
                          ach.unlocked && { color: ach.color },
                        ]}
                      >
                        {ach.title}
                      </Text>
                      <Text style={styles.achievementDesc}>
                        {ach.description}
                      </Text>
                    </View>
                    {ach.unlocked && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={ach.color}
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* BOSS MODAL */}
        <Modal visible={showBoss} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ASURA ENCOUNTER</Text>
                <TouchableOpacity onPress={() => setShowBoss(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {boss && (
                <View style={{ alignItems: "center", padding: 20 }}>
                  <MaterialCommunityIcons
                    name="skull"
                    size={80}
                    color="#ff5e62"
                  />
                  <Text style={styles.bossModalName}>{boss.name}</Text>
                  <Text style={styles.bossModalDesc}>{boss.description}</Text>
                  <View style={styles.bossModalHpBar}>
                    <View
                      style={[
                        styles.bossModalHpFill,
                        { width: `${(boss.currentHp / boss.maxHp) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.bossModalHpText}>
                    {boss.currentHp} / {boss.maxHp} HP
                  </Text>
                  <Text style={styles.bossModalInfo}>
                    Complete tasks to deal {boss.damagePerTask} damage each
                  </Text>
                  {boss.defeated && (
                    <View style={styles.bossDefeated}>
                      <Text style={styles.bossDefeatedText}>DEFEATED!</Text>
                      <Text style={styles.bossLootText}>
                        +{boss.lootPunya} Punya Earned
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // LOGIN
  loginContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glowingOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ff9933",
    opacity: 0.2,
    position: "absolute",
    top: "22%",
  },
  loginTitle: {
    fontSize: 60,
    color: "#fff",
    fontWeight: "100",
    letterSpacing: 10,
    fontFamily: Platform.OS === "ios" ? "Didot" : "serif",
  },
  loginSub: {
    fontSize: 12,
    color: "#ffde59",
    letterSpacing: 5,
    marginTop: 10,
    opacity: 0.8,
  },
  loginInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    width: "80%",
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    textAlign: "center",
    marginTop: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  enterBtn: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  enterText: { color: "#000", fontWeight: "bold", letterSpacing: 2 },

  // HEADER
  headerContainer: { marginBottom: 25, paddingHorizontal: 4 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  divineTitle: {
    fontSize: 48,
    color: "#FFD700",
    letterSpacing: 10,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Didot" : "serif",
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  divineSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 4,
    marginTop: 6,
    fontWeight: "bold",
  },
  wisdomIcon: {
    padding: 6,
  },
  iconBtn: {
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  punaText: { color: "#ff9933", fontSize: 10, fontWeight: "bold" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
  },
  streakText: {
    color: "#ff5e62",
    fontWeight: "bold",
    fontSize: 11,
  },

  // BOSS BADGE (compact, secondary)
  bossPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(100, 20, 40, 0.45)",
  },
  bossPillTitle: {
    color: "#ffb3c6",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bossPillMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 2,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: "rgba(26, 35, 50, 0.4)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(79, 172, 254, 0.2)",
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statLabel: {
    color: "#FFD700",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  statVal: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 1,
  },
  track: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginLeft: 5,
    marginBottom: 15,
    textTransform: "uppercase",
  },

  // TASKS
  taskCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  taskContent: { padding: 16, flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  taskTitle: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  taskMeta: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // INPUT
  inputWrapper: { position: "absolute", bottom: 30, left: 20, right: 20 },
  chipsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  chipText: { fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  glassInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  bookBtn: { padding: 10 },
  textInput: {
    flex: 1,
    color: "#fff",
    height: 50,
    paddingHorizontal: 10,
  },
  sendBtn: { padding: 5 },

  // OVERLAYS
  wisdomCard: {
    width: width * 0.85,
    padding: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#5c4000",
    overflow: "hidden",
  },
  wisdomHeader: {
    color: "#ffde59",
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: Platform.OS === "ios" ? "Didot" : "serif",
  },
  wisdomLabel: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  wisdomDesc: { color: "#aaa", fontSize: 12, lineHeight: 16 },

  librarySheet: {
    height: "60%",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  libHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#444" },
  libTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  libItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },

  // ACHIEVEMENT NOTIFICATION
  achievementNotif: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  achievementNotifBg: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#d4af37",
    alignItems: "center",
  },
  achievementNotifTitle: {
    color: "#d4af37",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  achievementNotifDesc: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },

  // MODALS
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    opacity: 0.4,
  },
  achievementTitle: { color: "#888", fontSize: 14, fontWeight: "bold" },
  achievementDesc: { color: "#666", fontSize: 12, marginTop: 2 },

  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
  },
  rewardTitle: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  rewardCost: { color: "#ff9933", fontSize: 12, marginTop: 2 },
  buyBtn: {
    backgroundColor: "#4facfe",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyText: { color: "#000", fontWeight: "bold", fontSize: 12 },
  addRewardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#4facfe",
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addRewardText: {
    color: "#4facfe",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },

  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "bold" },

  bossModalName: {
    color: "#ff5e62",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    letterSpacing: 2,
  },
  bossModalDesc: { color: "#aaa", fontSize: 14, marginTop: 5 },
  bossModalHpBar: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 6,
    marginTop: 20,
  },
  bossModalHpFill: {
    height: "100%",
    backgroundColor: "#ff5e62",
    borderRadius: 6,
  },
  bossModalHpText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "bold",
  },
  bossModalInfo: {
    color: "#888",
    fontSize: 12,
    marginTop: 20,
    textAlign: "center",
  },
  bossDefeated: { marginTop: 30, alignItems: "center" },
  bossDefeatedText: {
    color: "#00f260",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  bossLootText: { color: "#ffde59", fontSize: 14, marginTop: 5 },
});
