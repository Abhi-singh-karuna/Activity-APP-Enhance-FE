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
  TextInput,
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
import Toast, { ToastType } from "../../components/Toast";

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
  priorityName?: string;
  priorityColor?: string;
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

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "running" | "completed" | "future" | "paused" | "past"
  >("all");
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStreak, setFilterStreak] = useState<number | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [analyticsMode, setAnalyticsMode] = useState<"completion" | "time">(
    "completion"
  );
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");
  // Calendar dropdown state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [twoWeekStartDate, setTwoWeekStartDate] = useState<Date>(() => {
    const now = new Date();
    // Align start to Monday for consistency
    const day = now.getDay(); // 0=Sun..6=Sat
    const daysSinceMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const twoWeekScrollRef = useRef<ScrollView | null>(null);
  const innerCalendarWidth = useMemo(
    () => width - scale(20) * 2 - scale(16) * 2,
    []
  );
  const twoWeekPaddingH = useMemo(() => scale(6), []);
  const twoWeekGap = useMemo(() => scale(2), []);
  const twoWeekCellWidth = useMemo(() => {
    const VISIBLE_DAYS = 7; // show 7 days at a time
    const available =
      innerCalendarWidth -
      twoWeekPaddingH * 2 -
      twoWeekGap * (VISIBLE_DAYS - 1);
    return Math.floor(available / VISIBLE_DAYS);
  }, [innerCalendarWidth, twoWeekPaddingH, twoWeekGap]);

  const centerTwoWeekPager = useCallback(() => {
    requestAnimationFrame(() => {
      twoWeekScrollRef.current?.scrollTo({
        x: innerCalendarWidth,
        animated: false,
      });
    });
  }, [innerCalendarWidth]);
  const alignWindowToDate = useCallback((date: Date) => {
    const midStart = new Date(date);
    midStart.setDate(date.getDate() - 3);
    midStart.setHours(0, 0, 0, 0);
    setTwoWeekStartDate(midStart);
  }, []);

  useEffect(() => {
    if (showCalendar) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
      const refStr = selectedCalendarDate || todayStr;
      const [yy, mm, dd] = refStr.split("/").map((p) => parseInt(p, 10));
      if (!Number.isNaN(yy) && !Number.isNaN(mm) && !Number.isNaN(dd)) {
        const sel = new Date(yy, mm - 1, dd);
        alignWindowToDate(sel);
      }
      centerTwoWeekPager();
    }
  }, [
    showCalendar,
    centerTwoWeekPager,
    selectedCalendarDate,
    alignWindowToDate,
  ]);

  const handleTwoWeekMomentumEnd = useCallback(
    (e: any) => {
      const x = e?.nativeEvent?.contentOffset?.x || 0;
      const pageIndex = Math.round(x / innerCalendarWidth);
      const prevStart = new Date(twoWeekStartDate);
      prevStart.setDate(prevStart.getDate() - 7);
      const nextStart = new Date(twoWeekStartDate);
      nextStart.setDate(nextStart.getDate() + 7);

      if (pageIndex === 0) {
        setTwoWeekStartDate(prevStart);
      } else if (pageIndex === 2) {
        setTwoWeekStartDate(nextStart);
      }
      centerTwoWeekPager();
    },
    [innerCalendarWidth, twoWeekStartDate, centerTwoWeekPager]
  );

  const renderTwoWeekPage = useCallback(
    (start: Date) => {
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
      }
      const now = new Date();
      const todayStr = `${now.getFullYear()}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
      return (
        <LinearGradient
          colors={["rgba(0, 229, 255, 0.12)", "rgba(156, 108, 218, 0.08)"]}
          style={[
            styles.twoWeekGradient,
            { paddingHorizontal: twoWeekPaddingH },
          ]}
        >
          <View style={[styles.twoWeekRow, { width: innerCalendarWidth }]}>
            {days.map((d, idx) => {
              const cellDate = `${d.getFullYear()}/${String(
                d.getMonth() + 1
              ).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
              const isToday = cellDate === todayStr;
              const isSelected = cellDate === selectedCalendarDate;
              const weekday = ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
              return (
                <TouchableOpacity
                  key={`tw-${idx}-${cellDate}`}
                  style={[
                    styles.twoWeekCell,
                    {
                      width: twoWeekCellWidth,
                      height: Math.max(scale(44), twoWeekCellWidth),
                      borderRadius: Math.round(twoWeekCellWidth / 3),
                      marginRight: idx !== 13 ? twoWeekGap : 0,
                    },
                    isToday && styles.calendarCellToday,
                    isSelected && styles.calendarCellSelected,
                  ]}
                  onPress={() => {
                    setSelectedCalendarDate(cellDate);
                    setFilterDateRange({ start: cellDate, end: cellDate });
                    const [y2, m2, d2] = cellDate
                      .split("/")
                      .map((p) => parseInt(p, 10));
                    if (
                      !Number.isNaN(y2) &&
                      !Number.isNaN(m2) &&
                      !Number.isNaN(d2)
                    ) {
                      alignWindowToDate(new Date(y2, m2 - 1, d2));
                      centerTwoWeekPager();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.twoWeekDayLabel}>{weekday}</Text>
                  <Text
                    style={[
                      styles.calendarCellText,
                      isSelected && styles.calendarCellTextSelected,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      );
    },
    [selectedCalendarDate]
  );
  // Simple FAB: no menu
  const listRef = useRef<FlatList<EnhancedActivity> | null>(null);
  const fabPressAnim = useRef(new Animated.Value(1)).current;

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

  const getCurrentDate = useCallback((): string => {
    return formatDate(new Date());
  }, [formatDate]);

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

  // Enhanced date comparison functions
  const isActivityInFuture = useCallback(
    (activity: EnhancedActivity): boolean => {
      const currentDate = new Date();
      const startDate = new Date(activity.startDate.replace(/\//g, "-"));
      startDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      return startDate > currentDate;
    },
    []
  );

  const isActivityInPast = useCallback(
    (activity: EnhancedActivity): boolean => {
      const currentDate = new Date();
      const endDate = new Date(activity.endDate.replace(/\//g, "-"));
      endDate.setHours(23, 59, 59, 999);
      currentDate.setHours(0, 0, 0, 0);
      return endDate < currentDate;
    },
    []
  );

  const isActivityActive = useCallback(
    (activity: EnhancedActivity): boolean => {
      const currentDate = new Date();
      const startDate = new Date(activity.startDate.replace(/\//g, "-"));
      const endDate = new Date(activity.endDate.replace(/\//g, "-"));

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= startDate && currentDate <= endDate;
    },
    []
  );

  const canStartActivity = useCallback(
    (activity: EnhancedActivity): boolean => {
      return isActivityActive(activity) && !activity.isCompleted;
    },
    [isActivityActive]
  );

  // Filter functions
  const getFilteredActivities = useCallback(() => {
    let filtered = [...activities];

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(
        (activity) => activity.category === filterCategory
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "running":
          filtered = filtered.filter((activity) => activity.isRunning);
          break;
        case "completed":
          filtered = filtered.filter((activity) => activity.isCompleted);
          break;
        case "future":
          filtered = filtered.filter((activity) =>
            isActivityInFuture(activity)
          );
          break;
        case "paused":
          filtered = filtered.filter((activity) => activity.isPaused);
          break;
        case "past":
          filtered = filtered.filter(
            (activity) => isActivityInPast(activity) && !activity.isCompleted
          );
          break;
      }
    }

    // Priority filter
    if (filterPriority !== null) {
      filtered = filtered.filter(
        (activity) => activity.priority === filterPriority
      );
    }

    // Date range filter
    if (filterDateRange.start || filterDateRange.end) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.startDate.replace(/\//g, "-"));
        const startDate = filterDateRange.start
          ? new Date(filterDateRange.start.replace(/\//g, "-"))
          : null;
        const endDate = filterDateRange.end
          ? new Date(filterDateRange.end.replace(/\//g, "-"))
          : null;

        if (startDate && endDate) {
          return activityDate >= startDate && activityDate <= endDate;
        } else if (startDate) {
          return activityDate >= startDate;
        } else if (endDate) {
          return activityDate <= endDate;
        }
        return true;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.category.toLowerCase().includes(query)
      );
    }

    // Streak filter
    if (filterStreak !== null) {
      filtered = filtered.filter(
        (activity) => (activity.streak || 0) >= filterStreak
      );
    }

    // Sort activities
    switch (sortBy) {
      case "priority":
        filtered.sort((a, b) => a.priority - b.priority);
        break;
      case "duration":
        filtered.sort(
          (a, b) => timeToSeconds(b.duration) - timeToSeconds(a.duration)
        );
        break;
      case "completion":
        filtered.sort(
          (a, b) =>
            (b.completionPercentage || 0) - (a.completionPercentage || 0)
        );
        break;
      case "recent":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.startDate.replace(/\//g, "-")).getTime() -
            new Date(a.startDate.replace(/\//g, "-")).getTime()
        );
        break;
    }

    return filtered;
  }, [
    activities,
    filterCategory,
    filterStatus,
    filterPriority,
    filterDateRange,
    searchQuery,
    filterStreak,
    sortBy,
    isActivityInFuture,
    isActivityInPast,
    timeToSeconds,
  ]);

  const clearAllFilters = useCallback(() => {
    setFilterCategory(null);
    setFilterStatus("all");
    setFilterPriority(null);
    setFilterDateRange({ start: null, end: null });
    setSearchQuery("");
    setFilterStreak(null);
    setSortBy("recent");
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filterCategory) count++;
    if (filterStatus !== "all") count++;
    if (filterPriority !== null) count++;
    if (filterDateRange.start || filterDateRange.end) count++;
    if (searchQuery.trim()) count++;
    if (filterStreak !== null) count++;
    return count;
  }, [
    filterCategory,
    filterStatus,
    filterPriority,
    filterDateRange,
    searchQuery,
    filterStreak,
  ]);

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
      const currentDate = getCurrentDate();

      // Sample activities with different states
      const sampleActivities: EnhancedActivity[] = [
        // PAST COMPLETED ACTIVITY (with visible streak)
        {
          id: "1",
          title: "Morning Workout",
          category: "Workout" as Category,
          startDate: "2025/01/15",
          endDate: "2025/01/15",
          duration: "01:00:00",
          color: "#00E5FF",
          priority: 1,
          priorityName: "High",
          priorityColor: "#FF4757",
          isCompleted: true,
          isRunning: false,
          currentTimer: "00:00:00",
          remainingSeconds: 0,
          completionPercentage: 100,
          elapsedSeconds: 3600,
          totalTimeSpent: 3600,
          streak: 7,
          lastCompletedDate: "2025/01/15",
        },
        // ONGOING ACTIVITY (current date)
        {
          id: "2",
          title: "Team Meeting",
          category: "Work" as Category,
          startDate: currentDate,
          endDate: currentDate,
          duration: "00:30:00",
          color: "#9C6CDA",
          priority: 2,
          priorityName: "Medium",
          priorityColor: "#FF9500",
          isRunning: true,
          isCompleted: false,
          currentTimer: "00:25:00",
          remainingSeconds: 1500,
          completionPercentage: 17,
          elapsedSeconds: 300,
          totalTimeSpent: 300,
          lastStartTime: Date.now() - 300000,
          streak: 3,
        },
        // UPCOMING ACTIVITY (future date)
        {
          id: "3",
          title: "Gym Session",
          category: "Workout" as Category,
          startDate: "2025/01/20",
          endDate: "2025/01/20",
          duration: "01:30:00",
          color: "#FF4757",
          priority: 1,
          priorityName: "High",
          priorityColor: "#FF4757",
          isRunning: false,
          isCompleted: false,
          isFuture: true,
          currentTimer: "01:30:00",
          remainingSeconds: 5400,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 5,
        },
        // ADDITIONAL PAST COMPLETED ACTIVITY
        {
          id: "4",
          title: "Read Book",
          category: "Personal" as Category,
          startDate: "2025/01/10",
          endDate: "2025/01/10",
          duration: "00:45:00",
          color: "#4ECDC4",
          priority: 3,
          priorityName: "Low",
          priorityColor: "#4ECDC4",
          isCompleted: true,
          isRunning: false,
          currentTimer: "00:00:00",
          remainingSeconds: 0,
          completionPercentage: 100,
          elapsedSeconds: 2700,
          totalTimeSpent: 2700,
          streak: 12,
          lastCompletedDate: "2025/01/10",
        },
        // ADDITIONAL ONGOING ACTIVITY (current date)
        {
          id: "5",
          title: "Learn React Native",
          category: "Personal" as Category,
          startDate: currentDate,
          endDate: currentDate,
          duration: "02:00:00",
          color: "#FF9500",
          priority: 2,
          priorityName: "Medium",
          priorityColor: "#FF9500",
          isRunning: true,
          isCompleted: false,
          currentTimer: "01:30:45",
          remainingSeconds: 5445,
          completionPercentage: 24,
          elapsedSeconds: 1755,
          totalTimeSpent: 1755,
          lastStartTime: Date.now() - 1755000,
          streak: 8,
        },
        // FUTURE ACTIVITY (next week)
        {
          id: "6",
          title: "Project Review",
          category: "Work" as Category,
          startDate: "2025/01/25",
          endDate: "2025/01/25",
          duration: "01:00:00",
          color: "#9C6CDA",
          priority: 1,
          priorityName: "High",
          priorityColor: "#FF4757",
          isRunning: false,
          isCompleted: false,
          isFuture: true,
          currentTimer: "01:00:00",
          remainingSeconds: 3600,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 2,
        },
        // ADDITIONAL FUTURE ACTIVITY (with high streak)
        {
          id: "7",
          title: "Weekly Planning",
          category: "Personal" as Category,
          startDate: "2025/09/28",
          endDate: "2025/09/28",
          duration: "00:45:00",
          color: "#FF9500",
          priority: 2,
          priorityName: "Medium",
          priorityColor: "#FF9500",
          isRunning: false,
          isCompleted: false,
          isFuture: true,
          currentTimer: "00:45:00",
          remainingSeconds: 2700,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 15,
        },
        // EXPIRED ACTIVITY (with streak)
        {
          id: "8",
          title: "Daily Meditation",
          category: "Personal" as Category,
          startDate: "2025/01/05",
          endDate: "2025/01/05",
          duration: "00:30:00",
          color: "#4ECDC4",
          priority: 1,
          priorityName: "High",
          priorityColor: "#FF4757",
          isRunning: false,
          isCompleted: false,
          currentTimer: "00:30:00",
          remainingSeconds: 1800,
          completionPercentage: 0,
          elapsedSeconds: 0,
          totalTimeSpent: 0,
          streak: 8,
        },
      ];

      setActivities(sampleActivities);
    } catch (error) {
      console.error("Failed to load activities:", error);
      Alert.alert("Error", "Failed to load activities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentDate]);

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

  // Enhanced timer functionality with date validation
  const toggleTimer = useCallback(
    async (id: string) => {
      try {
        const activity = activities.find((a) => a.id === id);
        if (!activity) return;

        // Check if activity can be started based on date
        if (!canStartActivity(activity)) {
          Alert.alert(
            "Cannot Start Activity",
            "This activity cannot be started outside its scheduled date range."
          );
          return;
        }

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
    [activities, canStartActivity]
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
        // Success toast
        setToastType("success");
        setToastMessage("Activity created successfully");
        setToastVisible(true);
      } catch (error) {
        console.error("Failed to add activity:", error);
        Alert.alert("Error", "Failed to add activity. Please try again.");
        // Error toast
        setToastType("error");
        setToastMessage("Failed to create activity");
        setToastVisible(true);
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
    return getFilteredActivities();
  }, [getFilteredActivities]);

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

  const noActiveFilters = useMemo(
    () => getActiveFiltersCount() === 0,
    [getActiveFiltersCount]
  );

  // No quick menu; single add action is handled inline

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
      const isPast = isActivityInPast(item);
      const isActive = isActivityActive(item);
      const canStart = canStartActivity(item);
      const isLongPressed = longPressedId === item.id;
      const showDeleteUI = isLongPressed && deleteReady;
      const isCompleted = item.isCompleted;
      const currentDate = getCurrentDate();

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
                      {/* Activity Title with Priority */}
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {/* Removed inline priority name in favor of dedicated priority badge */}
                      </View>

                      {/* Date Range Display */}
                      <View style={styles.dateRangeContainer}>
                        <Icon
                          name="calendar-outline"
                          size={scale(9)}
                          color="#B0B0B0"
                        />
                        <Text style={styles.dateRangeText}>
                          {item.startDate}
                          {item.startDate !== item.endDate &&
                            ` → ${item.endDate}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerRight}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          // toggle category filter
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut
                          );
                          setFilterCategory((prev) =>
                            prev === (item.category as Category)
                              ? null
                              : (item.category as Category)
                          );
                          setFilterStatus("all");
                        }}
                        onLongPress={(e) => {
                          e.stopPropagation();
                          // long-press to clear category filter
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut
                          );
                          setFilterCategory(null);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryBadge,
                            isCompleted && styles.completedCategoryBadge,
                            filterCategory === item.category &&
                              styles.categoryBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              isCompleted && styles.completedCategoryText,
                              filterCategory === item.category &&
                                styles.categoryTextActive,
                            ]}
                          >
                            {item.category.toUpperCase()}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Priority Badge */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (typeof item.priority === "number") {
                            LayoutAnimation.configureNext(
                              LayoutAnimation.Presets.easeInEaseOut
                            );
                            setFilterPriority((prev) =>
                              prev === item.priority ? null : item.priority
                            );
                            setFilterStatus("all");
                          }
                        }}
                        onLongPress={(e) => {
                          e.stopPropagation();
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut
                          );
                          setFilterPriority(null);
                        }}
                        accessibilityLabel="Filter by this priority"
                      >
                        {(() => {
                          const badgeColor =
                            item.priorityColor ||
                            (item.priority === 1
                              ? "#FF4757"
                              : item.priority === 2
                              ? "#FF9500"
                              : "#4ECDC4");
                          const isActive = filterPriority === item.priority;
                          return (
                            <View
                              style={[
                                styles.priorityBadge,
                                isActive && styles.priorityBadgeActive,
                                {
                                  borderColor: badgeColor,
                                  backgroundColor: `${badgeColor}26`, // ~15% opacity
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.priorityBadgeText,
                                  isActive && styles.priorityBadgeTextActive,
                                  { color: badgeColor },
                                ]}
                              >
                                {(
                                  item.priorityName || `P${item.priority}`
                                )?.toUpperCase()}
                              </Text>
                            </View>
                          );
                        })()}
                      </TouchableOpacity>

                      {/* Control Button */}
                      <View style={styles.controlSection}>
                        {isPast && !isCompleted && (
                          <TouchableOpacity
                            style={styles.pastButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              // Navigate to calendar or show past activity details
                              Alert.alert(
                                "Past Activity",
                                "This activity was scheduled for the past and cannot be started."
                              );
                            }}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name="calendar"
                              size={scale(14.4)}
                              color="#FF4757"
                            />
                          </TouchableOpacity>
                        )}

                        {isFuture && (
                          <TouchableOpacity
                            style={styles.futureButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert(
                                "Future Activity",
                                "This activity is scheduled for the future."
                              );
                            }}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name="time-outline"
                              size={scale(14.4)}
                              color="#666666"
                            />
                          </TouchableOpacity>
                        )}

                        {isActive && !isCompleted && canStart && (
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
                                size={scale(14.4)}
                                color="#000000"
                              />
                            </Animated.View>
                          </TouchableOpacity>
                        )}

                        {isCompleted && (
                          <View style={styles.completedButton}>
                            <Icon
                              name="checkmark-circle"
                              size={scale(21.6)}
                              color="#4ECDC4"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Main Content Row: Timer/Status and Duration */}
                  <View style={styles.cardMainContent}>
                    <View style={styles.leftContent}>
                      {isActive && !isCompleted && (
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
                              size={scale(12.6)}
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

                      {isPast && !isCompleted && (
                        <View style={styles.pastSection}>
                          <Text style={styles.pastLabel}>Expired</Text>
                          <Text style={styles.pastDate}>{item.endDate}</Text>
                          {item.streak && item.streak > 0 && (
                            <View style={styles.pastStreakContainer}>
                              <Text style={styles.pastStreakLabel}>
                                Previous streak
                              </Text>
                              <View style={styles.pastStreakStarsRow}>
                                {renderStreakStars(item.streak, true, false)}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.rightContent}>
                      <Text style={styles.durationText}>{item.duration}</Text>
                      {isActive &&
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

                  {/* Bottom Row: Progress Bar, Streak, and Current Date */}
                  <View style={styles.cardFooter}>
                    <View style={styles.progressSection}>
                      {isActive &&
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

                    {/* Inline Streak and Current Date */}
                    <View style={styles.footerRightSection}>
                      {/* Streak Display - Only for completed and expired activities */}
                      {(isCompleted || isPast) &&
                        item.streak &&
                        item.streak > 0 && (
                          <View style={styles.inlineStreakContainer}>
                            <Icon
                              name="star"
                              size={scale(8)}
                              color={isCompleted ? "#FFD700" : "#FFD700"}
                            />
                            <Text
                              style={[
                                styles.inlineStreakText,
                                {
                                  color: isCompleted ? "#FFD700" : "#FFD700",
                                },
                              ]}
                            >
                              {item.streak}
                            </Text>
                          </View>
                        )}

                      {/* Current Date */}
                      <View style={styles.currentDateSection}>
                        <Icon
                          name="today-outline"
                          size={scale(8)}
                          color="#B0B0B0"
                        />
                        <Text style={styles.currentDateText}>
                          {currentDate}
                        </Text>
                      </View>
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
      isActivityInPast,
      isActivityActive,
      canStartActivity,
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
      getCurrentDate,
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
            {!showSearchModal ? (
              <>
                <View style={styles.titleRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      listRef.current?.scrollToOffset({
                        offset: 0,
                        animated: true,
                      });
                      if (Platform.OS === "ios" || Platform.OS === "android") {
                        Vibration.vibrate(10);
                      }
                    }}
                    accessibilityLabel="Scroll to top"
                  >
                    <Text style={styles.mainTitle}>Activity Hub</Text>
                  </TouchableOpacity>
                  <View style={styles.titleButtonsContainer}>
                    <TouchableOpacity
                      style={styles.floatingSearchButton}
                      onPress={() => {
                        setShowSearchModal(true);
                        setShowFilters(false);
                        setShowCalendar(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(0, 229, 255, 0.2)",
                          "rgba(0, 229, 255, 0.1)",
                        ]}
                        style={styles.floatingSearchGradient}
                      >
                        <Icon name="search" size={scale(16)} color="#00E5FF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    {/* Calendar Button */}
                    <TouchableOpacity
                      style={styles.floatingCalendarButton}
                      onPress={() => {
                        setShowCalendar((prev) => !prev);
                        setShowFilters(false);
                        setShowSearchModal(false);
                      }}
                      activeOpacity={0.8}
                      accessibilityLabel="Open calendar"
                    >
                      <LinearGradient
                        colors={[
                          showCalendar
                            ? "rgba(78, 205, 196, 0.3)"
                            : "rgba(78, 205, 196, 0.2)",
                          showCalendar
                            ? "rgba(78, 205, 196, 0.2)"
                            : "rgba(78, 205, 196, 0.1)",
                        ]}
                        style={styles.floatingCalendarGradient}
                      >
                        <Icon
                          name="calendar-outline"
                          size={scale(16)}
                          color="#4ECDC4"
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.floatingFilterButton}
                      onPress={() => {
                        setShowFilters(!showFilters);
                        setShowSearchModal(false);
                        setSearchQuery("");
                        setShowCalendar(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[
                          showFilters
                            ? "rgba(156, 108, 218, 0.3)"
                            : "rgba(156, 108, 218, 0.2)",
                          showFilters
                            ? "rgba(156, 108, 218, 0.2)"
                            : "rgba(156, 108, 218, 0.1)",
                        ]}
                        style={styles.floatingFilterGradient}
                      >
                        <Icon
                          name="filter"
                          size={scale(16)}
                          color={showFilters ? "#9C6CDA" : "#9C6CDA"}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  Track & Manage Your Activities
                </Text>
              </>
            ) : (
              <View style={styles.searchExpandedContainer}>
                <View style={styles.searchExpandedInputContainer}>
                  <Icon name="search" size={scale(18)} color="#00E5FF" />
                  <TextInput
                    style={styles.searchExpandedInput}
                    placeholder="Search activities..."
                    placeholderTextColor="#B0B0B0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={styles.searchExpandedClearButton}
                    >
                      <Icon
                        name="close-circle"
                        size={scale(16)}
                        color="#B0B0B0"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.searchExpandedCloseButton}
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery("");
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="close" size={scale(20)} color="#B0B0B0" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons Row - hidden when filter or calendar is open */}
          {!(showFilters || showCalendar) && (
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
                  colors={[
                    "rgba(78, 205, 196, 0.2)",
                    "rgba(78, 205, 196, 0.1)",
                  ]}
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
          )}
        </Animated.View>

        {/* Filter Dropdown */}
        {showFilters && (
          <Animated.View
            style={[
              styles.filterDropdownContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(30, 30, 30, 0.95)", "rgba(44, 44, 46, 0.9)"]}
              style={styles.filterDropdownGradient}
            >
              {/* Category Filter */}
              <View style={styles.filterDropdownSection}>
                <Text style={styles.filterDropdownTitle}>Category</Text>
                <View style={styles.filterDropdownChips}>
                  {["All", "Workout", "Work", "Personal"].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterDropdownChip,
                        filterCategory ===
                          (category === "All"
                            ? null
                            : (category as Category)) &&
                          styles.filterDropdownChipActive,
                      ]}
                      onPress={() =>
                        setFilterCategory(
                          category === "All" ? null : (category as Category)
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterDropdownChipText,
                          filterCategory ===
                            (category === "All"
                              ? null
                              : (category as Category)) &&
                            styles.filterDropdownChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterDropdownSection}>
                <Text style={styles.filterDropdownTitle}>Status</Text>
                <View style={styles.filterDropdownChips}>
                  {[
                    { label: "All", value: "all" },
                    { label: "Running", value: "running" },
                    { label: "Completed", value: "completed" },
                    { label: "Past", value: "past" },
                    { label: "Future", value: "future" },
                    { label: "Paused", value: "paused" },
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.filterDropdownChip,
                        filterStatus === status.value &&
                          styles.filterDropdownChipActive,
                      ]}
                      onPress={() => setFilterStatus(status.value as any)}
                    >
                      <Text
                        style={[
                          styles.filterDropdownChipText,
                          filterStatus === status.value &&
                            styles.filterDropdownChipTextActive,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority & Sort Row */}
              <View style={styles.filterDropdownRow}>
                {/* Priority Filter */}
                <View style={styles.filterDropdownHalfSection}>
                  <Text style={styles.filterDropdownTitle}>Priority</Text>
                  <View style={styles.filterDropdownChips}>
                    {[
                      { label: "All", value: null },
                      { label: "High", value: 1 },
                      { label: "Medium", value: 2 },
                      { label: "Low", value: 3 },
                    ].map((priority) => (
                      <TouchableOpacity
                        key={priority.value || "all"}
                        style={[
                          styles.filterDropdownChip,
                          filterPriority === priority.value &&
                            styles.filterDropdownChipActive,
                        ]}
                        onPress={() => setFilterPriority(priority.value)}
                      >
                        <Text
                          style={[
                            styles.filterDropdownChipText,
                            filterPriority === priority.value &&
                              styles.filterDropdownChipTextActive,
                          ]}
                        >
                          {priority.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sort Options */}
                <View style={styles.filterDropdownHalfSection}>
                  <Text style={styles.filterDropdownTitle}>Sort By</Text>
                  <View style={styles.filterDropdownChips}>
                    {[
                      { label: "Recent", value: "recent" },
                      { label: "Priority", value: "priority" },
                      { label: "Duration", value: "duration" },
                      { label: "Completion", value: "completion" },
                    ].map((sort) => (
                      <TouchableOpacity
                        key={sort.value}
                        style={[
                          styles.filterDropdownChip,
                          sortBy === sort.value &&
                            styles.filterDropdownChipActive,
                        ]}
                        onPress={() => setSortBy(sort.value as any)}
                      >
                        <Text
                          style={[
                            styles.filterDropdownChipText,
                            sortBy === sort.value &&
                              styles.filterDropdownChipTextActive,
                          ]}
                        >
                          {sort.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Clear Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <TouchableOpacity
                  style={styles.filterDropdownClearButton}
                  onPress={clearAllFilters}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 71, 87, 0.2)",
                      "rgba(255, 107, 157, 0.1)",
                    ]}
                    style={styles.filterDropdownClearGradient}
                  >
                    <Icon name="refresh" size={scale(14)} color="#FF4757" />
                    <Text style={styles.filterDropdownClearText}>
                      Clear All Filters
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Calendar Dropdown */}
        {showCalendar && (
          <Animated.View
            style={[
              styles.calendarDropdownContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(30, 30, 30, 0.95)", "rgba(44, 44, 46, 0.9)"]}
              style={styles.calendarDropdownGradient}
            >
              {/* Two-week navigation */}
              <View style={styles.calendarHeaderRow}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() =>
                    setTwoWeekStartDate((prev) => {
                      const d = new Date(prev);
                      d.setDate(d.getDate() - 14);
                      return d;
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Icon name="chevron-back" size={scale(18)} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {twoWeekStartDate.toLocaleString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                  {"  ·  "}
                  {new Date(
                    twoWeekStartDate.getFullYear(),
                    twoWeekStartDate.getMonth(),
                    twoWeekStartDate.getDate() + 6
                  ).toLocaleString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() =>
                    setTwoWeekStartDate((prev) => {
                      const d = new Date(prev);
                      d.setDate(d.getDate() + 7);
                      return d;
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Icon
                    name="chevron-forward"
                    size={scale(18)}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* 14-day pager with smooth slider */}
              <View
                style={{
                  overflow: "hidden",
                  width: innerCalendarWidth,
                  alignSelf: "center",
                }}
                pointerEvents="box-none"
              >
                <ScrollView
                  ref={twoWeekScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleTwoWeekMomentumEnd}
                  bounces={false}
                  alwaysBounceHorizontal={false}
                  overScrollMode="never"
                  directionalLockEnabled
                  contentInsetAdjustmentBehavior="never"
                  contentContainerStyle={[
                    styles.twoWeekPagerContainer,
                    { width: innerCalendarWidth * 3 },
                  ]}
                  style={{ width: innerCalendarWidth }}
                >
                  <View
                    style={{ width: innerCalendarWidth }}
                    pointerEvents="box-none"
                  >
                    {renderTwoWeekPage(
                      new Date(
                        twoWeekStartDate.getFullYear(),
                        twoWeekStartDate.getMonth(),
                        twoWeekStartDate.getDate() - 7
                      )
                    )}
                  </View>
                  <View
                    style={{ width: innerCalendarWidth }}
                    pointerEvents="box-none"
                  >
                    {renderTwoWeekPage(twoWeekStartDate)}
                  </View>
                  <View
                    style={{ width: innerCalendarWidth }}
                    pointerEvents="box-none"
                  >
                    {renderTwoWeekPage(
                      new Date(
                        twoWeekStartDate.getFullYear(),
                        twoWeekStartDate.getMonth(),
                        twoWeekStartDate.getDate() + 7
                      )
                    )}
                  </View>
                </ScrollView>
              </View>

              {/* Calendar footer actions */}
              <View style={styles.calendarFooterRow}>
                <TouchableOpacity
                  style={styles.calendarFooterButton}
                  onPress={() => {
                    setSelectedCalendarDate(null);
                    setFilterDateRange({ start: null, end: null });
                    // Re-center to today on clear
                    const now = new Date();
                    alignWindowToDate(now);
                    centerTwoWeekPager();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarFooterButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarFooterButtonPrimary}
                  onPress={() => {
                    const now = new Date();
                    const day = now.getDay();
                    const daysSinceMonday = (day + 6) % 7;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - daysSinceMonday);
                    monday.setHours(0, 0, 0, 0);
                    setTwoWeekStartDate(monday);

                    const todayStr = getCurrentDate();
                    setSelectedCalendarDate(todayStr);
                    setFilterDateRange({ start: todayStr, end: todayStr });
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#00E5FF", "#9C6CDA"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.calendarFooterButtonPrimaryGradient}
                  >
                    <Text style={styles.calendarFooterButtonPrimaryText}>
                      Today
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarFooterButton}
                  onPress={() => setShowCalendar(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarFooterButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Compact Analytics Section - hidden when filter or calendar is open */}
        {!(showFilters || showCalendar) && (
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
                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.8}
                  onPress={clearAllFilters}
                  accessibilityLabel="Show all activities"
                >
                  <View
                    style={[
                      styles.compactStatIcon,
                      { backgroundColor: "rgba(176, 176, 176, 0.2)" },
                    ]}
                  >
                    <Icon
                      name="grid-outline"
                      size={scale(14)}
                      color="#B0B0B0"
                    />
                  </View>
                  <Text
                    style={[
                      styles.compactStatNumber,
                      { color: noActiveFilters ? "#FFFFFF" : "#B0B0B0" },
                    ]}
                  >
                    {stats.total}
                  </Text>
                  <Text
                    style={[
                      styles.compactStatLabel,
                      { color: noActiveFilters ? "#FFFFFF" : "#B0B0B0" },
                    ]}
                  >
                    Total
                  </Text>
                </TouchableOpacity>

                {/* Active */}
                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.8}
                  onPress={() => setFilterStatus("running")}
                  accessibilityLabel="Filter running activities"
                >
                  <View
                    style={[
                      styles.compactStatIcon,
                      { backgroundColor: "rgba(0, 229, 255, 0.2)" },
                    ]}
                  >
                    <Icon name="play-circle" size={scale(14)} color="#00E5FF" />
                  </View>
                  <Text
                    style={[
                      styles.compactStatNumber,
                      {
                        color:
                          filterStatus === "running" ? "#00E5FF" : "#B0B0B0",
                      },
                    ]}
                  >
                    {stats.running}
                  </Text>
                  <Text
                    style={[
                      styles.compactStatLabel,
                      {
                        color:
                          filterStatus === "running" ? "#00E5FF" : "#B0B0B0",
                      },
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                {/* Completed */}
                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.8}
                  onPress={() => setFilterStatus("completed")}
                  accessibilityLabel="Filter completed activities"
                >
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
                  <Text
                    style={[
                      styles.compactStatNumber,
                      {
                        color:
                          filterStatus === "completed" ? "#4ECDC4" : "#B0B0B0",
                      },
                    ]}
                  >
                    {stats.completed}
                  </Text>
                  <Text
                    style={[
                      styles.compactStatLabel,
                      {
                        color:
                          filterStatus === "completed" ? "#4ECDC4" : "#B0B0B0",
                      },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>

                {/* Success Rate */}
                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.8}
                  onPress={() => setSortBy("completion")}
                  onLongPress={() =>
                    setAnalyticsMode((m) =>
                      m === "completion" ? "time" : "completion"
                    )
                  }
                  accessibilityLabel="Sort by completion or show time spent"
                >
                  <View
                    style={[
                      styles.compactStatIcon,
                      { backgroundColor: "rgba(156, 108, 218, 0.2)" },
                    ]}
                  >
                    <Icon name="trending-up" size={scale(14)} color="#9C6CDA" />
                  </View>
                  <Text
                    style={[
                      styles.compactStatNumber,
                      {
                        color:
                          sortBy === "completion" || analyticsMode === "time"
                            ? "#9C6CDA"
                            : "#B0B0B0",
                      },
                    ]}
                  >
                    {analyticsMode === "completion"
                      ? `${stats.completionRate}%`
                      : stats.timeSpent}
                  </Text>
                  <Text
                    style={[
                      styles.compactStatLabel,
                      {
                        color:
                          sortBy === "completion" || analyticsMode === "time"
                            ? "#9C6CDA"
                            : "#B0B0B0",
                      },
                    ]}
                  >
                    {analyticsMode === "completion" ? "Success" : "Time"}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Activities List */}
        <FlatList
          data={filteredAndSortedActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          ref={(ref) => {
            listRef.current = ref;
          }}
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
          pointerEvents="box-none"
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
            onPressIn={() => {
              Animated.timing(fabPressAnim, {
                toValue: 0.96,
                duration: 100,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(fabPressAnim, {
                toValue: 1,
                tension: 120,
                friction: 8,
                useNativeDriver: true,
              }).start();
            }}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
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

            <Animated.View style={{ transform: [{ scale: fabPressAnim }] }}>
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
            </Animated.View>
          </TouchableOpacity>

          {/* FAB quick menu removed for iOS reliability */}
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

        {/* Toast Notifications */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
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
    marginBottom: scale(16),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(4),
  },
  titleButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  mainTitle: {
    fontSize: scale(32),
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    flex: 1,
  },
  floatingSearchButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingSearchGradient: {
    padding: scale(10),
    borderRadius: scale(12),
  },
  floatingFilterButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#9C6CDA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingCalendarButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingFilterGradient: {
    padding: scale(10),
    borderRadius: scale(12),
  },
  floatingCalendarGradient: {
    padding: scale(10),
    borderRadius: scale(12),
  },
  subtitle: {
    fontSize: scale(14),
    color: "#B0B0B0",
    fontWeight: "500",
    textAlign: "left",
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
    padding: scale(10),
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
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(4),
  },
  compactStatNumber: {
    fontSize: scale(16),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: scale(1),
  },
  compactStatLabel: {
    fontSize: scale(9),
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
    height: scale(130.19), // Increased by 7% from 117
  },

  // Enhanced Card Design
  cardGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardContainer: {
    flex: 1,
    padding: scale(12.6), // Reduced by 10% from 14
    justifyContent: "space-between",
  },

  // Header Row: Title, Category, and Control Button
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(9), // Reduced by 10% from 10
  },
  titleSection: {
    flex: 1,
    marginRight: scale(10.8), // Reduced by 10% from 12
  },
  activityTitle: {
    fontSize: scale(14.4), // Reduced by 10% from 16
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: scale(1.8), // Reduced by 10% from 2
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
  categoryBadgeActive: {
    backgroundColor: "rgba(156, 108, 218, 0.2)",
    borderColor: "#9C6CDA",
  },
  categoryTextActive: {
    color: "#9C6CDA",
  },

  // Priority Badge Styles (matching category badge design language)
  priorityBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    minWidth: scale(70),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginLeft: scale(6),
  },
  priorityBadgeActive: {
    backgroundColor: "rgba(156, 108, 218, 0.2)",
    borderColor: "#9C6CDA",
  },
  priorityBadgeText: {
    fontSize: scale(9),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  priorityBadgeTextActive: {
    color: "#FFFFFF",
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
    marginBottom: scale(9), // Reduced by 10% from 10
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
    fontSize: scale(18), // Reduced by 10% from 20
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  timerLabel: {
    fontSize: scale(9), // Reduced by 10% from 10
    fontWeight: "500",
    color: "#B0B0B0",
    marginTop: scale(0.9), // Reduced by 10% from 1
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
    fontSize: scale(12.6), // Reduced by 10% from 14
    fontWeight: "700",
    color: "#4ECDC4",
    marginLeft: scale(5.4), // Reduced by 10% from 6
  },
  // Streak Components
  streakContainer: {
    marginTop: scale(3.6), // Reduced by 10% from 4
  },
  streakLabel: {
    fontSize: scale(8.1), // Reduced by 10% from 9
    fontWeight: "600",
    color: "#B0B0B0",
    marginBottom: scale(1.8), // Reduced by 10% from 2
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
    marginTop: scale(5.4), // Reduced by 10% from 6
    alignItems: "flex-end",
  },
  runningStreakLabel: {
    fontSize: scale(6.3), // Reduced by 10% from 7
    fontWeight: "600",
    color: "#00E5FF",
    marginBottom: scale(0.9), // Reduced by 10% from 1
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
    fontSize: scale(10.8), // Reduced by 10% from 12
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: scale(3.6), // Reduced by 10% from 4
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
    fontSize: scale(9), // Reduced by 10% from 10
    fontWeight: "700",
    color: "#FFFFFF",
    minWidth: scale(27), // Reduced by 10% from 30
    textAlign: "right",
  },

  // Control Section
  controlSection: {
    alignItems: "center",
  },
  controlButton: {
    width: scale(32.4), // Reduced by 10% from 36
    height: scale(32.4), // Reduced by 10% from 36
    borderRadius: scale(16.2), // Reduced by 10% from 18
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
    width: scale(32.4), // Reduced by 10% from 36
    height: scale(32.4), // Reduced by 10% from 36
    justifyContent: "center",
    alignItems: "center",
  },
  futureButton: {
    width: scale(32.4), // Reduced by 10% from 36
    height: scale(32.4), // Reduced by 10% from 36
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(16.2), // Reduced by 10% from 18
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
    zIndex: 2000,
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
    zIndex: 2001,
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#151515",
  },
  fabIcon: {
    textShadowColor: "#00E5FF",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    // iOS rendering fix for crisp icon edges
    backgroundColor: "transparent",
  },

  // (Removed) FAB Quick Menu styles retained no longer needed

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

  // Filter Dropdown Styles
  filterDropdownContainer: {
    marginHorizontal: scale(20),
    marginBottom: scale(16),
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterDropdownGradient: {
    padding: scale(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  // Calendar Dropdown Styles
  calendarDropdownContainer: {
    marginHorizontal: scale(20),
    marginBottom: scale(16),
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calendarDropdownGradient: {
    padding: scale(16),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  calendarNavButton: {
    padding: scale(6),
    borderRadius: scale(8),
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  calendarMonthTitle: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "700",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(6),
    paddingHorizontal: scale(4),
  },
  calendarWeekLabel: {
    width: (width - scale(20) * 2 - scale(16)) / 7,
    textAlign: "center",
    color: "#B0B0B0",
    fontSize: scale(10),
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(2),
    marginBottom: scale(8),
  },
  twoWeekGradient: {
    borderRadius: scale(12),
    padding: scale(6),
    marginBottom: scale(8),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  twoWeekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: scale(8),
  },
  twoWeekPagerContainer: {
    paddingVertical: scale(2),
  },
  calendarCell: {
    width: (width - scale(20) * 2 - scale(16)) / 7,
    height: (width - scale(20) * 2 - scale(16)) / 7,
    borderRadius: (width - scale(20) * 2 - scale(16)) / 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  twoWeekCell: {
    width: (width - scale(20) * 2 - scale(10)) / 14,
    height: scale(44),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  twoWeekDayLabel: {
    color: "#B0B0B0",
    fontSize: scale(9),
    marginBottom: scale(2),
    fontWeight: "600",
  },
  calendarCellEmpty: {
    width: (width - scale(20) * 2 - scale(16)) / 7,
    height: (width - scale(20) * 2 - scale(16)) / 7,
  },
  calendarCellToday: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  calendarCellSelected: {
    backgroundColor: "#2D5A27",
    borderColor: "#4ECDC4",
  },
  calendarCellText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: scale(12),
  },
  calendarCellTextSelected: {
    color: "#A8E6CF",
  },
  calendarFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(6),
  },
  calendarFooterButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  calendarFooterButtonPrimary: {
    borderRadius: scale(8),
    overflow: "hidden",
  },
  calendarFooterButtonPrimaryGradient: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(8),
  },
  calendarFooterButtonPrimaryText: {
    color: "#000",
    fontWeight: "800",
    fontSize: scale(12),
  },
  calendarFooterButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: scale(12),
  },
  filterDropdownSection: {
    marginBottom: scale(16),
  },
  filterDropdownHalfSection: {
    flex: 1,
    marginBottom: scale(16),
  },
  filterDropdownRow: {
    flexDirection: "row",
    gap: scale(16),
  },
  filterDropdownTitle: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: scale(8),
  },
  filterDropdownChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  filterDropdownChip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  filterDropdownChipActive: {
    backgroundColor: "rgba(156, 108, 218, 0.2)",
    borderColor: "#9C6CDA",
  },
  filterDropdownChipText: {
    fontSize: scale(11),
    fontWeight: "500",
    color: "#B0B0B0",
  },
  filterDropdownChipTextActive: {
    color: "#9C6CDA",
    fontWeight: "600",
  },
  filterDropdownClearButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    marginTop: scale(8),
  },
  filterDropdownClearGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
  },
  filterDropdownClearText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#FF4757",
    marginLeft: scale(8),
  },

  // Inline Search Styles
  searchExpandedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  searchExpandedInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginRight: scale(12),
  },
  searchExpandedInput: {
    flex: 1,
    fontSize: scale(16),
    color: "#FFFFFF",
    marginLeft: scale(12),
  },
  searchExpandedClearButton: {
    padding: scale(4),
  },
  searchExpandedCloseButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Date Range Display
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(3.6), // Reduced by 10% from 4
  },
  dateRangeText: {
    fontSize: scale(9), // Reduced by 10% from 10
    fontWeight: "500",
    color: "#B0B0B0",
    marginRight: scale(3.6), // Reduced by 10% from 4
  },

  // Past Section
  pastSection: {
    marginTop: scale(4),
  },
  pastLabel: {
    fontSize: scale(10),
    fontWeight: "600",
    color: "#FF4757",
    marginBottom: scale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pastDate: {
    fontSize: scale(8),
    fontWeight: "500",
    color: "#B0B0B0",
    marginBottom: scale(2),
  },
  pastStreakContainer: {
    marginTop: scale(4),
  },
  pastStreakLabel: {
    fontSize: scale(8),
    fontWeight: "600",
    color: "#FFD700",
    marginBottom: scale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pastStreakStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },

  // Current Date Section
  currentDateSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentDateText: {
    fontSize: scale(8), // Reduced for inline display
    fontWeight: "500",
    color: "#B0B0B0",
    marginLeft: scale(2),
  },

  // Past Button
  pastButton: {
    width: scale(32.4), // Reduced by 10% from 36
    height: scale(32.4), // Reduced by 10% from 36
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(16.2), // Reduced by 10% from 18
  },

  // Footer Right Section
  footerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },

  // Inline Streak Container
  inlineStreakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },

  // Inline Streak Text
  inlineStreakText: {
    fontSize: scale(8),
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Card Title Row (for activity cards)
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  // Separator
  separator: {
    fontSize: scale(14.4),
    fontWeight: "400",
    color: "#B0B0B0",
    marginHorizontal: scale(4),
  },

  // Priority Text
  priorityText: {
    fontSize: scale(10),
    fontWeight: "500",
    letterSpacing: 0.3,
    fontStyle: "italic",
    textTransform: "uppercase",
  },
});

export default ActivityScreen;
