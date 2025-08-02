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

// Get device dimensions and setup responsive design
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// Enhanced responsive scaling with device type consideration
const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.85;
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

// Theme colors for dynamic theming
const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#1A1A1A",
  card: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  border: "rgba(255, 255, 255, 0.1)",
};

// Enhanced gradient configurations
const GradientConfigs = {
  running: ["#00E5FF", "#4ECDC4"] as [string, string],
  paused: ["#FF9500", "#FFB74D"] as [string, string],
  completed: ["#4ECDC4", "#44A08D"] as [string, string],
  future: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"] as [
    string,
    string
  ],
  default: ["#1A1A1A", "#2A2A2A"] as [string, string],
  danger: ["#FF6B6B", "#FF8E53"] as [string, string],
  primary: ["#00E5FF", "#9C6CDA"] as [string, string],
};

const ActivityScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { fontSizeMultiplier, logout } = useAppContext();

  // Enhanced state management
  const [activeTab, setActiveTab] = useState("ACTIVITY");
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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(0)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.3)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerGlowAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabSlideAnim = useRef(new Animated.Value(-width)).current;
  const statsCardAnim = useRef(new Animated.Value(0)).current;

  const deleteMode = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Enhanced helper functions
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

  // Enhanced gradient colors with more sophisticated logic
  const getGradientColors = useCallback(
    (activity: EnhancedActivity): [string, string] => {
      if (activity.isCompleted) return GradientConfigs.completed;
      if (activity.isPaused) return GradientConfigs.paused;
      if (isActivityInFuture(activity)) return GradientConfigs.future;
      if (activity.isRunning) {
        // Dynamic gradients based on activity properties
        const baseGradient = GradientConfigs.running;
        return baseGradient;
      }
      return GradientConfigs.default;
    },
    [isActivityInFuture]
  );

  // Enhanced initialization animations
  const initializeAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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
      Animated.timing(tabSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(statsCardAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation for active timers
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(timerGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Load activities from API
  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await activityService.getActivities();

      // For now, start with empty array until API is implemented
      setActivities([]);
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
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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

        // TODO: Replace with actual API call
        // await activityService.updateTimer(id, { isRunning: newIsRunning });

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
      // TODO: Replace with actual API call
      // await activityService.deleteActivity(activityToDelete.id);

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

        // TODO: Replace with actual API call
        // const savedActivity = await activityService.createActivity(activity);

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

  // Logout handler
  const handleLogout = useCallback(async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
            navigation.navigate("Login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  }, [logout, navigation]);

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

  // Enhanced activity item renderer
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
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50],
                  }),
                },
                { scale: isLongPressed ? scaleAnim : 1 },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.activityItem,
              isFuture && styles.futureActivityItem,
              isCompleted && styles.completedActivityItem,
              item.isRunning && styles.runningActivityItem,
            ]}
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
                colors={getGradientColors(item)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activityContent}
              >
                {/* Enhanced glow effect for running items */}
                {item.isRunning && (
                  <Animated.View
                    style={[
                      styles.activityGlow,
                      {
                        opacity: timerGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.7],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(0, 229, 255, 0.3)",
                        "rgba(156, 108, 218, 0.3)",
                      ]}
                      style={styles.glowGradient}
                    />
                  </Animated.View>
                )}

                {/* Progress indicator */}
                {!isFuture &&
                  !isCompleted &&
                  item.completionPercentage &&
                  item.completionPercentage > 0 && (
                    <View style={styles.progressIndicator}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${item.completionPercentage}%` },
                        ]}
                      />
                    </View>
                  )}

                <View style={styles.cardLeft}>
                  <View style={styles.titleContainer}>
                    <Text
                      style={[
                        styles.activityTitle,
                        isFuture && styles.futureActivityText,
                        isCompleted && styles.completedActivityText,
                      ]}
                    >
                      {item.title}
                      {isFuture && " (Future)"}
                    </Text>

                    {/* Priority indicator */}
                    {item.priority && item.priority <= 3 && (
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor:
                              item.priority === 1
                                ? "#FF4757"
                                : item.priority === 2
                                ? "#FF9500"
                                : "#FFD700",
                          },
                        ]}
                      >
                        <Icon name="flag" size={scale(10)} color="#fff" />
                      </View>
                    )}
                  </View>

                  {isCompleted ? (
                    <View style={styles.completedMessageContainer}>
                      <Icon
                        name="checkmark-circle"
                        size={scale(20)}
                        color="#fff"
                      />
                      <Text style={styles.completedMessageText}>
                        Completed! Streak: {item.streak || 0} days
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.datesContainer}>
                      <View style={styles.dateContainer}>
                        <Icon
                          name="calendar-outline"
                          size={scale(12)}
                          color={isFuture ? "#aaa" : "#fff"}
                        />
                        <Text
                          style={[
                            styles.dateText,
                            isFuture && styles.futureActivityText,
                          ]}
                        >
                          {item.startDate}
                        </Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Icon
                          name="time-outline"
                          size={scale(12)}
                          color={isFuture ? "#aaa" : "#fff"}
                        />
                        <Text
                          style={[
                            styles.dateText,
                            isFuture && styles.futureActivityText,
                          ]}
                        >
                          {item.duration}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.cardRight}>
                  <View style={styles.categoryContainer}>
                    <LinearGradient
                      colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]}
                      style={styles.categoryGradient}
                    >
                      <Icon
                        name={
                          item.category === "Personal"
                            ? "person-outline"
                            : item.category === "Work"
                            ? "briefcase-outline"
                            : "fitness-outline"
                        }
                        size={scale(12)}
                        color={isFuture ? "#aaa" : "#fff"}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          isFuture && styles.futureActivityText,
                        ]}
                      >
                        {item.category}
                      </Text>
                    </LinearGradient>
                  </View>

                  {!isFuture && !isCompleted && (
                    <View style={styles.timerControlContainer}>
                      <TouchableOpacity
                        style={[
                          styles.playButton,
                          item.isRunning && styles.playButtonActive,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleTimer(item.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={
                            item.isRunning
                              ? [
                                  "rgba(255, 255, 255, 0.3)",
                                  "rgba(255, 255, 255, 0.1)",
                                ]
                              : ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]
                          }
                          style={styles.playButtonGradient}
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
                              size={scale(18)}
                              color="#fff"
                            />
                          </Animated.View>
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.remainingTimeContainer}>
                        <LinearGradient
                          colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)"]}
                          style={styles.timeGradient}
                        >
                          <Text style={styles.remainingTimeValue}>
                            {item.currentTimer}
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  )}

                  {isCompleted && (
                    <View style={styles.completedIcon}>
                      <LinearGradient
                        colors={GradientConfigs.completed}
                        style={styles.completedIconGradient}
                      >
                        <Icon
                          name="checkmark-circle"
                          size={scale(30)}
                          color="#fff"
                        />
                      </LinearGradient>
                    </View>
                  )}
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
      getGradientColors,
      timerGlowAnim,
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

        {/* Enhanced animated background */}
        <View style={styles.background}>
          {[...Array(8)].map((_, index) => (
            <Animated.View
              key={`bg-element-${index}`}
              style={[
                styles.backgroundElement,
                {
                  left: `${10 + index * 12}%`,
                  top: `${5 + (index % 4) * 20}%`,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.08],
                  }),
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={GradientConfigs.primary}
                style={styles.backgroundElementGradient}
              />
            </Animated.View>
          ))}
        </View>

        {/* Enhanced Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: headerScaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <LinearGradient
                colors={
                  ["rgba(0, 229, 255, 0.2)", "rgba(0, 229, 255, 0.1)"] as [
                    string,
                    string
                  ]
                }
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="settings-outline"
                  size={scale(24)}
                  color={ThemeColors.primary}
                />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Activity Manager</Text>
              <Text style={styles.headerSubtitle}>Track your progress</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                navigation.navigate("Stats", { activeTab: "activities" })
              }
            >
              <LinearGradient
                colors={
                  ["rgba(156, 108, 218, 0.2)", "rgba(156, 108, 218, 0.1)"] as [
                    string,
                    string
                  ]
                }
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="bar-chart-outline"
                  size={scale(24)}
                  color={ThemeColors.secondary}
                />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={
                  ["rgba(255, 71, 87, 0.2)", "rgba(255, 71, 87, 0.1)"] as [
                    string,
                    string
                  ]
                }
                style={styles.headerButtonGradient}
              >
                <Icon
                  name="log-out-outline"
                  size={scale(24)}
                  color={ThemeColors.danger}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Statistics Card */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: statsCardAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={
              ["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"] as [
                string,
                string
              ]
            }
            style={styles.statsContainer}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: ThemeColors.primary }]}>
                {stats.running}
              </Text>
              <Text style={styles.statLabel}>Running</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: ThemeColors.success }]}>
                {stats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: ThemeColors.secondary }]}
              >
                {stats.completionRate}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced Tab Container */}
        <Animated.View
          style={[
            styles.tabCard,
            {
              opacity: fadeAnim,
              transform: [{ translateX: tabSlideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={
              ["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"] as [
                string,
                string
              ]
            }
            style={styles.tabContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === "ACTIVITY" && styles.activeTab]}
              onPress={() => setActiveTab("ACTIVITY")}
            >
              {activeTab === "ACTIVITY" && (
                <LinearGradient
                  colors={GradientConfigs.primary}
                  style={styles.activeTabGradient}
                />
              )}
              <Icon
                name="list-outline"
                size={scale(18)}
                color={activeTab === "ACTIVITY" ? "#FFFFFF" : "#9C9C9C"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ACTIVITY" && styles.activeTabText,
                ]}
              >
                Activities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "TASK" && styles.activeTab]}
              onPress={() => {
                setActiveTab("TASK");
                navigation.navigate("Task");
              }}
            >
              {activeTab === "TASK" && (
                <LinearGradient
                  colors={GradientConfigs.primary}
                  style={styles.activeTabGradient}
                />
              )}
              <Icon
                name="checkbox-outline"
                size={scale(18)}
                color={activeTab === "TASK" ? "#FFFFFF" : "#9C9C9C"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "TASK" && styles.activeTabText,
                ]}
              >
                Tasks
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced Add Button */}
        <Animated.View
          style={[
            styles.addButtonCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={GradientConfigs.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Icon name="add" size={scale(24)} color="#fff" />
              <Text style={styles.addButtonText}>Create New Activity</Text>
              <Icon
                name="arrow-forward"
                size={scale(20)}
                color="rgba(255, 255, 255, 0.7)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Activities List */}
        <FlatList
          data={filteredAndSortedActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.activityList}
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
              <Icon
                name="calendar-outline"
                size={scale(60)}
                color={ThemeColors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No activities yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first activity to start tracking your progress
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={GradientConfigs.primary}
                  style={styles.emptyStateButtonGradient}
                >
                  <Text style={styles.emptyStateButtonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Add Activity Modal */}
        <AddActivityModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddActivity}
        />

        {/* Enhanced Delete Confirmation Modal */}
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
                colors={
                  ["rgba(26, 26, 26, 0.98)", "rgba(42, 42, 42, 0.98)"] as [
                    string,
                    string
                  ]
                }
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
                      colors={
                        ["rgba(60, 60, 60, 0.8)", "rgba(80, 80, 80, 0.8)"] as [
                          string,
                          string
                        ]
                      }
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
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElement: {
    position: "absolute",
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    overflow: "hidden",
  },
  backgroundElementGradient: {
    flex: 1,
    borderRadius: scale(6),
  },

  // Enhanced Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === "ios" ? scale(55) : scale(35),
    paddingBottom: scale(20),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  headerButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    marginLeft: scale(15),
  },
  headerTitle: {
    color: ThemeColors.text,
    fontWeight: "900",
    fontSize: scale(28),
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    marginTop: scale(2),
  },

  // Enhanced Statistics Card
  statsCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(15),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: scale(20),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: ThemeColors.text,
    fontSize: scale(24),
    fontWeight: "900",
    marginBottom: scale(4),
  },
  statLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },

  // Enhanced Tab styles
  tabCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(15),
    borderRadius: scale(25),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: ThemeColors.border,
    height: scale(56),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: scale(25),
    overflow: "hidden",
  },
  activeTab: {
    // Active tab styling handled by gradient
  },
  activeTabGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scale(25),
  },
  tabIcon: {
    marginRight: scale(8),
    zIndex: 1,
  },
  tabText: {
    color: "#9C9C9C",
    fontWeight: "600",
    fontSize: scale(16),
    zIndex: 1,
  },
  activeTabText: {
    color: ThemeColors.text,
    fontWeight: "800",
  },

  // Enhanced Add button styles
  addButtonCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(15),
    borderRadius: scale(18),
    overflow: "hidden",
    elevation: 6,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  addButton: {
    borderRadius: scale(18),
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(25),
    paddingVertical: scale(18),
  },
  addButtonText: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
    flex: 1,
    marginLeft: scale(12),
  },

  // Enhanced Activity list styles
  activityList: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },
  activityItemContainer: {
    marginBottom: scale(16),
  },
  activityItem: {
    borderRadius: scale(24),
    overflow: "hidden",
    minHeight: scale(130),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  futureActivityItem: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
  },
  completedActivityItem: {
    borderWidth: 2,
    borderColor: ThemeColors.success,
  },
  runningActivityItem: {
    borderWidth: 2,
    borderColor: ThemeColors.primary,
  },
  activityContent: {
    flexDirection: "row",
    padding: scale(22),
    minHeight: scale(130),
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  activityGlow: {
    position: "absolute",
    top: -scale(15),
    left: -scale(15),
    right: -scale(15),
    bottom: -scale(15),
    borderRadius: scale(35),
  },
  glowGradient: {
    flex: 1,
    borderRadius: scale(35),
  },

  // Enhanced progress indicator
  progressIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(4),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: ThemeColors.primary,
  },

  // Enhanced Card content styles
  cardLeft: {
    flex: 2.5,
    justifyContent: "center",
    paddingRight: scale(15),
    zIndex: 1,
  },
  cardRight: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  activityTitle: {
    fontWeight: "800",
    color: ThemeColors.text,
    fontSize: scale(18),
    letterSpacing: 0.5,
    flex: 1,
  },
  priorityBadge: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale(8),
  },
  futureActivityText: {
    color: ThemeColors.textSecondary,
    opacity: 0.8,
  },
  completedActivityText: {
    color: ThemeColors.text,
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: ThemeColors.text,
    marginLeft: scale(6),
    fontSize: scale(12),
    fontWeight: "500",
  },

  // Enhanced category and timer styles
  categoryContainer: {
    marginRight: scale(15),
    borderRadius: scale(20),
    overflow: "hidden",
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
  },
  categoryText: {
    color: ThemeColors.text,
    marginLeft: scale(6),
    fontWeight: "600",
    fontSize: scale(12),
  },
  timerControlContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: scale(110),
  },
  playButton: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    marginBottom: scale(10),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playButtonActive: {
    elevation: 8,
    shadowColor: ThemeColors.primary,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  remainingTimeContainer: {
    borderRadius: scale(14),
    overflow: "hidden",
    minWidth: scale(90),
  },
  timeGradient: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  remainingTimeValue: {
    color: ThemeColors.text,
    fontWeight: "700",
    fontSize: scale(14),
    textAlign: "center",
  },

  // Enhanced completed activity styles
  completedMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedMessageText: {
    color: ThemeColors.text,
    marginLeft: scale(8),
    fontWeight: "600",
    fontSize: scale(14),
  },
  completedIcon: {
    borderRadius: scale(28),
    overflow: "hidden",
  },
  completedIconGradient: {
    width: scale(56),
    height: scale(56),
    justifyContent: "center",
    alignItems: "center",
  },

  // Enhanced delete mode styles
  deleteCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(24),
    position: "relative",
    minHeight: scale(130),
  },
  deleteIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: scale(140),
    height: scale(90),
  },
  deleteCardText: {
    color: ThemeColors.text,
    fontWeight: "700",
    marginTop: scale(10),
    fontSize: scale(15),
  },
  cancelDeleteButton: {
    position: "absolute",
    top: scale(15),
    right: scale(15),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Enhanced modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  deleteModalContainer: {
    width: "92%",
    borderRadius: scale(24),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  deleteModalGradient: {
    padding: scale(35),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  deleteModalTitle: {
    fontSize: scale(24),
    fontWeight: "900",
    color: ThemeColors.text,
    marginBottom: scale(15),
    marginTop: scale(15),
    letterSpacing: 0.5,
  },
  deleteModalText: {
    fontSize: scale(16),
    color: ThemeColors.textSecondary,
    textAlign: "center",
    marginBottom: scale(35),
    lineHeight: scale(24),
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: scale(15),
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalButtonGradient: {
    paddingVertical: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalButtonText: {
    color: ThemeColors.text,
    fontWeight: "600",
    fontSize: scale(16),
  },
  deleteModalConfirmButtonText: {
    color: ThemeColors.text,
    fontWeight: "800",
    fontSize: scale(16),
  },

  // Enhanced empty state styles
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scale(60),
    paddingHorizontal: scale(30),
  },
  emptyStateTitle: {
    fontSize: scale(22),
    fontWeight: "700",
    color: ThemeColors.text,
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  emptyStateText: {
    fontSize: scale(16),
    color: ThemeColors.textSecondary,
    textAlign: "center",
    lineHeight: scale(24),
    marginBottom: scale(30),
  },
  emptyStateButton: {
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 5,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  emptyStateButtonGradient: {
    paddingHorizontal: scale(30),
    paddingVertical: scale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateButtonText: {
    color: ThemeColors.text,
    fontWeight: "700",
    fontSize: scale(16),
  },
});

export default ActivityScreen;