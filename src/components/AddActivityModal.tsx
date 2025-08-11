import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  FlatList,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity, Category } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import StyledText from "../components/StyledText";
import { useAppContext } from "../context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchCategories as fetchTagCategories,
  fetchPriorities as fetchTagPriorities,
  TagApiItem,
} from "../tag/api/tagService";
import {
  createActivityWithFrequency,
  type CreateActivityApiPayload,
  type FrequencyTypeApi,
} from "../screens/activity/api/activityService";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parse,
} from "date-fns";

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: (activity: Partial<Activity>) => void;
  onUpdate?: (activity: Partial<Activity>) => void;
  mode?: "create" | "edit";
  initialActivity?: Partial<Activity>;
}

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isTablet = width >= 768;
const isMobileDevice = width < 768;

// Responsive scaling
const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.85;
  return size;
};

// Grid sizing for uniform 7-column day layout inside the frequency card
const DAY_COLS = 7;
const CHIP_GAP = scale(8);
const CONTENT_HPAD = scale(20);
const CARD_HPAD = scale(14);
const DAY_CHIP_SIZE = Math.floor(
  (width - (CONTENT_HPAD + CARD_HPAD) * 2 - CHIP_GAP * (DAY_COLS - 1)) /
    DAY_COLS
);
// Calendar grid sizing for popup
const CAL_COLS = 7;
const CAL_GAP = scale(6);
const CAL_CONTENT_HPAD = scale(20);
const CAL_CARD_HPAD = scale(16);
const CAL_CELL_SIZE = Math.floor(
  (width - (CAL_CONTENT_HPAD + CAL_CARD_HPAD) * 2 - CAL_GAP * (CAL_COLS - 1)) /
    CAL_COLS
);

// Safe area estimates (without extra lib)
const SAFE_AREA_BOTTOM = Platform.OS === "ios" ? 34 : 0;
const SAFE_AREA_TOP = Platform.OS === "ios" ? 44 : 0;
// Fixed footer height for bottom action bar
const FOOTER_HEIGHT = scale(72) + SAFE_AREA_BOTTOM;

// Theme colors
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
  border: "rgba(255, 255, 255, 0.1)",
};

// Enhanced color palette for horizontal slider
const ACTIVITY_COLORS = [
  "#00E5FF",
  "#9C6CDA",
  "#4ECDC4",
  "#FF9500",
  "#FF4757",
  "#FF6B9D",
  "#FFD93D",
  "#6C5CE7",
  "#1E88E5",
  "#8E24AA",
  "#43A047",
  "#FB8C00",
  "#E91E63",
  "#00ACC1",
  "#F44336",
  "#2196F3",
  "#009688",
  "#4CAF50",
  "#FFC107",
  "#9C27B0",
  "#FF5722",
  "#673AB7",
  "#03A9F4",
  "#8BC34A",
];

// Removed legacy static CATEGORIES (Category is now fetched in Tag card)

const AddActivityModal: React.FC<AddActivityModalProps> = ({
  visible,
  onClose,
  onAdd,
  onUpdate,
  mode = "create",
  initialActivity,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Tag selections & data
  const [tagPriorities, setTagPriorities] = useState<TagApiItem[]>([]);
  const [tagCategories, setTagCategories] = useState<TagApiItem[]>([]);
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [tagLoading, setTagLoading] = useState<boolean>(true);
  const tagShimmer = useRef(new Animated.Value(0)).current;

  // Form state
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: "",
    category: "Personal",
    startDate: "",
    endDate: "",
    color: ACTIVITY_COLORS[0],
    duration: "01:00:00",
  });

  // Modal states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Duration picker states
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Frequency states
  type Frequency = "oneTime" | "daily" | "weekly" | "monthly";
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const MONTHS_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [weeklyStartDay, setWeeklyStartDay] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [rangeVisible, setRangeVisible] = useState(false);
  const rangeAnim = useRef(new Animated.Value(0)).current;
  // Multi-select additions
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  // (computed globally now)

  // Calendar modal state (monthly popup)
  type CalendarTarget = "single" | "start" | "end";
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget>("start");
  const [calendarTitle, setCalendarTitle] = useState<string>("Select Date");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Weekly selection popup state
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const weeklySheetY = useRef(new Animated.Value(40)).current;
  const weeklySheetOpacity = useRef(new Animated.Value(0)).current;

  // Monthly selection popup state
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const monthlySheetY = useRef(new Animated.Value(40)).current;
  const monthlySheetOpacity = useRef(new Animated.Value(0)).current;

  // No need for dynamic height calculation with fixed layout approach
  const calendarTransX = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  const calendarSheetY = useRef(new Animated.Value(40)).current;
  const calendarSheetOpacity = useRef(new Animated.Value(0)).current;
  const [rangePreviewDate, setRangePreviewDate] = useState<Date | null>(null);
  const animateMonthChange = useCallback(
    (direction: 1 | -1) => {
      Animated.parallel([
        Animated.timing(calendarTransX, {
          toValue: -40 * direction,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        const d = new Date(calendarMonth);
        d.setMonth(d.getMonth() + direction);
        setCalendarMonth(d);
        calendarTransX.setValue(40 * direction);
        calendarOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(calendarTransX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(calendarOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [calendarMonth]
  );
  // Animate sheet on open/close
  React.useEffect(() => {
    if (showCalendarModal) {
      calendarSheetY.setValue(40);
      calendarSheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(calendarSheetY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(calendarSheetOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCalendarModal]);

  // Animate weekly popup
  React.useEffect(() => {
    if (showWeeklyModal) {
      weeklySheetY.setValue(40);
      weeklySheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(weeklySheetY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(weeklySheetOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showWeeklyModal]);

  // Animate monthly popup
  React.useEffect(() => {
    if (showMonthlyModal) {
      monthlySheetY.setValue(40);
      monthlySheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(monthlySheetY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(monthlySheetOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showMonthlyModal]);

  // Range visibility is now handled by the fixed layout approach

  // Date picker states
  const currentDate = new Date();
  const [startDateObj, setStartDateObj] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    day: currentDate.getDate(),
  });

  const [endDateObj, setEndDateObj] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    day: currentDate.getDate(),
  });

  // Get context
  const {} = useAppContext();

  // Duration picker arrays
  const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
  const seconds = Array.from({ length: 60 }, (_, i) => i); // 0-59

  // Animation when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      // Initialize form for edit mode with provided initial activity
      if (mode === "edit" && initialActivity) {
        setNewActivity((prev) => ({
          ...prev,
          ...initialActivity,
        }));
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Start button pulse animation
      const pulseAnimation = () => {
        Animated.sequence([
          Animated.timing(buttonPulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) pulseAnimation();
        });
      };
      pulseAnimation();

      // Load Tag data (priorities and categories)
      (async () => {
        try {
          setTagLoading(true);
          const token = (await AsyncStorage.getItem("accessToken")) || "";
          const [priorities, categories] = await Promise.all([
            fetchTagPriorities(token),
            fetchTagCategories(token),
          ]);
          setTagPriorities(priorities);
          setTagCategories(categories);
        } catch (e) {
          // fail silently for now
        } finally {
          setTagLoading(false);
        }
      })();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        resetForm();
      });
    }
  }, [visible]);

  // Shimmer animation for Tag skeleton
  React.useEffect(() => {
    if (!tagLoading) return;
    tagShimmer.setValue(0);
    const loop = Animated.loop(
      Animated.timing(tagShimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [tagLoading]);

  const hexToRgba = useCallback((hex: string, opacity: number) => {
    let c = hex.replace("#", "");
    if (c.length === 3) {
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const bigint = parseInt(c, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, []);

  // Helper functions
  const resetForm = useCallback(() => {
    setNewActivity({
      title: "",
      category: "Personal",
      startDate: "",
      endDate: "",
      color: ACTIVITY_COLORS[0],
      duration: "01:00:00",
    });
    setErrors({});
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setShowDurationPicker(false);
    setDurationHours(1);
    setDurationMinutes(0);
    setDurationSeconds(0);
    setFrequency("daily");
    setWeeklyStartDay(WEEK_DAYS[0]);
    setSelectedMonth(new Date().getMonth() + 1);
    setShowCalendarModal(false);
    setCalendarTarget("start");
    setCalendarTitle("Select Date");
    setCalendarMonth(new Date());
    setShowWeeklyModal(false);
    setShowMonthlyModal(false);
  }, []);

  const formatDate = (dateObj: {
    year: number;
    month: number;
    day: number;
  }) => {
    return `${dateObj.year}/${String(dateObj.month).padStart(2, "0")}/${String(
      dateObj.day
    ).padStart(2, "0")}`;
  };

  const formatDuration = (h: number, m: number, s: number) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const parseDuration = (duration: string) => {
    const parts = duration.split(":");
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0,
    };
  };

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!newActivity.title?.trim()) {
      newErrors.title = "Title required";
    }
    if (!frequency) {
      newErrors.frequency = "Select frequency";
    }

    if (!newActivity.startDate) {
      newErrors.startDate = "Start date required";
    }

    // For one-time, end date can mirror start date automatically
    if (frequency !== "oneTime" && !newActivity.endDate) {
      newErrors.endDate = "End date required";
    }

    if (!newActivity.duration) {
      newErrors.duration = "Duration required";
    } else if (newActivity.duration === "00:00:00") {
      newErrors.duration = "Duration cannot be 00:00:00";
    }

    // Tag validations
    if (!selectedPriorityId) {
      newErrors.priority = "Select priority";
    }
    if (!selectedCategoryId) {
      newErrors.category = "Select category";
    }

    // Frequency-specific validation
    if (frequency === "weekly") {
      if (selectedWeekdays.length === 0) {
        newErrors.weeklyDays = "Select at least one day";
      }
    }
    if (frequency === "monthly") {
      if (selectedMonths.length === 0) {
        newErrors.months = "Select at least one month";
      }
      if (selectedMonths.length > 0 && selectedMonthDays.length === 0) {
        newErrors.monthDays = "Select at least one day";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    newActivity,
    frequency,
    selectedWeekdays,
    selectedMonths,
    selectedMonthDays,
    selectedPriorityId,
    selectedCategoryId,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // Build frequency payload per API spec
      const typeMap: Record<
        NonNullable<Frequency>,
        { apiType: FrequencyTypeApi; typeId: 1 | 2 | 3 | 4 }
      > = {
        oneTime: { apiType: "one_time", typeId: 1 },
        daily: { apiType: "daily", typeId: 2 },
        weekly: { apiType: "weekly", typeId: 3 },
        monthly: { apiType: "monthly", typeId: 4 },
      };

      const mapDayNameToApiNumber = (dayName: string): number => {
        switch (dayName) {
          case "Monday":
            return 1;
          case "Tuesday":
            return 2;
          case "Wednesday":
            return 3;
          case "Thursday":
            return 4;
          case "Friday":
            return 5;
          case "Saturday":
            return 6;
          case "Sunday":
            return 7;
          default:
            return 1;
        }
      };

      const start_date = newActivity.startDate as string;
      const end_date =
        frequency === "oneTime"
          ? null
          : (newActivity.endDate as string) || null;

      const baseFrequency = {
        type: typeMap[frequency as NonNullable<Frequency>].apiType,
        type_id: typeMap[frequency as NonNullable<Frequency>].typeId,
        start_date,
        end_date,
        duration: (newActivity.duration as string) || "01:00:00",
      } as any;

      if (frequency === "weekly") {
        baseFrequency.days_list = selectedWeekdays.map(mapDayNameToApiNumber);
      }
      if (frequency === "monthly") {
        baseFrequency.month_list = selectedMonths;
        baseFrequency.date_list = selectedMonthDays;
      }

      const payload: CreateActivityApiPayload = {
        title: (newActivity.title as string) || "",
        category_id: selectedCategoryId as string,
        frequency: baseFrequency,
        tag: {
          category_id: selectedCategoryId as string,
          priority_id: selectedPriorityId as string,
        },
        color: (newActivity.color as string) || "#00E5FF",
      };

      const response = await createActivityWithFrequency(payload);

      // If API call succeeds, keep existing UI flow
      if (mode === "edit" && onUpdate) {
        onUpdate(newActivity);
      } else if (onAdd) {
        onAdd(newActivity);
      }
      onClose();
    } catch (error) {
      console.error("Failed to submit activity:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mode, newActivity, onAdd, onUpdate, onClose, validateForm]);

  // Date picker functions
  const confirmStartDate = useCallback(() => {
    const formattedDate = formatDate(startDateObj);
    setNewActivity((prev) => ({ ...prev, startDate: formattedDate }));
    setShowStartDatePicker(false);
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: "" }));
    }
  }, [startDateObj, errors.startDate]);

  const confirmEndDate = useCallback(() => {
    const formattedDate = formatDate(endDateObj);
    setNewActivity((prev) => ({ ...prev, endDate: formattedDate }));
    setShowEndDatePicker(false);
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: "" }));
    }
  }, [endDateObj, errors.endDate]);

  // Duration picker functions
  const confirmDuration = useCallback(() => {
    const formattedDuration = formatDuration(
      durationHours,
      durationMinutes,
      durationSeconds
    );
    setNewActivity((prev) => ({ ...prev, duration: formattedDuration }));
    setShowDurationPicker(false);
    if (errors.duration) {
      setErrors((prev) => ({ ...prev, duration: "" }));
    }
  }, [durationHours, durationMinutes, durationSeconds, errors.duration]);

  // Initialize duration picker when opened
  React.useEffect(() => {
    if (showDurationPicker && newActivity.duration) {
      const parsed = parseDuration(newActivity.duration);
      setDurationHours(parsed.hours);
      setDurationMinutes(parsed.minutes);
      setDurationSeconds(parsed.seconds);
    }
  }, [showDurationPicker, newActivity.duration]);

  // Generate date options
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Helpers for calendar formatting
  const formatDateFromDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  };
  const parseYmdToDate = (ymd?: string): Date | null => {
    if (!ymd) return null;
    const parts = ymd.split("/").map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [yy, mm, dd] = parts;
    return new Date(yy, mm - 1, dd, 0, 0, 0, 0);
  };

  const openCalendar = useCallback(
    (target: CalendarTarget, title: string) => {
      setCalendarTarget(target);
      setCalendarTitle(title);
      // Initialize calendar month near current selection if present
      const refDateStr =
        target === "single"
          ? newActivity.startDate || newActivity.endDate
          : target === "start"
          ? newActivity.startDate
          : newActivity.endDate;
      if (refDateStr) {
        const [yy, mm, dd] = refDateStr.split("/").map((p) => parseInt(p, 10));
        if (yy && mm && dd) {
          setCalendarMonth(new Date(yy, mm - 1, 1));
        } else {
          setCalendarMonth(new Date());
        }
      } else {
        setCalendarMonth(new Date());
      }
      setShowCalendarModal(true);
    },
    [newActivity.startDate, newActivity.endDate]
  );

  const handleCalendarSelect = useCallback(
    (date: Date) => {
      // Only allow today or future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      );
      // For visual preview when selecting end date, store hovered/selected
      if (calendarTarget === "end") {
        setRangePreviewDate(picked);
      } else {
        setRangePreviewDate(null);
      }
      if (picked < today) {
        const errText = "Select a future date";
        if (calendarTarget === "end")
          setErrors((prev) => ({ ...prev, endDate: errText }));
        else setErrors((prev) => ({ ...prev, startDate: errText }));
        return;
      }

      const formatted = formatDateFromDate(picked);

      if (calendarTarget === "single") {
        setNewActivity((prev) => ({
          ...prev,
          startDate: formatted,
          endDate: formatted,
        }));
        setErrors((prev) => ({ ...prev, startDate: "", endDate: "" }));
        setShowCalendarModal(false);
        return;
      }

      if (calendarTarget === "start") {
        const end = parseYmdToDate(newActivity.endDate);
        if (end && picked >= end) {
          setErrors((prev) => ({
            ...prev,
            startDate: "Start date must be before end date",
          }));
          return;
        }
        setNewActivity((prev) => ({ ...prev, startDate: formatted }));
      } else {
        const start = parseYmdToDate(newActivity.startDate);
        if (start && picked <= start) {
          setErrors((prev) => ({
            ...prev,
            endDate: "End date must be after start date",
          }));
          return;
        }
        setNewActivity((prev) => ({ ...prev, endDate: formatted }));
      }

      setShowCalendarModal(false);
      setErrors((prev) => ({ ...prev, startDate: "", endDate: "" }));

      if (frequency && frequency !== "oneTime" && !rangeVisible) {
        setRangeVisible(true);
        Animated.timing(rangeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [calendarTarget, frequency, rangeVisible]
  );

  // Minimal, consistent duration picker (iOS-like wheels)
  const ITEM_HEIGHT = scale(36);
  const VISIBLE_ROWS = 5;
  const PAD_TOP_BOTTOM = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;

  const Wheel: React.FC<{
    data: number[];
    selected: number;
    onSelect: (val: number) => void;
  }> = ({ data, selected, onSelect }) => {
    const listRef = React.useRef<FlatList<number>>(null);
    const currentYRef = React.useRef<number>(0);
    const LOOPS = 40;
    const looped = React.useMemo(
      () =>
        Array.from(
          { length: data.length * LOOPS },
          (_, i) => data[i % data.length]
        ),
      [data]
    );
    const middleCycleStart = Math.floor(LOOPS / 2) * data.length;
    const middleIndexForSelected = middleCycleStart + selected;
    const initialOffset = middleIndexForSelected * ITEM_HEIGHT - PAD_TOP_BOTTOM;

    React.useEffect(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: initialOffset,
          animated: false,
        });
        currentYRef.current = initialOffset;
      });
    }, [initialOffset]);

    const updateByOffset = (y: number) => {
      const index = Math.round((y + PAD_TOP_BOTTOM) / ITEM_HEIGHT);
      const value = looped[index % looped.length];
      if (typeof value === "number") onSelect(value);
    };

    return (
      <FlatList
        ref={listRef}
        data={looped}
        keyExtractor={(_, i) => String(i)}
        style={styles.wheelList}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onScroll={(e) => {
          currentYRef.current = e.nativeEvent.contentOffset.y;
        }}
        onMomentumScrollEnd={(e) =>
          updateByOffset(e.nativeEvent.contentOffset.y)
        }
        onScrollEndDrag={(e) => updateByOffset(e.nativeEvent.contentOffset.y)}
        renderItem={({ item }) => {
          const isSelected = typeof item === "number" && item === selected;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (typeof item !== "number") return;
                const y = currentYRef.current;
                const currentIndex = Math.round(
                  (y + PAD_TOP_BOTTOM) / ITEM_HEIGHT
                );
                const cycleStart = currentIndex - (currentIndex % data.length);
                const targetIndex = cycleStart + item;
                const offset = targetIndex * ITEM_HEIGHT - PAD_TOP_BOTTOM;
                listRef.current?.scrollToOffset({ offset, animated: true });
                onSelect(item);
              }}
            >
              <View
                style={[
                  styles.wheelItemContainer,
                  isSelected && styles.wheelItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.wheelItemText,
                    isSelected && styles.wheelItemTextSelected,
                  ]}
                >
                  {typeof item === "number"
                    ? String(item).padStart(2, "0")
                    : ""}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{
          paddingTop: PAD_TOP_BOTTOM,
          paddingBottom: PAD_TOP_BOTTOM,
        }}
      />
    );
  };

  const renderDurationPicker = useCallback(
    () => (
      <View style={styles.durationPickerModal}>
        <TouchableWithoutFeedback onPress={() => setShowDurationPicker(false)}>
          <View style={styles.durationPickerOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.durationCardContainer}>
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
            style={styles.durationCard}
          >
            <View style={styles.durationHeader}>
              <View style={styles.durationHeaderLeft}>
                <View style={styles.durationHeaderIconWrap}>
                  <LinearGradient
                    colors={[ThemeColors.primary, ThemeColors.secondary]}
                    style={styles.durationHeaderIcon}
                  >
                    <Icon name="time" size={scale(20)} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.durationTitle}>Select Duration</Text>
                  <Text style={styles.durationSubtitle}>
                    Hours • Minutes • Seconds
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowDurationPicker(false)}
                style={styles.durationCloseBtn}
                activeOpacity={0.7}
              >
                <Icon
                  name="close"
                  size={scale(18)}
                  color={ThemeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.wheelsRow}>
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel}>Hours</Text>
                <View style={styles.wheelViewport}>
                  <Wheel
                    data={hours}
                    selected={durationHours}
                    onSelect={setDurationHours}
                  />
                </View>
              </View>
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel}>Minutes</Text>
                <View style={styles.wheelViewport}>
                  <Wheel
                    data={minutes}
                    selected={durationMinutes}
                    onSelect={setDurationMinutes}
                  />
                </View>
              </View>
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel}>Seconds</Text>
                <View style={styles.wheelViewport}>
                  <Wheel
                    data={seconds}
                    selected={durationSeconds}
                    onSelect={setDurationSeconds}
                  />
                </View>
              </View>
            </View>

            <View style={styles.durationDisplayWrap}>
              <LinearGradient
                colors={[
                  "rgba(0, 229, 255, 0.15)",
                  "rgba(156, 108, 218, 0.15)",
                ]}
                style={styles.durationDisplay}
              >
                <Text style={styles.durationDisplayText}>
                  {formatDuration(
                    durationHours,
                    durationMinutes,
                    durationSeconds
                  )}
                </Text>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.durationConfirmBtn}
              onPress={confirmDuration}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[ThemeColors.success, "#44A08D"]}
                style={styles.durationConfirmGradient}
              >
                <Text style={styles.durationConfirmText}>Confirm Duration</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    ),
    [durationHours, durationMinutes, durationSeconds, confirmDuration]
  );

  // Enhanced compact date picker
  const renderCompactDatePicker = useCallback(
    (
      isStartDate: boolean,
      dateObj: { year: number; month: number; day: number },
      setDateObj: (obj: { year: number; month: number; day: number }) => void,
      onConfirm: () => void,
      onClose: () => void
    ) => (
      <View style={styles.compactDatePickerModal}>
        <View style={styles.compactDatePickerOverlay}>
          <View style={styles.enhancedDatePickerContainer}>
            <LinearGradient
              colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
              style={styles.enhancedDatePickerGradient}
            >
              {/* Enhanced Date Picker Header */}
              <View style={styles.enhancedDatePickerHeader}>
                <View style={styles.enhancedDatePickerHeaderContent}>
                  <View style={styles.enhancedDatePickerIconContainer}>
                    <LinearGradient
                      colors={[ThemeColors.primary, ThemeColors.secondary]}
                      style={styles.enhancedDatePickerIconGradient}
                    >
                      <Icon name="calendar" size={scale(20)} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View>
                    <Text style={styles.enhancedDatePickerTitle}>
                      {isStartDate ? "Start Date" : "End Date"}
                    </Text>
                    <Text style={styles.enhancedDatePickerSubtitle}>
                      Choose activity {isStartDate ? "start" : "end"} date
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.enhancedDatePickerClose}
                >
                  <Icon
                    name="close"
                    size={scale(18)}
                    color={ThemeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.enhancedDatePickerContent}>
                <View style={styles.enhancedDatePickerColumns}>
                  {/* Year Column */}
                  <View style={styles.enhancedDatePickerColumn}>
                    <Text style={styles.enhancedDateColumnLabel}>Year</Text>
                    <ScrollView
                      style={styles.enhancedDateColumnScroll}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.enhancedDateScrollContent}
                    >
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.enhancedDatePickerItem,
                            dateObj.year === year &&
                              styles.enhancedDatePickerItemSelected,
                          ]}
                          onPress={() => setDateObj({ ...dateObj, year })}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.enhancedDatePickerItemText,
                              dateObj.year === year &&
                                styles.enhancedDatePickerItemTextSelected,
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month Column */}
                  <View style={styles.enhancedDatePickerColumn}>
                    <Text style={styles.enhancedDateColumnLabel}>Month</Text>
                    <ScrollView
                      style={styles.enhancedDateColumnScroll}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.enhancedDateScrollContent}
                    >
                      {months.map((month) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.enhancedDatePickerItem,
                            dateObj.month === month &&
                              styles.enhancedDatePickerItemSelected,
                          ]}
                          onPress={() => setDateObj({ ...dateObj, month })}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.enhancedDatePickerItemText,
                              dateObj.month === month &&
                                styles.enhancedDatePickerItemTextSelected,
                            ]}
                          >
                            {String(month).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Day Column */}
                  <View style={styles.enhancedDatePickerColumn}>
                    <Text style={styles.enhancedDateColumnLabel}>Day</Text>
                    <ScrollView
                      style={styles.enhancedDateColumnScroll}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.enhancedDateScrollContent}
                    >
                      {days.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.enhancedDatePickerItem,
                            dateObj.day === day &&
                              styles.enhancedDatePickerItemSelected,
                          ]}
                          onPress={() => setDateObj({ ...dateObj, day })}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.enhancedDatePickerItemText,
                              dateObj.day === day &&
                                styles.enhancedDatePickerItemTextSelected,
                            ]}
                          >
                            {String(day).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Enhanced Date Confirm Button */}
                <TouchableOpacity
                  style={styles.enhancedDatePickerConfirmButton}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ThemeColors.primary, ThemeColors.secondary]}
                    style={styles.enhancedDatePickerConfirmGradient}
                  >
                    <Icon
                      name="checkmark-circle"
                      size={scale(18)}
                      color="#fff"
                    />
                    <Text style={styles.enhancedDatePickerConfirmText}>
                      Confirm Date
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    ),
    []
  );

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.compactModalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
            style={styles.compactModalGradient}
          >
            {/* Header wrapped in SafeArea (iOS) */}
            <SafeAreaView edges={["top"]}>
              {/* Compact Header (fixed) */}
              <View style={styles.compactModalHeader}>
                <View style={styles.compactHeaderLeft}>
                  <View style={styles.compactHeaderIcon}>
                    <Icon
                      name={mode === "edit" ? "create" : "add-circle"}
                      size={scale(20)}
                      color={ThemeColors.primary}
                    />
                  </View>
                  <Text style={styles.compactModalTitle}>
                    {mode === "edit" ? "Edit Activity" : "Add Activity"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.compactCloseButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="close"
                    size={scale(18)}
                    color={ThemeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* Compact Content (scrollable only content) */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
              <ScrollView
                style={styles.compactScrollView}
                contentContainerStyle={styles.compactScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={true}
                overScrollMode="never"
                nestedScrollEnabled
                contentInset={{ bottom: FOOTER_HEIGHT + scale(8) }} // Extra inset for dynamic content
                scrollIndicatorInsets={{ bottom: FOOTER_HEIGHT + scale(8) }}
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="automatic"
                // Ensure proper scrolling on all devices with dynamic content
                alwaysBounceVertical={false}
                removeClippedSubviews={false}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                  autoscrollToTopThreshold: 10,
                }}
              >
                {/* Title Input - Compact */}
                <View style={styles.compactFormGroup}>
                  <Text style={styles.compactFormLabel}>Activity Title</Text>
                  <View
                    style={[
                      styles.compactInputContainer,
                      errors.title && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={[styles.compactInput, { fontSize: scale(14) }]}
                      placeholder="Enter activity title"
                      placeholderTextColor={ThemeColors.textTertiary}
                      value={newActivity.title}
                      onChangeText={(text) => {
                        setNewActivity((prev) => ({ ...prev, title: text }));
                        if (errors.title) {
                          setErrors((prev) => ({ ...prev, title: "" }));
                        }
                      }}
                      maxLength={40}
                    />
                    <Icon
                      name="create-outline"
                      size={scale(16)}
                      color={ThemeColors.textSecondary}
                    />
                  </View>
                  {errors.title && (
                    <Text style={styles.compactErrorText}>{errors.title}</Text>
                  )}
                </View>

                {/* Removed legacy Category selector (now handled in Tag card) */}

                {/* Frequency Card Section */}
                <View style={styles.compactFormGroup}>
                  <LinearGradient
                    colors={[
                      "rgba(30, 30, 30, 0.98)",
                      "rgba(44, 44, 46, 0.95)",
                    ]}
                    style={styles.frequencyCard}
                  >
                    <View style={styles.frequencyHeaderRow}>
                      <Text style={styles.compactFormLabel}>Frequency</Text>
                      {!!errors.frequency && (
                        <Text style={styles.compactErrorText}>
                          {errors.frequency}
                        </Text>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectorChipsContent}
                      style={styles.selectorChips}
                    >
                      {[
                        {
                          id: "oneTime" as Frequency,
                          label: "One-Time",
                          icon: "calendar",
                        },
                        {
                          id: "daily" as Frequency,
                          label: "Daily",
                          icon: "repeat",
                        },
                        {
                          id: "weekly" as Frequency,
                          label: "Weekly",
                          icon: "calendar-outline",
                        },
                        {
                          id: "monthly" as Frequency,
                          label: "Monthly",
                          icon: "calendar",
                        },
                      ].map((opt, index, arr) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.selectorChipItem,
                            frequency === opt.id &&
                              styles.selectorChipItemSelected,
                            {
                              marginRight:
                                index === arr.length - 1
                                  ? scale(20)
                                  : scale(12),
                            },
                          ]}
                          onPress={() => {
                            setErrors((prev) => ({ ...prev, frequency: "" }));
                            setNewActivity((prev) => ({
                              ...prev,
                              startDate: "",
                              endDate: "",
                            }));
                            setWeeklyStartDay(null);
                            setSelectedMonth(null);
                            // Clear any previous frequency-specific selections
                            setSelectedWeekdays([]);
                            setSelectedMonths([]);
                            setSelectedMonthDays([]);
                            setShowWeeklyModal(false);
                            setShowMonthlyModal(false);
                            setErrors((prev) => ({
                              ...prev,
                              weeklyDays: "",
                              months: "",
                              monthDays: "",
                            }));
                            const next = frequency === opt.id ? null : opt.id;
                            setFrequency(next);
                            // collapse range until sub-selection is made
                            setRangeVisible(false);
                            rangeAnim.setValue(0);
                            // Daily should expose range immediately
                            if (next === "daily") {
                              setRangeVisible(true);
                              Animated.timing(rangeAnim, {
                                toValue: 1,
                                duration: 200,
                                useNativeDriver: true,
                              }).start();
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[
                              "rgba(255, 255, 255, 0.08)",
                              "rgba(255, 255, 255, 0.04)",
                            ]}
                            style={[
                              styles.selectorChipGradient,
                              frequency === opt.id && styles.chipSelectedBorder,
                            ]}
                          >
                            <Icon
                              name={opt.icon as any}
                              size={scale(16)}
                              color={
                                frequency === opt.id
                                  ? "#fff"
                                  : ThemeColors.textSecondary
                              }
                            />
                            <Text
                              style={[
                                styles.selectorChipText,
                                frequency === opt.id &&
                                  styles.selectorChipTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Conditional inputs INSIDE card */}
                    {frequency === "oneTime" && (
                      <View style={styles.frequencyBody}>
                        <TouchableOpacity
                          style={[
                            styles.compactDateInput,
                            errors.startDate && styles.inputError,
                          ]}
                          onPress={() => openCalendar("single", "Select Date")}
                          activeOpacity={0.8}
                        >
                          <View style={styles.compactDateInputContent}>
                            <Text style={styles.compactDateLabel}>Date</Text>
                            <Text style={styles.compactDateValue}>
                              {newActivity.startDate || "Select"}
                            </Text>
                          </View>
                          <Icon
                            name="calendar-outline"
                            size={scale(16)}
                            color={ThemeColors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {frequency === "weekly" && (
                      <View style={styles.frequencyBody}>
                        <TouchableOpacity
                          style={styles.popupSelectorButton}
                          onPress={() => setShowWeeklyModal(true)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.popupSelectorContent}>
                            <Icon
                              name="calendar-outline"
                              size={scale(20)}
                              color={ThemeColors.primary}
                            />
                            <View style={styles.popupSelectorTextContainer}>
                              <Text style={styles.popupSelectorLabel}>
                                Select Days
                              </Text>
                              <Text style={styles.popupSelectorValue}>
                                {selectedWeekdays.length > 0
                                  ? `${selectedWeekdays.length} day${
                                      selectedWeekdays.length > 1 ? "s" : ""
                                    } selected`
                                  : "Tap to select days"}
                              </Text>
                            </View>
                            <Icon
                              name="chevron-forward"
                              size={scale(18)}
                              color={ThemeColors.textSecondary}
                            />
                          </View>
                        </TouchableOpacity>
                        {!!errors.weeklyDays && (
                          <Text style={styles.compactErrorText}>
                            {errors.weeklyDays}
                          </Text>
                        )}
                      </View>
                    )}

                    {frequency === "monthly" && (
                      <View style={styles.frequencyBody}>
                        <TouchableOpacity
                          style={styles.popupSelectorButton}
                          onPress={() => setShowMonthlyModal(true)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.popupSelectorContent}>
                            <Icon
                              name="calendar-sharp"
                              size={scale(20)}
                              color={ThemeColors.primary}
                            />
                            <View style={styles.popupSelectorTextContainer}>
                              <Text style={styles.popupSelectorLabel}>
                                Select Months & Days
                              </Text>
                              <Text style={styles.popupSelectorValue}>
                                {selectedMonths.length > 0
                                  ? `${selectedMonths.length} month${
                                      selectedMonths.length > 1 ? "s" : ""
                                    }${
                                      selectedMonthDays.length > 0
                                        ? `, ${selectedMonthDays.length} day${
                                            selectedMonthDays.length > 1
                                              ? "s"
                                              : ""
                                          }`
                                        : ""
                                    } selected`
                                  : "Tap to select months and days"}
                              </Text>
                            </View>
                            <Icon
                              name="chevron-forward"
                              size={scale(18)}
                              color={ThemeColors.textSecondary}
                            />
                          </View>
                        </TouchableOpacity>
                        {!!errors.months && (
                          <Text style={styles.compactErrorText}>
                            {errors.months}
                          </Text>
                        )}
                        {!!errors.monthDays && (
                          <Text style={styles.compactErrorText}>
                            {errors.monthDays}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Date Range - inside Frequency Card */}
                    {!!frequency && rangeVisible && (
                      <Animated.View
                        style={{
                          overflow: "hidden",
                          opacity: rangeAnim,
                          transform: [
                            {
                              translateY: rangeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                              }),
                            },
                          ],
                        }}
                      >
                        <View style={styles.frequencyBody}>
                          <View style={styles.compactDateRangeContainer}>
                            <TouchableOpacity
                              style={[
                                styles.compactDateInput,
                                errors.startDate && styles.inputError,
                              ]}
                              onPress={() =>
                                openCalendar("start", "Start Date")
                              }
                              activeOpacity={0.8}
                            >
                              <View style={styles.compactDateInputContent}>
                                <Text style={styles.compactDateLabel}>
                                  Start
                                </Text>
                                <Text style={styles.compactDateValue}>
                                  {newActivity.startDate || "Select"}
                                </Text>
                              </View>
                              <Icon
                                name="calendar-outline"
                                size={scale(16)}
                                color={ThemeColors.primary}
                              />
                            </TouchableOpacity>

                            <Icon
                              name="arrow-forward"
                              size={scale(14)}
                              color={ThemeColors.textSecondary}
                              style={styles.compactDateSeparator}
                            />

                            <TouchableOpacity
                              style={[
                                styles.compactDateInput,
                                errors.endDate && styles.inputError,
                              ]}
                              onPress={() => openCalendar("end", "End Date")}
                              activeOpacity={0.8}
                            >
                              <View style={styles.compactDateInputContent}>
                                <Text style={styles.compactDateLabel}>End</Text>
                                <Text style={styles.compactDateValue}>
                                  {newActivity.endDate || "Select"}
                                </Text>
                              </View>
                              <Icon
                                name="calendar-outline"
                                size={scale(16)}
                                color={ThemeColors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                          {(errors.startDate || errors.endDate) && (
                            <Text style={styles.compactErrorText}>
                              {errors.startDate || errors.endDate}
                            </Text>
                          )}
                        </View>
                      </Animated.View>
                    )}

                    {/* Duration inside Frequency Card */}
                    <View style={styles.frequencyBody}>
                      <Text style={styles.compactFormLabel}>Duration</Text>
                      <TouchableOpacity
                        style={[
                          styles.enhancedDurationInputContainer,
                          errors.duration && styles.inputError,
                        ]}
                        onPress={() => setShowDurationPicker(true)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.enhancedDurationInputContent}>
                          <Text style={styles.enhancedDurationInputValue}>
                            {newActivity.duration || "00:00:00"}
                          </Text>
                          <Text style={styles.enhancedDurationInputHint}>
                            Tap to select
                          </Text>
                        </View>
                        <Icon
                          name="time-outline"
                          size={scale(16)}
                          color={ThemeColors.primary}
                        />
                      </TouchableOpacity>
                      {errors.duration ? (
                        <Text style={styles.compactErrorText}>
                          {errors.duration}
                        </Text>
                      ) : (
                        <Text style={styles.compactHelpText}>
                          Format: HH:MM:SS
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                </View>

                {/* Tag Card Section */}
                <View style={styles.compactFormGroup}>
                  <LinearGradient
                    colors={[
                      "rgba(30, 30, 30, 0.98)",
                      "rgba(44, 44, 46, 0.95)",
                    ]}
                    style={styles.frequencyCard}
                  >
                    <View style={styles.frequencyHeaderRow}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: scale(6),
                        }}
                      >
                        <Icon
                          name="pricetags-outline"
                          size={scale(16)}
                          color={ThemeColors.textSecondary}
                        />
                        <Text style={styles.compactFormLabel}>Tag</Text>
                      </View>
                    </View>

                    {/* Priority chips */}
                    <View style={styles.frequencyBody}>
                      <Text style={styles.compactFormLabel}>Priority</Text>
                      {!!errors.priority && (
                        <Text style={styles.compactErrorText}>
                          {errors.priority}
                        </Text>
                      )}
                      {tagLoading ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.selectorChipsContent}
                          style={styles.selectorChips}
                        >
                          {Array.from({ length: 4 }).map((_, idx, arr) => (
                            <View
                              key={`priority-skel-${idx}`}
                              style={[
                                styles.selectorChipItem,
                                {
                                  marginRight:
                                    idx === arr.length - 1
                                      ? scale(20)
                                      : scale(12),
                                },
                              ]}
                            >
                              <View style={styles.skeletonChipBase}>
                                <Animated.View
                                  style={[
                                    styles.skeletonShimmer,
                                    {
                                      transform: [
                                        {
                                          translateX: tagShimmer.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-40, 140],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.selectorChipsContent}
                          style={styles.selectorChips}
                        >
                          {tagPriorities.map((item, index, arr) => {
                            const selected = selectedPriorityId === item.id;
                            return (
                              <TouchableOpacity
                                key={item.id}
                                style={[
                                  styles.selectorChipItem,
                                  selected && styles.selectorChipItemSelected,
                                  {
                                    marginRight:
                                      index === arr.length - 1
                                        ? scale(20)
                                        : scale(12),
                                  },
                                ]}
                                onPress={() => {
                                  const next = selected ? null : item.id;
                                  setSelectedPriorityId(next);
                                  if (errors.priority) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      priority: "",
                                    }));
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                <LinearGradient
                                  colors={[
                                    selected
                                      ? hexToRgba(item.color, 0.22)
                                      : "rgba(255,255,255,0.08)",
                                    selected
                                      ? hexToRgba(item.color, 0.14)
                                      : "rgba(255,255,255,0.04)",
                                  ]}
                                  style={[
                                    styles.selectorChipGradient,
                                    selected && {
                                      borderColor: item.color,
                                      shadowColor: item.color,
                                    },
                                  ]}
                                >
                                  <Icon
                                    name={item.icon as any}
                                    size={scale(16)}
                                    color={
                                      selected
                                        ? "#fff"
                                        : ThemeColors.textSecondary
                                    }
                                  />
                                  <Text
                                    style={[
                                      styles.selectorChipText,
                                      selected &&
                                        styles.selectorChipTextSelected,
                                      selected && { fontWeight: "700" },
                                    ]}
                                  >
                                    {item.name}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>

                    {/* Category chips */}
                    <View style={styles.frequencyBody}>
                      <Text style={styles.compactFormLabel}>Category</Text>
                      {!!errors.category && (
                        <Text style={styles.compactErrorText}>
                          {errors.category}
                        </Text>
                      )}
                      {tagLoading ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.selectorChipsContent}
                          style={styles.selectorChips}
                        >
                          {Array.from({ length: 5 }).map((_, idx, arr) => (
                            <View
                              key={`category-skel-${idx}`}
                              style={[
                                styles.selectorChipItem,
                                {
                                  marginRight:
                                    idx === arr.length - 1
                                      ? scale(20)
                                      : scale(12),
                                },
                              ]}
                            >
                              <View style={styles.skeletonChipBase}>
                                <Animated.View
                                  style={[
                                    styles.skeletonShimmer,
                                    {
                                      transform: [
                                        {
                                          translateX: tagShimmer.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-40, 140],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.selectorChipsContent}
                          style={styles.selectorChips}
                        >
                          {tagCategories.map((item, index, arr) => {
                            const selected = selectedCategoryId === item.id;
                            return (
                              <TouchableOpacity
                                key={item.id}
                                style={[
                                  styles.selectorChipItem,
                                  selected && styles.selectorChipItemSelected,
                                  {
                                    marginRight:
                                      index === arr.length - 1
                                        ? scale(20)
                                        : scale(12),
                                  },
                                ]}
                                onPress={() => {
                                  const next = selected ? null : item.id;
                                  setSelectedCategoryId(next);
                                  if (errors.category) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      category: "",
                                    }));
                                  }
                                  // optionally also map into newActivity.category text
                                  if (next) {
                                    setNewActivity((prev) => ({
                                      ...prev,
                                      category: item.name as any,
                                    }));
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                <LinearGradient
                                  colors={[
                                    selected
                                      ? hexToRgba(item.color, 0.22)
                                      : "rgba(255,255,255,0.08)",
                                    selected
                                      ? hexToRgba(item.color, 0.14)
                                      : "rgba(255,255,255,0.04)",
                                  ]}
                                  style={[
                                    styles.selectorChipGradient,
                                    selected && {
                                      borderColor: item.color,
                                      shadowColor: item.color,
                                    },
                                  ]}
                                >
                                  <Icon
                                    name={item.icon as any}
                                    size={scale(16)}
                                    color={
                                      selected
                                        ? "#fff"
                                        : ThemeColors.textSecondary
                                    }
                                  />
                                  <Text
                                    style={[
                                      styles.selectorChipText,
                                      selected &&
                                        styles.selectorChipTextSelected,
                                      selected && { fontWeight: "700" },
                                    ]}
                                  >
                                    {item.name}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  </LinearGradient>
                </View>

                {/* Color Slider - Horizontal */}
                <View style={styles.compactFormGroup}>
                  <Text style={styles.compactFormLabel}>Activity Color</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorSliderContent}
                    style={styles.colorSlider}
                  >
                    {ACTIVITY_COLORS.map((color, index) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorSliderItem,
                          {
                            backgroundColor: color,
                            marginRight:
                              index === ACTIVITY_COLORS.length - 1
                                ? scale(20)
                                : scale(10),
                          },
                          newActivity.color === color &&
                            styles.colorSliderItemSelected,
                        ]}
                        onPress={() =>
                          setNewActivity((prev) => ({ ...prev, color }))
                        }
                        activeOpacity={0.8}
                      >
                        {newActivity.color === color && (
                          <Icon
                            name="checkmark"
                            size={scale(14)}
                            color="#fff"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.compactColorPreview}>
                    <Text style={styles.compactColorPreviewLabel}>
                      Selected:
                    </Text>
                    <View
                      style={[
                        styles.compactColorPreviewBox,
                        { backgroundColor: newActivity.color },
                      ]}
                    />
                    <Text style={styles.compactColorPreviewText}>
                      {newActivity.color}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Enhanced Footer Actions (fixed) */}
            <View
              style={styles.compactModalFooter}
              pointerEvents="box-none"
              accessibilityRole="toolbar"
            >
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.1)",
                    "rgba(255, 255, 255, 0.05)",
                  ]}
                  style={styles.compactCancelButtonGradient}
                >
                  <Icon
                    name="close-circle-outline"
                    size={scale(16)}
                    color={ThemeColors.textSecondary}
                  />
                  <Text style={styles.compactCancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.compactAddButton,
                  { transform: [{ scale: buttonPulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.compactAddButtonTouchable}
                  onPress={() => {
                    // trigger validation before submit
                    if (!validateForm()) return;
                    handleSubmit();
                  }}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[
                      ThemeColors.primary,
                      ThemeColors.secondary,
                      ThemeColors.success,
                    ]}
                    style={[
                      styles.compactAddButtonGradient,
                      isLoading && styles.compactAddButtonDisabled,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon
                          name={mode === "edit" ? "save" : "rocket"}
                          size={scale(18)}
                          color="#fff"
                        />
                        <Text style={styles.compactAddButtonText}>
                          {mode === "edit"
                            ? "Update Activity"
                            : "Create Activity"}
                        </Text>
                        <View style={styles.addButtonGlow} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced Duration Picker Modal */}
        {showDurationPicker && renderDurationPicker()}

        {/* Enhanced Date Picker Modals (legacy inline picker retained if needed) */}
        {showStartDatePicker &&
          renderCompactDatePicker(
            true,
            startDateObj,
            setStartDateObj,
            confirmStartDate,
            () => setShowStartDatePicker(false)
          )}

        {showEndDatePicker &&
          renderCompactDatePicker(
            false,
            endDateObj,
            setEndDateObj,
            confirmEndDate,
            () => setShowEndDatePicker(false)
          )}

        {/* Weekly Selection Popup Modal */}
        {showWeeklyModal && (
          <View style={styles.calendarModalOverlay}>
            <TouchableWithoutFeedback onPress={() => setShowWeeklyModal(false)}>
              <View style={styles.calendarBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.calendarCardContainer,
                {
                  transform: [{ translateY: weeklySheetY }],
                  opacity: weeklySheetOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
                style={styles.calendarCard}
              >
                {/* Header */}
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarHeaderTitle}>
                    Select Weekly Days
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowWeeklyModal(false)}
                    style={styles.durationCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="close"
                      size={scale(18)}
                      color={ThemeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.calendarBody}>
                  <Text style={styles.popupSectionLabel}>Days of the Week</Text>
                  <View
                    style={[styles.wrapChipsContainer, styles.popupChipsWrap]}
                  >
                    {WEEK_DAYS.map((day) => {
                      const selected = selectedWeekdays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.pillChip,
                            styles.popupPillChip,
                            selected && styles.pillChipSelected,
                          ]}
                          onPress={() => {
                            setSelectedWeekdays((prev) => {
                              const next = prev.includes(day)
                                ? prev.filter((d) => d !== day)
                                : [...prev, day];
                              if (next.length > 0 && !rangeVisible) {
                                setRangeVisible(true);
                                Animated.timing(rangeAnim, {
                                  toValue: 1,
                                  duration: 200,
                                  useNativeDriver: true,
                                }).start();
                              }
                              if (next.length === 0) {
                                setRangeVisible(false);
                                rangeAnim.setValue(0);
                              }
                              // clear weekly error when user selects
                              if (errors.weeklyDays) {
                                setErrors((prev) => ({
                                  ...prev,
                                  weeklyDays: "",
                                }));
                              }
                              return next;
                            });
                          }}
                          activeOpacity={0.85}
                        >
                          {selected ? (
                            <LinearGradient
                              colors={[
                                "rgba(255, 255, 255, 0.08)",
                                "rgba(255, 255, 255, 0.04)",
                              ]}
                              style={[
                                styles.pillChipGradient,
                                styles.pillChipGradientSelected,
                              ]}
                            >
                              <Text style={styles.pillChipText}>{day}</Text>
                            </LinearGradient>
                          ) : (
                            <LinearGradient
                              colors={[
                                "rgba(255, 255, 255, 0.08)",
                                "rgba(255, 255, 255, 0.04)",
                              ]}
                              style={styles.pillChipGradient}
                            >
                              <Text style={styles.pillChipText}>{day}</Text>
                            </LinearGradient>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.calendarFooter}>
                  <TouchableOpacity
                    style={styles.calendarCloseButton}
                    onPress={() => setShowWeeklyModal(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[ThemeColors.primary, ThemeColors.secondary]}
                      style={styles.calendarCloseGradient}
                    >
                      <Text style={styles.calendarCloseText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {/* Monthly Selection Popup Modal */}
        {showMonthlyModal && (
          <View style={styles.calendarModalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => setShowMonthlyModal(false)}
            >
              <View style={styles.calendarBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.calendarCardContainer,
                {
                  transform: [{ translateY: monthlySheetY }],
                  opacity: monthlySheetOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
                style={styles.calendarCard}
              >
                {/* Header */}
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarHeaderTitle}>
                    Select Months & Days
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowMonthlyModal(false)}
                    style={styles.durationCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="close"
                      size={scale(18)}
                      color={ThemeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                  style={styles.popupScrollView}
                  contentContainerStyle={styles.popupScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Months Section */}
                  <View style={styles.popupSection}>
                    <Text style={styles.popupSectionLabel}>Months</Text>
                    <View
                      style={[styles.wrapChipsContainer, styles.popupChipsWrap]}
                    >
                      {MONTHS_LABELS.map((mLabel, idx) => {
                        const month = idx + 1;
                        const selected = selectedMonths.includes(month);
                        return (
                          <TouchableOpacity
                            key={mLabel}
                            style={[
                              styles.pillChip,
                              styles.popupPillChip,
                              selected && styles.pillChipSelected,
                            ]}
                            onPress={() => {
                              setSelectedMonths((prev) => {
                                const next = prev.includes(month)
                                  ? prev.filter((m) => m !== month)
                                  : [...prev, month];
                                if (next.length === 0) {
                                  setSelectedMonthDays([]);
                                  setRangeVisible(false);
                                  rangeAnim.setValue(0);
                                }
                                // clear month error when user selects
                                setErrors((prev) => ({
                                  ...prev,
                                  months: "",
                                }));
                                return next;
                              });
                            }}
                            activeOpacity={0.85}
                          >
                            {selected ? (
                              <LinearGradient
                                colors={[
                                  "rgba(255, 255, 255, 0.08)",
                                  "rgba(255, 255, 255, 0.04)",
                                ]}
                                style={[
                                  styles.pillChipGradient,
                                  styles.pillChipGradientSelected,
                                ]}
                              >
                                <Text style={styles.pillChipText}>
                                  {mLabel}
                                </Text>
                              </LinearGradient>
                            ) : (
                              <LinearGradient
                                colors={[
                                  "rgba(255, 255, 255, 0.08)",
                                  "rgba(255, 255, 255, 0.04)",
                                ]}
                                style={styles.pillChipGradient}
                              >
                                <Text style={styles.pillChipText}>
                                  {mLabel}
                                </Text>
                              </LinearGradient>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Days Section */}
                  {selectedMonths.length > 0 && (
                    <View style={styles.popupSection}>
                      <Text style={styles.popupSectionLabel}>
                        Days of Month
                      </Text>
                      <View
                        style={[
                          styles.wrapChipsContainer,
                          styles.popupChipsWrap,
                          styles.dayGridWrap,
                        ]}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (day) => {
                            const selected = selectedMonthDays.includes(day);
                            return (
                              <TouchableOpacity
                                key={day}
                                style={[
                                  styles.dayPill,
                                  styles.popupDayPill,
                                  selected && styles.pillChipSelected,
                                ]}
                                onPress={() => {
                                  setSelectedMonthDays((prev) => {
                                    const next = prev.includes(day)
                                      ? prev.filter((d) => d !== day)
                                      : [...prev, day];
                                    if (next.length > 0 && !rangeVisible) {
                                      setRangeVisible(true);
                                      Animated.timing(rangeAnim, {
                                        toValue: 1,
                                        duration: 200,
                                        useNativeDriver: true,
                                      }).start();
                                    }
                                    if (next.length === 0) {
                                      setRangeVisible(false);
                                      rangeAnim.setValue(0);
                                    }
                                    // clear day error when user selects
                                    setErrors((prev) => ({
                                      ...prev,
                                      monthDays: "",
                                    }));
                                    return next;
                                  });
                                }}
                                activeOpacity={0.85}
                              >
                                {selected ? (
                                  <LinearGradient
                                    colors={[
                                      "rgba(255, 255, 255, 0.08)",
                                      "rgba(255, 255, 255, 0.04)",
                                    ]}
                                    style={[
                                      styles.dayPillGradient,
                                      styles.dayPillGradientSelected,
                                    ]}
                                  >
                                    <Text style={styles.dayPillText}>
                                      {String(day).padStart(2, "0")}
                                    </Text>
                                  </LinearGradient>
                                ) : (
                                  <LinearGradient
                                    colors={[
                                      "rgba(255, 255, 255, 0.08)",
                                      "rgba(255, 255, 255, 0.04)",
                                    ]}
                                    style={styles.dayPillGradient}
                                  >
                                    <Text style={styles.dayPillText}>
                                      {String(day).padStart(2, "0")}
                                    </Text>
                                  </LinearGradient>
                                )}
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.calendarFooter}>
                  <TouchableOpacity
                    style={styles.calendarCloseButton}
                    onPress={() => setShowMonthlyModal(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[ThemeColors.primary, ThemeColors.secondary]}
                      style={styles.calendarCloseGradient}
                    >
                      <Text style={styles.calendarCloseText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {/* Calendar Popup Modal for Frequency-based selection (bottom sheet) */}
        {showCalendarModal && (
          <View style={styles.calendarModalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => setShowCalendarModal(false)}
            >
              <View style={styles.calendarBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.calendarCardContainer,
                {
                  transform: [{ translateY: calendarSheetY }],
                  opacity: calendarSheetOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
                style={styles.calendarCard}
              >
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      animateMonthChange(-1);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon
                      name="chevron-back"
                      size={scale(20)}
                      color={ThemeColors.primary}
                    />
                  </TouchableOpacity>
                  <View>
                    <Text style={styles.calendarHeaderTitle}>
                      {calendarTitle}
                    </Text>
                    <Text style={styles.calendarHeaderMonth}>
                      {format(calendarMonth, "MMMM yyyy")}
                    </Text>
                    {(() => {
                      const today = new Date();
                      const targetStr =
                        calendarTarget === "single"
                          ? newActivity.startDate || newActivity.endDate
                          : calendarTarget === "start"
                          ? newActivity.startDate
                          : newActivity.endDate;
                      let selectedDisplay = "—";
                      if (targetStr) {
                        const [yy, mm, dd] = targetStr
                          .split("/")
                          .map((p) => parseInt(p, 10));
                        if (yy && mm && dd) {
                          const d = new Date(yy, mm - 1, dd);
                          selectedDisplay = format(d, "MMMM d, yyyy");
                        }
                      }
                      return (
                        <View>
                          <Text style={styles.calendarSelectedInfo}>
                            Selected: {selectedDisplay}
                          </Text>
                          <Text style={styles.calendarTodayInfo}>
                            Today: {format(today, "MMMM d, yyyy")}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scale(10),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        animateMonthChange(1);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name="chevron-forward"
                        size={scale(20)}
                        color={ThemeColors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowCalendarModal(false)}
                      style={styles.durationCloseBtn}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="close"
                        size={scale(18)}
                        color={ThemeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.calendarBody}>
                  <View style={styles.calendarWeekdaysRow}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <Text key={d} style={styles.calendarWeekdayText}>
                          {d}
                        </Text>
                      )
                    )}
                  </View>
                  {(() => {
                    const monthDays = eachDayOfInterval({
                      start: startOfMonth(calendarMonth),
                      end: endOfMonth(calendarMonth),
                    });
                    const startWk = monthDays[0].getDay();
                    const leading = startWk; // number of blanks before day 1
                    const totalCells =
                      Math.ceil((leading + monthDays.length) / 7) * 7;
                    const trailing = totalCells - leading - monthDays.length;
                    const cells: Array<{
                      type: "placeholder" | "date";
                      date?: Date;
                    }> = [];
                    for (let i = 0; i < leading; i += 1)
                      cells.push({ type: "placeholder" });
                    for (const d of monthDays)
                      cells.push({ type: "date", date: d });
                    for (let i = 0; i < trailing; i += 1)
                      cells.push({ type: "placeholder" });
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return (
                      <Animated.View
                        style={[
                          styles.calendarDaysGrid,
                          {
                            transform: [{ translateX: calendarTransX }],
                            opacity: calendarOpacity,
                          },
                        ]}
                      >
                        {cells.map((cell, idx) => {
                          if (cell.type === "placeholder") {
                            return (
                              <View
                                key={`ph-${idx}`}
                                style={styles.calendarCell}
                              />
                            );
                          }
                          const date = cell.date as Date;
                          const isToday =
                            date.getFullYear() === today.getFullYear() &&
                            date.getMonth() === today.getMonth() &&
                            date.getDate() === today.getDate();
                          // Selected date (single value based on target)
                          const targetStr =
                            calendarTarget === "single"
                              ? newActivity.startDate || newActivity.endDate
                              : calendarTarget === "start"
                              ? newActivity.startDate
                              : newActivity.endDate;
                          let isSelected = false;
                          if (targetStr) {
                            const [yy, mm, dd] = targetStr
                              .split("/")
                              .map((p) => parseInt(p, 10));
                            if (yy && mm && dd) {
                              isSelected =
                                date.getFullYear() === yy &&
                                date.getMonth() === mm - 1 &&
                                date.getDate() === dd;
                            }
                          }
                          // Range preview and past-state
                          const startObj = parseYmdToDate(
                            newActivity.startDate
                          );
                          const endObj = parseYmdToDate(newActivity.endDate);
                          const compareDate = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate()
                          );
                          const isPast =
                            compareDate <
                            new Date(new Date().setHours(0, 0, 0, 0));
                          let inPreviewRange = false;
                          if (calendarTarget === "end" && startObj) {
                            const previewEnd = rangePreviewDate || endObj;
                            if (
                              previewEnd &&
                              compareDate > startObj &&
                              compareDate < previewEnd
                            )
                              inPreviewRange = true;
                          }
                          return (
                            <View
                              key={date.toISOString()}
                              style={styles.calendarCell}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.calendarDayButton,
                                  isSelected && styles.calendarSelectedDay,
                                  isToday && styles.calendarTodayOutline,
                                  isToday &&
                                    isSelected &&
                                    styles.calendarSelectedTodayCombo,
                                  inPreviewRange && styles.calendarRangeBetween,
                                  isPast && styles.calendarPastDisabled,
                                ]}
                                onPress={() => handleCalendarSelect(date)}
                                activeOpacity={0.85}
                                disabled={isPast}
                              >
                                <Text
                                  style={[
                                    styles.calendarDayText,
                                    isSelected &&
                                      styles.calendarDayTextSelected,
                                    isPast && styles.calendarDayTextDisabled,
                                  ]}
                                >
                                  {date.getDate()}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </Animated.View>
                    );
                  })()}
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalBackdrop: {
    flex: 1,
  },
  compactModalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Use flexbox approach for better dynamic sizing
    height: isMobileDevice
      ? height * 0.85 // Fixed height that leaves space for status bar
      : height * 0.8, // Conservative height for larger screens
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  compactModalGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderBottomWidth: 0,
    // Use flex layout to manage header, content, and footer
    flexDirection: "column",
  },
  compactModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallDevice ? scale(16) : scale(20),
    paddingTop: scale(8),
    paddingBottom: isSmallDevice ? scale(10) : scale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
    backgroundColor: "transparent",
    zIndex: 2,
    // Fixed header height for consistent layout
    height: scale(60),
    flexShrink: 0, // Don't allow header to shrink
  },
  compactHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  compactHeaderIcon: {
    marginRight: scale(12),
  },
  compactModalTitle: {
    color: ThemeColors.text,
    fontSize: isSmallDevice ? scale(16) : scale(18),
    fontWeight: "700",
    letterSpacing: 0.3,
    // Ensure title doesn't get truncated on small screens
    flex: 1,
  },
  compactCloseButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  compactScrollView: {
    flex: 1,
    // Ensure the scroll view can shrink when content is minimal
    minHeight: 0,
  },
  compactScrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    // Fixed padding bottom that accounts for footer height
    paddingBottom: FOOTER_HEIGHT + scale(20),
    // Add extra bottom padding on smaller devices for better UX
    ...(isSmallDevice && {
      paddingBottom: FOOTER_HEIGHT + scale(24),
      paddingHorizontal: scale(16),
    }),
  },
  compactFormGroup: {
    marginBottom: isSmallDevice ? scale(10) : scale(14), // Reduced spacing
  },
  compactFormLabel: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(8),
    letterSpacing: 0.2,
  },
  compactInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  compactInput: {
    flex: 1,
    color: ThemeColors.text,
    fontWeight: "500",
  },
  inputError: {
    borderColor: ThemeColors.danger,
  },
  compactErrorText: {
    color: ThemeColors.danger,
    fontSize: scale(11),
    marginTop: scale(4),
    marginLeft: scale(4),
  },
  compactHelpText: {
    color: ThemeColors.textTertiary,
    fontSize: scale(11),
    marginTop: scale(4),
    marginLeft: scale(4),
  },
  // (Removed legacy Category Slider styles)
  // Enhanced Duration Input Styles - Smaller and Better
  enhancedDurationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    minHeight: scale(42),
  },
  // Selector chips (Frequency, Weekly Start Day, Monthly Month)
  selectorChips: {
    marginBottom: scale(6), // Reduced from 8 to 6
  },
  selectorChipsContent: {
    paddingHorizontal: scale(4),
  },
  selectorChipItem: {
    borderRadius: scale(8),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  selectorChipItemSelected: {
    elevation: 4,
    shadowOpacity: 0.3,
  },
  selectorChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(6),
    minWidth: scale(80),
    justifyContent: "center",
  },
  selectorChipText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  selectorChipTextSelected: {
    color: "#fff",
  },
  chipSelectedBorder: {
    borderColor: ThemeColors.success,
    shadowColor: ThemeColors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  // Skeleton styles for Tag chips
  skeletonChipBase: {
    height: scale(36),
    minWidth: scale(90),
    borderRadius: scale(8),
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: ThemeColors.border,
    overflow: "hidden",
  },
  skeletonShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "rgba(255,255,255,0.12)",
    opacity: 0.6,
  },
  // Frequency Card styles
  frequencyCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    paddingHorizontal: isSmallDevice ? scale(12) : scale(14),
    paddingVertical: isSmallDevice ? scale(10) : scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    // Ensure proper layout on small screens
    minHeight: isSmallDevice ? scale(80) : scale(90),
  },
  frequencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  frequencyBody: {
    marginTop: scale(8),
    // Ensure proper spacing on mobile and reduced spacing for date ranges
    ...(isSmallDevice && {
      marginTop: scale(6),
    }),
    // Reduce bottom margin to save space
    marginBottom: scale(4),
  },
  // Wrap chips (pill toggles)
  wrapChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmallDevice ? scale(6) : scale(8),
    // Better spacing for small devices
    ...(isSmallDevice && {
      justifyContent: "flex-start",
    }),
  },
  dayGridWrap: {
    justifyContent: "space-between",
  },
  pillChip: {
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  pillChipSelected: {
    elevation: 4,
    shadowOpacity: 0.3,
    // Add subtle border to selected chips for better contrast
    borderWidth: 1,
    borderColor: ThemeColors.success,
  },
  pillChipGradient: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  pillChipGradientSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: "transparent",
  },
  pillChipText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "700",
  },
  pillChipTextSelected: {
    color: "#fff",
  },
  // Gradient ring pill (outer wrapper + inner dark fill)
  ringOuterPill: {
    padding: 1.5,
    borderRadius: scale(16),
  },
  ringInnerPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: scale(14),
    paddingHorizontal: scale(13),
    paddingVertical: scale(6),
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayRingOuter: {
    flex: 1,
    padding: 2,
    borderRadius: DAY_CHIP_SIZE / 2,
  },
  dayRingInner: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: DAY_CHIP_SIZE / 2 - 2,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayPill: {
    width: DAY_CHIP_SIZE,
    height: DAY_CHIP_SIZE,
    borderRadius: DAY_CHIP_SIZE / 2,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  dayPillGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  dayPillGradientSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: "transparent",
  },
  dayPillText: {
    color: ThemeColors.textSecondary,
    fontWeight: "700",
    fontSize: scale(12),
  },
  smallLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
    marginBottom: scale(6),
  },
  monthDayWrap: {
    marginTop: scale(10),
  },
  enhancedDurationInputContent: {
    flex: 1,
  },
  enhancedDurationInputValue: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(1),
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  enhancedDurationInputHint: {
    color: ThemeColors.textTertiary,
    fontSize: scale(10),
    fontWeight: "500",
  },
  compactDateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  compactDateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: isSmallDevice ? scale(10) : scale(12), // Reduced padding on small devices
    borderWidth: 1,
    borderColor: ThemeColors.border,
    minHeight: scale(44), // Ensure consistent height
  },
  compactDateInputContent: {
    flex: 1,
  },
  compactDateLabel: {
    color: ThemeColors.textTertiary,
    fontSize: scale(10),
    fontWeight: "500",
    marginBottom: scale(2),
  },
  compactDateValue: {
    color: ThemeColors.text,
    fontSize: scale(12),
    fontWeight: "600",
  },
  compactDateSeparator: {
    marginHorizontal: scale(4),
  },
  // Color Slider Styles
  colorSlider: {
    marginBottom: scale(12),
  },
  colorSliderContent: {
    paddingHorizontal: scale(4),
  },
  colorSliderItem: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorSliderItemSelected: {
    elevation: 6,
    shadowOpacity: 0.4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  compactColorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  compactColorPreviewLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },
  compactColorPreviewBox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: "#fff",
  },
  compactColorPreviewText: {
    color: ThemeColors.text,
    fontSize: scale(12),
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  // Enhanced Footer Styles
  compactModalFooter: {
    flexDirection: "row",
    paddingHorizontal: isSmallDevice ? scale(16) : scale(20),
    paddingTop: isSmallDevice ? scale(10) : scale(12),
    paddingBottom: SAFE_AREA_BOTTOM + (isSmallDevice ? scale(10) : scale(12)),
    borderTopWidth: 0.5,
    borderTopColor: ThemeColors.border,
    gap: isSmallDevice ? scale(10) : scale(12),
    backgroundColor: "rgba(30, 30, 30, 0.98)", // Solid background to overlay content
    zIndex: 10, // Increased z-index to ensure it stays on top
    // Pin to bottom so it remains visible on mobile
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Add shadow for better visibility instead of backdrop filter
    elevation: 10, // Increased elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4, // Increased shadow opacity
    shadowRadius: 6, // Increased shadow radius
    // Fixed footer height to prevent layout shifts
    height: FOOTER_HEIGHT,
    flexShrink: 0, // Don't allow footer to shrink
  },
  compactCancelButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  compactCancelButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(6),
  },
  compactCancelButtonText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  compactAddButton: {
    flex: 2,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  compactAddButtonTouchable: {
    flex: 1,
  },
  compactAddButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
    position: "relative",
    overflow: "hidden",
  },
  compactAddButtonDisabled: {
    opacity: 0.6,
  },
  compactAddButtonText: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  addButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
  },
  // Enhanced Duration Picker Modal Styles
  durationPickerModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  durationPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  // New Duration wheel styles
  durationCardContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: scale(20),
  },
  durationCard: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  durationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
  },
  durationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  durationHeaderIconWrap: {
    marginRight: scale(12),
  },
  durationHeaderIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  durationTitle: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
  },
  durationSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },
  durationCloseBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelsRow: {
    flexDirection: "row",
    gap: scale(12),
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
  },
  wheelColumn: {
    flex: 1,
  },
  wheelLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(8),
  },
  wheelViewport: {
    height: scale(36) * 5,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  wheelList: {
    flexGrow: 0,
  },
  wheelItemContainer: {
    height: scale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemSelected: {
    backgroundColor: "rgba(0,229,255,0.10)",
  },
  wheelItemText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(16),
    fontWeight: "500",
  },
  wheelItemTextSelected: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
    textShadowColor: ThemeColors.primary,
    textShadowRadius: 6,
  },
  durationDisplayWrap: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(14),
    alignItems: "center",
  },
  durationDisplay: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.3)",
  },
  durationDisplayText: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
  },
  durationConfirmBtn: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
  durationConfirmGradient: {
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
  },
  durationConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: scale(15),
  },
  calendarSelectedInfo: {
    color: ThemeColors.text,
    fontSize: scale(12),
    marginTop: scale(4),
    fontWeight: "700",
  },
  calendarTodayInfo: {
    color: ThemeColors.textSecondary,
    fontSize: scale(11),
    marginTop: scale(2),
    fontWeight: "600",
  },
  // Enhanced Date Picker Modal Styles
  compactDatePickerModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  compactDatePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  enhancedDatePickerContainer: {
    width: "100%",
    maxWidth: scale(360),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  enhancedDatePickerGradient: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  enhancedDatePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
  },
  enhancedDatePickerHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  enhancedDatePickerIconContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
    marginRight: scale(14),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  enhancedDatePickerIconGradient: {
    width: scale(40),
    height: scale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedDatePickerTitle: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  enhancedDatePickerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(13),
    fontWeight: "500",
  },
  enhancedDatePickerClose: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedDatePickerContent: {
    padding: scale(24),
  },
  enhancedDatePickerColumns: {
    flexDirection: "row",
    gap: scale(16),
    marginBottom: scale(24),
  },
  enhancedDatePickerColumn: {
    flex: 1,
  },
  enhancedDateColumnLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(12),
  },
  enhancedDateColumnScroll: {
    height: scale(130),
    borderRadius: scale(12),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  enhancedDateScrollContent: {
    paddingVertical: scale(8),
  },
  enhancedDatePickerItem: {
    paddingVertical: scale(9),
    alignItems: "center",
    marginHorizontal: scale(8),
    borderRadius: scale(8),
  },
  enhancedDatePickerItemSelected: {
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.4)",
  },
  enhancedDatePickerItemText: {
    color: ThemeColors.text,
    fontSize: scale(15),
    fontWeight: "500",
  },
  enhancedDatePickerItemTextSelected: {
    color: ThemeColors.primary,
    fontWeight: "700",
  },
  enhancedDatePickerConfirmButton: {
    borderRadius: scale(14),
    overflow: "hidden",
    elevation: 4,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  enhancedDatePickerConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(10),
  },
  enhancedDatePickerConfirmText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Monthly Calendar Modal Styles (popup)
  calendarModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1200,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
    alignItems: "stretch",
    padding: 0,
  },
  calendarBackdrop: { flex: 1 },
  calendarCardContainer: {
    padding: scale(20),
  },
  calendarCard: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
  },
  calendarHeaderTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
  },
  calendarHeaderMonth: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  calendarBody: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    paddingTop: scale(12),
  },
  calendarWeekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  calendarWeekdayText: {
    color: ThemeColors.textTertiary,
    width: CAL_CELL_SIZE,
    textAlign: "center",
    fontSize: scale(11),
    fontWeight: "600",
  },
  calendarDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarCell: {
    width: CAL_CELL_SIZE,
    height: CAL_CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: CAL_GAP,
  },
  calendarDayButton: {
    width: CAL_CELL_SIZE,
    height: CAL_CELL_SIZE,
    borderRadius: CAL_CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  calendarDayText: {
    color: ThemeColors.text,
    fontSize: scale(12),
    fontWeight: "600",
  },
  calendarDayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  calendarTodayGlow: {
    borderColor: ThemeColors.primary,
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  calendarTodayOutline: {
    borderColor: ThemeColors.primary,
  },
  calendarSelectedDay: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  calendarSelectedTodayCombo: {
    backgroundColor: "#28a745",
    borderColor: ThemeColors.primary,
    shadowColor: ThemeColors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  calendarRangeBetween: {
    backgroundColor: "rgba(40,167,69,0.18)",
    borderColor: "rgba(40,167,69,0.25)",
  },
  calendarPastDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.05)",
  },
  calendarDayTextDisabled: {
    color: ThemeColors.textTertiary,
  },
  calendarFooter: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    paddingTop: scale(8),
    alignItems: "stretch",
  },
  calendarCloseButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    width: "100%",
  },
  calendarCloseGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
  },
  calendarCloseOutlined: {
    borderWidth: 1,
    borderColor: ThemeColors.primary,
    borderRadius: scale(12),
    backgroundColor: "transparent",
  },
  calendarCloseText: {
    color: "#fff",
    fontWeight: "700",
  },
  calendarCloseTextOutlined: {
    color: ThemeColors.primary,
  },

  // Popup Selector Button Styles
  popupSelectorButton: {
    borderRadius: scale(12),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: ThemeColors.border,
    overflow: "hidden",
  },
  popupSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    gap: scale(12),
  },
  popupSelectorTextContainer: {
    flex: 1,
  },
  popupSelectorLabel: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(2),
  },
  popupSelectorValue: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "400",
  },

  // Popup Modal Styles
  popupScrollView: {
    maxHeight: scale(320),
  },
  popupScrollContent: {
    paddingVertical: scale(8),
  },
  popupSection: {
    marginBottom: scale(20),
  },
  popupSectionLabel: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(8),
    paddingHorizontal: scale(8),
  },
  popupPillChip: {
    marginHorizontal: scale(2),
    marginVertical: scale(4),
  },
  popupDayPill: {
    marginHorizontal: scale(2),
    marginVertical: scale(4),
  },
  popupChipsWrap: {
    paddingHorizontal: scale(8),
  },
});

export default AddActivityModal;
