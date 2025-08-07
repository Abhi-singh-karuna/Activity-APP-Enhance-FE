import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Modal,
  Alert,
  Animated,
  Vibration,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { Activity, Category } from "../../types";
import AddActivityModal from "../../components/AddActivityModal";
import StyledText from "../../components/StyledText";
import { useAppContext } from "../../context/AppContext";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enhanced activity type with comprehensive timer and status properties
interface EnhancedActivity extends Activity {
  isRunning?: boolean;
  currentTimer?: string;
  elapsedSeconds?: number;
  isFuture?: boolean;
  remainingSeconds?: number;
  isCompleted?: boolean;
  isPaused?: boolean;
  totalTimeSpent?: number;
  lastStartTime?: number;
  completionPercentage?: number;
  streak?: number;
  lastCompletedDate?: string;
}

// Animation configuration
const AnimationConfig = {
  duration: 300,
  useNativeDriver: true,
  tension: 100,
  friction: 8,
};

// Theme colors matching auth screens
const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  cardSecondary: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  textMuted: "#666666",
  border: "rgba(255, 255, 255, 0.1)",
  overlay: "rgba(0, 0, 0, 0.8)",
};

// Card background colors based on activity color and state
const getCardBackground = (activity: EnhancedActivity): [string, string] => {
  if (activity.isCompleted) {
    return ["#2D5A27", "#1A3318"]; // Green gradient for completed
  }

  if (activity.isRunning) {
    // Use activity's own color when running with higher opacity
    const baseColor = activity.color || "#00E5FF";
    // Create a more vibrant gradient from the activity color
    return [baseColor + "40", baseColor + "20"]; // 40% and 20% opacity
  } else {
    // Use activity color with lower opacity when inactive
    const baseColor = activity.color || "#00E5FF";
    return [baseColor + "15", baseColor + "08"]; // 15% and 8% opacity
  }
};

// Gradient configurations matching auth screens
const GradientConfigs = {
  running: ["#00E5FF", "#9C6CDA"] as [string, string],
  paused: ["#FF9500", "#FF4757"] as [string, string],
  completed: ["#4ECDC4", "#00E5FF"] as [string, string],
  future: ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"] as [
    string,
    string
  ],
  default: ["#1E1E1E", "#2C2C2E"] as [string, string],
  danger: ["#FF4757", "#FF6B9D"] as [string, string],
  primary: ["#00E5FF", "#9C6CDA"] as [string, string],
  stats: ["#121212", "#1E1E1E"] as [string, string],
  header: ["#000000", "#121212"] as [string, string],
};

const ActivityScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // State management
  const [activities, setActivities] = useState<EnhancedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<EnhancedActivity | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activityToDelete, setActivityToDelete] =
    useState<EnhancedActivity | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const [deleteReady, setDeleteReady] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<
    "recent" | "priority" | "duration" | "completion"
  >("recent");

  // Enhanced animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(0)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.3)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerGlowAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.95)).current;
  const fabScaleAnim = useRef(new Animated.Value(0)).current;
  const statsSlideAnim = useRef(new Animated.Value(-50)).current;

  const deleteMode = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const formatDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  }, []);

  const timeToSeconds = useCallback((time: string): number => {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }, []);

  const formatTimeHHMMSS = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  }, []);

  const isActivityInFuture = useCallback(
    (activity: EnhancedActivity): boolean => {
      if (activity.isFuture === true) return true;
      const today = new Date();
      const startDate = new Date(activity.startDate.replace(/\//g, "-"));
      return startDate > today;
    },
    []
  );

  // Enhanced initialization animations
  const initializeAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(headerScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(statsSlideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(fabScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation for active timers
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(timerGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Load activities with sample data
  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      // Sample activities with different states
      const sampleActivities: EnhancedActivity[] = [
        {
          id: "1",
          title: "Morning Workout",
          category: "Workout" as Category,
          startDate: "2025/08/02",
          endDate: "2025/08/02",
          duration: "01:00:00",
          color: "#00E5FF",
          priority: 1,
          isRunning: true,
          currentTimer: "00:45:30",
          remainingSeconds: 100,
          completionPercentage: 25,
          elapsedSeconds: 870,
          totalTimeSpent: 870,
          lastStartTime: Date.now() - 870000,
          streak: 1,
        },
        {
          id: "2",
          title: "Team Meeting",
          category: "Work" as Category,
          startDate: "2025/08/02",
          endDate: "2025/08/02",
          duration: "00:30:00",
          color: "#9C6CDA",
          priority: 2,
          isRunning: true,
          currentTimer: "00:25:00",
          remainingSeconds: 1500,
          completionPercentage: 17,
          elapsedSeconds: 300,
          totalTimeSpent: 300,
          streak: 12,
        },
        {
          id: "3",
          title: "Read Book",
          category: "Personal" as Category,
          startDate: "2025/08/01",
          endDate: "2025/08/01",
          duration: "00:45:00",
          color: "#4ECDC4",
          priority: 3,
          isCompleted: true,
          currentTimer: "00:00:00",
          remainingSeconds: 0,
          completionPercentage: 100,
          elapsedSeconds: 2700,
          totalTimeSpent: 2700,
          streak: 1,
          lastCompletedDate: "2025/08/01",
        },
        {
          id: "4",
          title: "Learn React Native",
          category: "Personal" as Category,
          startDate: "2025/08/02",
          endDate: "2025/08/02",
          duration: "02:00:00",
          color: "#FF9500",
          priority: 2,
          isPaused: true,
          isRunning: false,
          currentTimer: "01:30:45",
          remainingSeconds: 5445,
          completionPercentage: 24,
          elapsedSeconds: 1755,
          totalTimeSpent: 1755,
          streak: 3,
        },
        {
          id: "9",
          title: "Daily Meditation",
          category: "Personal" as Category,
          startDate: "2025/08/01",
          endDate: "2025/08/01",
          duration: "00:20:00",
          color: "#9C6CDA",
          priority: 1,
          isCompleted: true,
          currentTimer: "00:00:00",
          remainingSeconds: 0,
          completionPercentage: 100,
          elapsedSeconds: 1200,
          totalTimeSpent: 1200,
          streak: 5,
          lastCompletedDate: "2025/08/01",
        },
        {
          id: "5",
          title: "Gym Session",
          category: "Workout" as Category,
          startDate: "2025/08/03",
          endDate: "2025/08/03",
          duration: "01:30:00",
          color: "#FF4757",
          priority: 1,
          isFuture: true,
          currentTimer: "01:30:00",
          remainingSeconds: 5400,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 8,
        },
        {
          id: "6",
          title: "Project Planning",
          category: "Work" as Category,
          startDate: "2025/08/08",
          endDate: "2025/08/09",
          duration: "01:15:00",
          color: "#00E5FF",
          priority: 1,
          isRunning: false,
          currentTimer: "01:15:00",
          remainingSeconds: 4500,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 0,
        },
        {
          id: "7",
          title: "Meditation",
          category: "Personal" as Category,
          startDate: "2025/08/02",
          endDate: "2025/08/02",
          duration: "00:20:00",
          color: "#9C6CDA",
          priority: 3,
          isRunning: false,
          currentTimer: "00:20:00",
          remainingSeconds: 1200,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 3,
        },
        {
          id: "8",
          title: "Code Review",
          category: "Work" as Category,
          startDate: "2025/08/02",
          endDate: "2025/08/02",
          duration: "00:45:00",
          color: "#4ECDC4",
          priority: 2,
          isRunning: false,
          currentTimer: "00:45:00",
          remainingSeconds: 2700,
          completionPercentage: 10,
          elapsedSeconds: 10,
          totalTimeSpent: 10,
          streak: 9,
        },
      ];

      setActivities(sampleActivities);
    } catch (error) {
      console.error("Failed to load activities:", error);
      Alert.alert("Error", "Failed to load activities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced refresh functionality
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  }, [loadActivities]);

  // Focus effect for screen refresh
  useFocusEffect(
    useCallback(() => {
      loadActivities();
      initializeAnimations();
    }, [loadActivities, initializeAnimations])
  );

  // Enhanced pulse animation for running activities
  useEffect(() => {
    const createPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (activities.some((a) => a.isRunning)) {
          createPulseAnimation();
        } else {
          pulseAnim.setValue(1);
        }
      });
    };

    if (activities.some((a) => a.isRunning)) {
      createPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.setValue(1);
    };
  }, [activities, pulseAnim]);

  // Enhanced timer functionality
  const toggleTimer = useCallback(
    async (id: string) => {
      try {
        const activity = activities.find((a) => a.id === id);
        if (!activity) return;

        const newIsRunning = !activity.isRunning;

        setActivities((prevActivities) =>
          prevActivities.map((a) => {
            if (a.id === id) {
              return {
                ...a,
                isRunning: newIsRunning,
                isPaused: false,
                lastStartTime: newIsRunning ? Date.now() : undefined,
              };
            }
            return a;
          })
        );

        // Enhanced haptic feedback
        if (Platform.OS === "ios" || Platform.OS === "android") {
          Vibration.vibrate(newIsRunning ? [100] : [50, 50, 50]);
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (error) {
        console.error("Failed to toggle timer:", error);
        Alert.alert("Error", "Failed to update timer. Please try again.");
      }
    },
    [activities]
  );

  // Enhanced timer update logic
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.isRunning && !activity.isPaused) {
            const remainingSeconds = Math.max(
              0,
              (activity.remainingSeconds || 0) - 1
            );
            const isCompleted = remainingSeconds === 0;
            const completionPercentage = activity.remainingSeconds
              ? ((timeToSeconds(activity.duration || "00:00:00") -
                  remainingSeconds) /
                  timeToSeconds(activity.duration || "00:00:00")) *
                100
              : 0;

            if (isCompleted && activity.isRunning) {
              // Enhanced completion feedback
              if (Platform.OS === "ios" || Platform.OS === "android") {
                Vibration.vibrate([200, 100, 200, 100, 200]);
              }
            }

            return {
              ...activity,
              remainingSeconds,
              currentTimer: formatTimeHHMMSS(remainingSeconds),
              isRunning: isCompleted ? false : activity.isRunning,
              isCompleted: isCompleted || activity.isCompleted,
              completionPercentage: Math.round(completionPercentage),
              lastCompletedDate: isCompleted
                ? formatDate(new Date())
                : activity.lastCompletedDate,
            };
          }
          return activity;
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [formatTimeHHMMSS, formatDate, timeToSeconds]);

  // Enhanced interaction handlers
  const resetDeleteMode = useCallback(() => {
    deleteMode.current = false;
    setLongPressedId(null);
    setDeleteReady(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(deleteScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLongPress = useCallback((activity: EnhancedActivity) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Vibration.vibrate(150);
    }

    deleteMode.current = true;
    setDeleteReady(true);
    setLongPressedId(activity.id);

    Animated.parallel([
      Animated.spring(deleteScaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Activity management functions
  const handleDeleteActivity = useCallback(async () => {
    if (!activityToDelete) return;

    try {
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== activityToDelete.id)
      );

      closeDeleteModal();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error("Failed to delete activity:", error);
      Alert.alert("Error", "Failed to delete activity. Please try again.");
    }
  }, [activityToDelete]);

  const handleAddActivity = useCallback(
    async (newActivity: Partial<Activity>) => {
      try {
        const duration = newActivity.duration || "00:00:00";
        const remainingSeconds = timeToSeconds(duration);

        const activity: EnhancedActivity = {
          ...newActivity,
          id: Date.now().toString(),
          isRunning: false,
          currentTimer: duration,
          remainingSeconds: remainingSeconds,
          elapsedSeconds: 0,
          isCompleted: false,
          isPaused: false,
          totalTimeSpent: 0,
          completionPercentage: 0,
          streak: 0,
          duration: duration,
          priority: newActivity.priority || Math.floor(Math.random() * 100) + 1,
        } as EnhancedActivity;

        setActivities((prev) => [...prev, activity]);
        setModalVisible(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (error) {
        console.error("Failed to add activity:", error);
        Alert.alert("Error", "Failed to add activity. Please try again.");
      }
    },
    [timeToSeconds]
  );

  // Modal management
  const closeDeleteModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDeleteModalVisible(false);
      setActivityToDelete(null);
    });
  }, []);

  const showDeleteConfirmation = useCallback((activity: EnhancedActivity) => {
    setActivityToDelete(activity);
    setDeleteModalVisible(true);

    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Filtered and sorted activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities;

    if (filterCategory) {
      filtered = filtered.filter(
        (activity) => activity.category === filterCategory
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (a.priority || 0) - (b.priority || 0);
        case "duration":
          return (
            timeToSeconds(b.duration || "00:00:00") -
            timeToSeconds(a.duration || "00:00:00")
          );
        case "completion":
          return (b.completionPercentage || 0) - (a.completionPercentage || 0);
        default:
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
      }
    });
  }, [activities, filterCategory, sortBy, timeToSeconds]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalActivities = activities.length;
    const runningActivities = activities.filter((a) => a.isRunning).length;
    const completedActivities = activities.filter((a) => a.isCompleted).length;
    const totalTimeSpent = activities.reduce(
      (total, activity) => total + (activity.totalTimeSpent || 0),
      0
    );

    return {
      total: totalActivities,
      running: runningActivities,
      completed: completedActivities,
      timeSpent: formatTimeHHMMSS(totalTimeSpent),
      completionRate:
        totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0,
    };
  }, [activities, formatTimeHHMMSS]);

  // Helper function to render streak stars
  const renderStreakStars = useCallback(
    (streak: number, isFuture: boolean = false, isRunning: boolean = false) => {
      const maxStars = 7;
      const starsToShow = Math.min(streak, maxStars);
      const stars = [];

      // Different colors for different activity states
      let filledColor, emptyColor, overflowColor;

      if (isFuture) {
        filledColor = "#666666"; // Gray for future
        emptyColor = "rgba(102, 102, 102, 0.3)";
        overflowColor = "#666666";
      } else if (isRunning) {
        filledColor = "#00E5FF"; // Cyan for running
        emptyColor = "rgba(0, 229, 255, 0.3)";
        overflowColor = "#00E5FF";
      } else {
        filledColor = "#FFD700"; // Gold for completed
        emptyColor = "rgba(255, 215, 0, 0.3)";
        overflowColor = "#FFD700";
      }

      for (let i = 0; i < maxStars; i++) {
        const isFilled = i < starsToShow;
        const isSpecial = i === 6 && streak > maxStars; // Special star for overflow

        stars.push(
          <View key={i} style={styles.streakStarContainer}>
            <Icon
              name={isFilled ? "star" : "star-outline"}
              size={scale(12)}
              color={
                isSpecial ? overflowColor : isFilled ? filledColor : emptyColor
              }
            />
            {isSpecial && (
              <Text
                style={[styles.streakOverflowText, { color: overflowColor }]}
              >
                +{streak - maxStars}
              </Text>
            )}
          </View>
        );
      }

      return <>{stars}</>;
    },
    []
  );

  // Enhanced activity item renderer with optimized layout
  const renderActivityItem = useCallback(
    ({ item, index }: { item: EnhancedActivity; index: number }) => {
      const isFuture = isActivityInFuture(item);
      const isLongPressed = longPressedId === item.id;
      const showDeleteUI = isLongPressed && deleteReady;
      const isCompleted = item.isCompleted;

      return (
        <Animated.View
          style={[
            styles.activityItemContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: isLongPressed ? scaleAnim : 1 },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.activityItem}
            onPress={() => {
              if (deleteMode.current && isLongPressed) {
                resetDeleteMode();
                return;
              }

              navigation.navigate("ActivityDetail", {
                title: item.title,
                category: item.category,
                isPersonal: item.category === "Personal",
              });
            }}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={300}
            activeOpacity={0.85}
          >
            {showDeleteUI ? (
              <LinearGradient
                colors={GradientConfigs.danger}
                style={styles.deleteCardContent}
              >
                <Animated.View
                  style={[
                    styles.deleteIconContainer,
                    {
                      transform: [{ scale: deleteScaleAnim }],
                      opacity: deleteOpacityAnim,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => showDeleteConfirmation(item)}
                  >
                    <Icon name="trash-outline" size={scale(36)} color="#fff" />
                    <Text style={styles.deleteCardText}>Delete activity</Text>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={styles.cancelDeleteButton}
                  onPress={resetDeleteMode}
                >
                  <Icon name="close" size={scale(20)} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={getCardBackground(item)}
                style={styles.cardGradient}
              >
                <View style={styles.cardContainer}>
                  {/* Header Row: Title, Category, and Control Button */}
                  <View style={styles.cardHeader}>
                    <View style={styles.titleSection}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isFuture && (
                        <Text style={styles.scheduledText}>Scheduled</Text>
                      )}
                    </View>

                    <View style={styles.headerRight}>
                      <View
                        style={[
                          styles.categoryBadge,
                          isCompleted && styles.completedCategoryBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            isCompleted && styles.completedCategoryText,
                          ]}
                        >
                          {item.category.toUpperCase()}
                        </Text>
                      </View>

                      {/* Control Button */}
                      <View style={styles.controlSection}>
                        {!isFuture && !isCompleted && (
                          <TouchableOpacity
                            style={[
                              styles.controlButton,
                              item.isRunning && styles.activeControlButton,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleTimer(item.id);
                            }}
                            activeOpacity={0.7}
                          >
                            <Animated.View
                              style={{
                                transform: [
                                  { scale: item.isRunning ? pulseAnim : 1 },
                                ],
                              }}
                            >
                              <Icon
                                name={item.isRunning ? "pause" : "play"}
                                size={scale(16)}
                                color="#000000"
                              />
                            </Animated.View>
                          </TouchableOpacity>
                        )}

                        {isCompleted && (
                          <View style={styles.completedButton}>
                            <Icon
                              name="checkmark-circle"
                              size={scale(24)}
                              color="#4ECDC4"
                            />
                          </View>
                        )}

                        {isFuture && (
                          <View style={styles.futureButton}>
                            <Icon
                              name="time-outline"
                              size={scale(20)}
                              color="#666666"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Main Content Row: Timer/Status and Duration */}
                  <View style={styles.cardMainContent}>
                    <View style={styles.leftContent}>
                      {!isFuture && !isCompleted && (
                        <View style={styles.timerSection}>
                          <Text style={styles.timerValue}>
                            {item.currentTimer}
                          </Text>
                          <Text style={styles.timerLabel}>remaining</Text>
                        </View>
                      )}

                      {isCompleted && (
                        <View style={styles.completedSection}>
                          <View style={styles.congratsRow}>
                            <Icon
                              name="trophy"
                              size={scale(14)}
                              color="#4ECDC4"
                            />
                            <Text style={styles.congratsText}>Completed!</Text>
                          </View>
                          <View style={styles.streakContainer}>
                            <Text style={styles.streakLabel}>Streak</Text>
                            <View style={styles.streakStarsRow}>
                              {renderStreakStars(
                                item.streak || 0,
                                false,
                                false
                              )}
                            </View>
                          </View>
                        </View>
                      )}

                      {isFuture && (
                        <View style={styles.futureSection}>
                          <Text style={styles.futureLabel}>Starts in</Text>
                          <Text style={styles.futureDate}>
                            {item.startDate}
                          </Text>
                          {item.streak && item.streak > 0 && (
                            <View style={styles.futureStreakContainer}>
                              <Text style={styles.futureStreakLabel}>
                                Previous streak
                              </Text>
                              <View style={styles.futureStreakStarsRow}>
                                {renderStreakStars(item.streak, true, false)}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.rightContent}>
                      <Text style={styles.durationText}>{item.duration}</Text>
                      {!isFuture &&
                        !isCompleted &&
                        item.streak &&
                        item.streak > 0 && (
                          <View style={styles.runningStreakContainer}>
                            <Text style={styles.runningStreakLabel}>
                              Streak
                            </Text>
                            <View style={styles.runningStreakStarsRow}>
                              {renderStreakStars(item.streak, false, true)}
                            </View>
                          </View>
                        )}
                    </View>
                  </View>

                  {/* Bottom Row: Progress Bar and Dates */}
                  <View style={styles.cardFooter}>
                    <View style={styles.progressSection}>
                      {!isFuture &&
                        item.completionPercentage !== undefined &&
                        item.completionPercentage > 0 && (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${item.completionPercentage}%`,
                                    backgroundColor: isCompleted
                                      ? "#4ECDC4"
                                      : item.isRunning
                                      ? "#00E5FF"
                                      : "#FF9500",
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.progressPercentage}>
                              {item.completionPercentage}%
                            </Text>
                          </View>
                        )}
                    </View>

                    <View style={styles.dateSection}>
                      <Text style={styles.dateText}>{item.startDate}</Text>
                      {item.startDate !== item.endDate && (
                        <Text style={styles.dateText}>→ {item.endDate}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [
      isActivityInFuture,
      longPressedId,
      deleteReady,
      fadeAnim,
      slideAnim,
      scaleAnim,
      resetDeleteMode,
      navigation,
      handleLongPress,
      showDeleteConfirmation,
      toggleTimer,
      pulseAnim,
    ]
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => deleteMode.current && resetDeleteMode()}
    >
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={ThemeColors.background}
        />

        {/* Background */}
        <View style={styles.backgroundContainer}>
          {[...Array(12)].map((_, index) => (
            <Animated.View
              key={`bg-element-${index}`}
              style={[
                styles.backgroundElement,
                {
                  left: `${5 + (index % 6) * 15}%`,
                  top: `${5 + Math.floor(index / 6) * 30}%`,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.03],
                  }),
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#6C5CE7", "#A29BFE"]}
                style={styles.backgroundElementGradient}
              />
            </Animated.View>
          ))}
        </View>

        {/* Header Section */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: headerScaleAnim }],
            },
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Activity Hub</Text>
            <Text style={styles.subtitle}>Track & Manage Your Activities</Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate("Task")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  "rgba(156, 108, 218, 0.2)",
                  "rgba(156, 108, 218, 0.1)",
                ]}
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="checkbox-outline"
                  size={scale(14)}
                  color="#9C6CDA"
                />
                <Text style={styles.headerButtonText}>Tasks</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate("Stats", {})}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(78, 205, 196, 0.2)", "rgba(78, 205, 196, 0.1)"]}
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="analytics-outline"
                  size={scale(14)}
                  color="#4ECDC4"
                />
                <Text style={styles.headerButtonText}>Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate("Settings")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(0, 229, 255, 0.2)", "rgba(0, 229, 255, 0.1)"]}
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="settings-outline"
                  size={scale(14)}
                  color="#00E5FF"
                />
                <Text style={styles.headerButtonText}>Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Compact Analytics Section */}
        <Animated.View
          style={[
            styles.compactAnalyticsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: statsSlideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.8)", "rgba(44, 44, 46, 0.6)"]}
            style={styles.compactAnalyticsCard}
          >
            <View style={styles.compactStatsRow}>
              {/* Total Activities */}
              <View style={styles.compactStatItem}>
                <View
                  style={[
                    styles.compactStatIcon,
                    { backgroundColor: "rgba(176, 176, 176, 0.2)" },
                  ]}
                >
                  <Icon name="grid-outline" size={scale(14)} color="#B0B0B0" />
                </View>
                <Text style={styles.compactStatNumber}>{stats.total}</Text>
                <Text style={styles.compactStatLabel}>Total</Text>
              </View>

              {/* Active */}
              <View style={styles.compactStatItem}>
                <View
                  style={[
                    styles.compactStatIcon,
                    { backgroundColor: "rgba(0, 229, 255, 0.2)" },
                  ]}
                >
                  <Icon name="play-circle" size={scale(14)} color="#00E5FF" />
                </View>
                <Text style={[styles.compactStatNumber, { color: "#00E5FF" }]}>
                  {stats.running}
                </Text>
                <Text style={[styles.compactStatLabel, { color: "#00E5FF" }]}>
                  Active
                </Text>
              </View>

              {/* Completed */}
              <View style={styles.compactStatItem}>
                <View
                  style={[
                    styles.compactStatIcon,
                    { backgroundColor: "rgba(78, 205, 196, 0.2)" },
                  ]}
                >
                  <Icon
                    name="checkmark-circle"
                    size={scale(14)}
                    color="#4ECDC4"
                  />
                </View>
                <Text style={[styles.compactStatNumber, { color: "#4ECDC4" }]}>
                  {stats.completed}
                </Text>
                <Text style={[styles.compactStatLabel, { color: "#4ECDC4" }]}>
                  Done
                </Text>
              </View>

              {/* Success Rate */}
              <View style={styles.compactStatItem}>
                <View
                  style={[
                    styles.compactStatIcon,
                    { backgroundColor: "rgba(156, 108, 218, 0.2)" },
                  ]}
                >
                  <Icon name="trending-up" size={scale(14)} color="#9C6CDA" />
                </View>
                <Text style={[styles.compactStatNumber, { color: "#9C6CDA" }]}>
                  {stats.completionRate}%
                </Text>
                <Text style={[styles.compactStatLabel, { color: "#9C6CDA" }]}>
                  Success
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Activities List */}
        <FlatList
          data={filteredAndSortedActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.activityList,
            { paddingTop: scale(8), paddingBottom: scale(100) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={ThemeColors.primary}
              colors={[ThemeColors.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["#1A1A1A", "#2A2A2A"]}
                style={styles.emptyStateGradient}
              >
                <Icon name="time-outline" size={scale(64)} color="#00E5FF" />
                <Text style={styles.emptyStateTitle}>No activities yet</Text>
                <Text style={styles.emptyStateText}>
                  Start tracking your productivity by creating your first
                  activity
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setModalVisible(true)}
                >
                  <LinearGradient
                    colors={GradientConfigs.primary}
                    style={styles.emptyStateButtonGradient}
                  >
                    <Icon name="add" size={scale(18)} color="#FFFFFF" />
                    <Text style={styles.emptyStateButtonText}>
                      Create Activity
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        />

        {/* Floating Action Button */}
        <Animated.View
          style={[
            styles.fabContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: fabScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
          >
            {/* Glow Effect */}
            <Animated.View
              style={[
                styles.fabGlow,
                {
                  opacity: timerGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.7],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(0, 229, 255, 0.4)", "rgba(156, 108, 218, 0.4)"]}
                style={styles.glowGradient}
              />
            </Animated.View>

            <LinearGradient
              colors={["#00E5FF", "#9C6CDA", "#4ECDC4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05],
                      }),
                    },
                  ],
                }}
              >
                <Icon
                  name="add"
                  size={scale(28)}
                  color="#FFFFFF"
                  style={styles.fabIcon}
                />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Add Activity Modal */}
        <AddActivityModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddActivity}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.deleteModalContainer,
                {
                  transform: [{ scale: modalScaleAnim }],
                  opacity: modalOpacityAnim,
                },
              ]}
            >
              <LinearGradient
                colors={["#1A1A1A", "#2A2A2A"]}
                style={styles.deleteModalGradient}
              >
                <Icon
                  name="alert-circle-outline"
                  size={scale(48)}
                  color={ThemeColors.danger}
                />
                <Text style={styles.deleteModalTitle}>Delete Activity</Text>
                {activityToDelete && (
                  <Text style={styles.deleteModalText}>
                    Are you sure you want to delete "{activityToDelete.title}"?
                    This action cannot be undone.
                  </Text>
                )}
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={styles.deleteModalButton}
                    onPress={closeDeleteModal}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(139, 148, 158, 0.2)",
                        "rgba(139, 148, 158, 0.1)",
                      ]}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.deleteModalButtonText}>Cancel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteModalButton}
                    onPress={handleDeleteActivity}
                  >
                    <LinearGradient
                      colors={GradientConfigs.danger}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.deleteModalConfirmButtonText}>
                        Delete
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },

  // Background
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElement: {
    position: "absolute",
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    overflow: "hidden",
  },
  backgroundElementGradient: {
    flex: 1,
    borderRadius: scale(4),
  },

  // Header Section
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? scale(50) : scale(35),
    paddingHorizontal: scale(20),
    paddingBottom: scale(16),
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: scale(16),
  },
  mainTitle: {
    fontSize: scale(32),
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: scale(4),
  },
  subtitle: {
    fontSize: scale(14),
    color: "#B0B0B0",
    fontWeight: "500",
    textAlign: "center",
  },
  headerActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(12),
  },
  headerActionButton: {
    borderRadius: scale(10),
    overflow: "hidden",
    flex: 1,
    maxWidth: scale(120),
  },
  headerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: scale(14),
    marginLeft: scale(8),
  },

  // Compact Analytics Section
  compactAnalyticsContainer: {
    marginHorizontal: scale(20),
    marginBottom: scale(16),
    borderRadius: scale(14),
    overflow: "hidden",
  },
  compactAnalyticsCard: {
    padding: scale(14),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  compactStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  compactStatItem: {
    alignItems: "center",
    flex: 1,
  },
  compactStatIcon: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(6),
  },
  compactStatNumber: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: scale(2),
  },
  compactStatLabel: {
    fontSize: scale(10),
    fontWeight: "600",
    color: "#B0B0B0",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Activity List
  activityList: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(100),
  },
  activityItemContainer: {
    marginBottom: scale(12),
  },
  activityItem: {
    borderRadius: scale(18),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    height: scale(130),
  },

  // Enhanced Card Design
  cardGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardContainer: {
    flex: 1,
    padding: scale(14),
    justifyContent: "space-between",
  },

  // Header Row: Title, Category, and Control Button
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(10),
  },
  titleSection: {
    flex: 1,
    marginRight: scale(12),
  },
  activityTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: scale(2),
    letterSpacing: -0.3,
  },
  scheduledText: {
    fontSize: scale(10),
    color: "#B0B0B0",
    fontWeight: "500",
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    minWidth: scale(70),
    alignItems: "center",
  },
  completedCategoryBadge: {
    backgroundColor: "rgba(78, 205, 196, 0.3)",
  },
  categoryText: {
    fontSize: scale(9),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  completedCategoryText: {
    color: "#4ECDC4",
  },

  // Header Right Section
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },

  // Main Content Row: Timer/Status and Duration
  cardMainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(10),
  },
  leftContent: {
    flex: 2,
  },
  rightContent: {
    flex: 1,
    alignItems: "flex-end",
  },

  // Timer Section
  timerSection: {
    alignItems: "flex-start",
  },
  timerValue: {
    fontSize: scale(20),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  timerLabel: {
    fontSize: scale(10),
    fontWeight: "500",
    color: "#B0B0B0",
    marginTop: scale(1),
  },

  // Completed Section
  completedSection: {
    alignItems: "flex-start",
  },
  congratsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(2),
  },
  congratsText: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#4ECDC4",
    marginLeft: scale(6),
  },
  // Streak Components
  streakContainer: {
    marginTop: scale(4),
  },
  streakLabel: {
    fontSize: scale(9),
    fontWeight: "600",
    color: "#B0B0B0",
    marginBottom: scale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  streakStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  streakStarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  streakOverflowText: {
    position: "absolute",
    top: -scale(2),
    right: -scale(2),
    fontSize: scale(6),
    fontWeight: "700",
    color: "#FFD700",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: scale(4),
    paddingHorizontal: scale(2),
    paddingVertical: scale(1),
    minWidth: scale(12),
    textAlign: "center",
  },

  // Future Streak Components
  futureStreakContainer: {
    marginTop: scale(4),
  },
  futureStreakLabel: {
    fontSize: scale(8),
    fontWeight: "600",
    color: "#666666",
    marginBottom: scale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  futureStreakStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },

  // Running Streak Components
  runningStreakContainer: {
    marginTop: scale(6),
    alignItems: "flex-end",
  },
  runningStreakLabel: {
    fontSize: scale(7),
    fontWeight: "600",
    color: "#00E5FF",
    marginBottom: scale(1),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  runningStreakStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },

  // Future Section
  futureSection: {
    alignItems: "flex-start",
  },
  futureLabel: {
    fontSize: scale(12),
    fontWeight: "600",
    color: "#666666",
  },
  futureDate: {
    fontSize: scale(10),
    fontWeight: "500",
    color: "#B0B0B0",
    marginTop: scale(1),
  },

  // Duration Text
  durationText: {
    fontSize: scale(12),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: scale(4),
  },
  dateText: {
    fontSize: scale(9),
    fontWeight: "500",
    color: "#B0B0B0",
  },

  // Bottom Row: Progress and Control
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Card Footer: Progress Bar and Dates
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Date Section
  dateSection: {
    alignItems: "flex-end",
  },
  progressSection: {
    flex: 1,
    marginRight: scale(16),
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: scale(6),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(3),
    overflow: "hidden",
    marginRight: scale(8),
  },
  progressFill: {
    height: "100%",
    borderRadius: scale(3),
  },
  progressPercentage: {
    fontSize: scale(10),
    fontWeight: "700",
    color: "#FFFFFF",
    minWidth: scale(30),
    textAlign: "right",
  },

  // Control Section
  controlSection: {
    alignItems: "center",
  },
  controlButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  activeControlButton: {
    backgroundColor: "#FFFFFF",
  },
  completedButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    alignItems: "center",
  },
  futureButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(18),
  },

  // Delete Mode
  deleteCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    minHeight: scale(140),
    padding: scale(20),
  },
  deleteIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  deleteCardText: {
    color: ThemeColors.text,
    fontWeight: "600",
    marginTop: scale(8),
    fontSize: scale(16),
    letterSpacing: 0.2,
  },
  cancelDeleteButton: {
    position: "absolute",
    top: scale(16),
    right: scale(16),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Floating Action Button
  fabContainer: {
    position: "absolute",
    bottom: scale(30),
    right: scale(20),
  },
  fab: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabGlow: {
    position: "absolute",
    top: -scale(8),
    left: -scale(8),
    right: -scale(8),
    bottom: -scale(8),
    borderRadius: scale(32),
  },
  glowGradient: {
    flex: 1,
    borderRadius: scale(32),
  },
  fabGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fabIcon: {
    textShadowColor: "#00E5FF",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: ThemeColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  deleteModalContainer: {
    width: "90%",
    maxWidth: scale(400),
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  deleteModalGradient: {
    padding: scale(24),
    alignItems: "center",
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  deleteModalTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: ThemeColors.text,
    marginTop: scale(16),
    marginBottom: scale(8),
    letterSpacing: -0.2,
  },
  deleteModalText: {
    fontSize: scale(15),
    color: ThemeColors.textSecondary,
    textAlign: "center",
    lineHeight: scale(22),
    marginBottom: scale(24),
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalButtonGradient: {
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  deleteModalButtonText: {
    color: ThemeColors.text,
    fontWeight: "600",
    fontSize: scale(16),
    letterSpacing: 0.2,
  },
  deleteModalConfirmButtonText: {
    color: ThemeColors.text,
    fontWeight: "700",
    fontSize: scale(16),
    letterSpacing: 0.2,
  },

  // Empty State
  emptyState: {
    flex: 1,
    marginTop: scale(40),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  emptyStateGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scale(60),
    paddingHorizontal: scale(30),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyStateTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: scale(16),
    marginBottom: scale(8),
    letterSpacing: -0.2,
  },
  emptyStateText: {
    fontSize: scale(15),
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: scale(22),
    marginBottom: scale(32),
  },
  emptyStateButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(24),
    paddingVertical: scale(14),
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: scale(16),
    marginLeft: scale(8),
    letterSpacing: 0.2,
  },
});

export default ActivityScreen;
