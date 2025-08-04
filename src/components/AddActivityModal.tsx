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
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity, Category } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import StyledText from "../components/StyledText";
import { useAppContext } from "../context/AppContext";

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (activity: Partial<Activity>) => void;
}

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// Responsive scaling
const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.85;
  return size;
};

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
  "#00E5FF", "#9C6CDA", "#4ECDC4", "#FF9500", "#FF4757", "#FF6B9D", 
  "#FFD93D", "#6C5CE7", "#1E88E5", "#8E24AA", "#43A047", "#FB8C00",
  "#E91E63", "#00ACC1", "#F44336", "#2196F3", "#009688", "#4CAF50",
  "#FFC107", "#9C27B0", "#FF5722", "#673AB7", "#03A9F4", "#8BC34A"
];

// Category options with icons for horizontal slider
const CATEGORIES = [
  { id: "Personal", label: "Personal", icon: "person", color: ThemeColors.primary },
  { id: "Work", label: "Work", icon: "briefcase", color: ThemeColors.secondary },
  { id: "Workout", label: "Workout", icon: "fitness", color: ThemeColors.success },
  { id: "Study", label: "Study", icon: "school", color: ThemeColors.warning },
  { id: "Health", label: "Health", icon: "medical", color: "#FF6B9D" },
  { id: "Social", label: "Social", icon: "people", color: "#FFD93D" },
  { id: "Travel", label: "Travel", icon: "airplane", color: "#6C5CE7" },
  { id: "Food", label: "Food", icon: "restaurant", color: "#FB8C00" },
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Duration picker states
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

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

  // Get font size multiplier from context
  const { fontSizeMultiplier } = useAppContext();

  // Duration picker arrays
  const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
  const seconds = Array.from({ length: 60 }, (_, i) => i); // 0-59

  // Animation when modal opens/closes
  React.useEffect(() => {
    if (visible) {
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
  }, []);

  const formatDate = (dateObj: { year: number; month: number; day: number }) => {
    return `${dateObj.year}/${String(dateObj.month).padStart(2, "0")}/${String(
      dateObj.day
    ).padStart(2, "0")}`;
  };

  const formatDuration = (h: number, m: number, s: number) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
    const newErrors: {[key: string]: string} = {};

    if (!newActivity.title?.trim()) {
      newErrors.title = "Title required";
    }

    if (!newActivity.startDate) {
      newErrors.startDate = "Start date required";
    }

    if (!newActivity.endDate) {
      newErrors.endDate = "End date required";
    }

    if (!newActivity.duration) {
      newErrors.duration = "Duration required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newActivity]);

  const handleAddActivity = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onAdd(newActivity);
      onClose();
    } catch (error) {
      console.error("Failed to add activity:", error);
    } finally {
      setIsLoading(false);
    }
  }, [newActivity, onAdd, onClose, validateForm]);

  // Date picker functions
  const confirmStartDate = useCallback(() => {
    const formattedDate = formatDate(startDateObj);
    setNewActivity(prev => ({ ...prev, startDate: formattedDate }));
    setShowStartDatePicker(false);
    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: "" }));
    }
  }, [startDateObj, errors.startDate]);

  const confirmEndDate = useCallback(() => {
    const formattedDate = formatDate(endDateObj);
    setNewActivity(prev => ({ ...prev, endDate: formattedDate }));
    setShowEndDatePicker(false);
    if (errors.endDate) {
      setErrors(prev => ({ ...prev, endDate: "" }));
    }
  }, [endDateObj, errors.endDate]);

  // Duration picker functions
  const confirmDuration = useCallback(() => {
    const formattedDuration = formatDuration(durationHours, durationMinutes, durationSeconds);
    setNewActivity(prev => ({ ...prev, duration: formattedDuration }));
    setShowDurationPicker(false);
    if (errors.duration) {
      setErrors(prev => ({ ...prev, duration: "" }));
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

  // Enhanced duration picker with better design
  const renderDurationPicker = useCallback(() => (
    <View style={styles.durationPickerModal}>
      <View style={styles.durationPickerOverlay}>
        <View style={styles.enhancedDurationPickerContainer}>
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
            style={styles.enhancedDurationPickerGradient}
          >
            {/* Enhanced Header */}
            <View style={styles.enhancedDurationPickerHeader}>
              <View style={styles.enhancedDurationPickerHeaderContent}>
                <View style={styles.enhancedDurationPickerIconContainer}>
                  <LinearGradient
                    colors={[ThemeColors.primary, ThemeColors.secondary]}
                    style={styles.enhancedDurationPickerIconGradient}
                  >
                    <Icon name="time" size={scale(22)} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.enhancedDurationPickerTitle}>Select Duration</Text>
                  <Text style={styles.enhancedDurationPickerSubtitle}>Choose activity time</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowDurationPicker(false)} 
                activeOpacity={0.7}
                style={styles.enhancedDurationPickerClose}
              >
                <Icon name="close" size={scale(18)} color={ThemeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.enhancedDurationPickerContent}>
              <View style={styles.enhancedDurationPickerColumns}>
                {/* Hours Column */}
                <View style={styles.enhancedDurationPickerColumn}>
                  <Text style={styles.enhancedDurationColumnLabel}>Hours</Text>
                  <ScrollView 
                    style={styles.enhancedDurationColumnScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.enhancedDurationScrollContent}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.enhancedDurationPickerItem,
                          durationHours === hour && styles.enhancedDurationPickerItemSelected,
                        ]}
                        onPress={() => setDurationHours(hour)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDurationPickerItemText,
                            durationHours === hour && styles.enhancedDurationPickerItemTextSelected,
                          ]}
                        >
                          {String(hour).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Minutes Column */}
                <View style={styles.enhancedDurationPickerColumn}>
                  <Text style={styles.enhancedDurationColumnLabel}>Minutes</Text>
                  <ScrollView 
                    style={styles.enhancedDurationColumnScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.enhancedDurationScrollContent}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.enhancedDurationPickerItem,
                          durationMinutes === minute && styles.enhancedDurationPickerItemSelected,
                        ]}
                        onPress={() => setDurationMinutes(minute)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDurationPickerItemText,
                            durationMinutes === minute && styles.enhancedDurationPickerItemTextSelected,
                          ]}
                        >
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Seconds Column */}
                <View style={styles.enhancedDurationPickerColumn}>
                  <Text style={styles.enhancedDurationColumnLabel}>Seconds</Text>
                  <ScrollView 
                    style={styles.enhancedDurationColumnScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.enhancedDurationScrollContent}
                  >
                    {seconds.map((second) => (
                      <TouchableOpacity
                        key={second}
                        style={[
                          styles.enhancedDurationPickerItem,
                          durationSeconds === second && styles.enhancedDurationPickerItemSelected,
                        ]}
                        onPress={() => setDurationSeconds(second)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDurationPickerItemText,
                            durationSeconds === second && styles.enhancedDurationPickerItemTextSelected,
                          ]}
                        >
                          {String(second).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Enhanced Duration Preview */}
              <View style={styles.enhancedDurationPreviewContainer}>
                <Text style={styles.enhancedDurationPreviewLabel}>Selected Duration</Text>
                <View style={styles.enhancedDurationPreviewBox}>
                  <LinearGradient
                    colors={["rgba(0, 229, 255, 0.15)", "rgba(156, 108, 218, 0.15)"]}
                    style={styles.enhancedDurationPreviewGradient}
                  >
                    <Text style={styles.enhancedDurationPreviewText}>
                      {formatDuration(durationHours, durationMinutes, durationSeconds)}
                    </Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Enhanced Confirm Button */}
              <TouchableOpacity
                style={styles.enhancedDurationPickerConfirmButton}
                onPress={confirmDuration}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[ThemeColors.success, "#44A08D"]}
                  style={styles.enhancedDurationPickerConfirmGradient}
                >
                  <Icon name="checkmark-circle" size={scale(18)} color="#fff" />
                  <Text style={styles.enhancedDurationPickerConfirmText}>Confirm Duration</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  ), [durationHours, durationMinutes, durationSeconds, confirmDuration]);

  // Enhanced compact date picker
  const renderCompactDatePicker = useCallback((
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
                <Icon name="close" size={scale(18)} color={ThemeColors.textSecondary} />
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
                          dateObj.year === year && styles.enhancedDatePickerItemSelected,
                        ]}
                        onPress={() => setDateObj({ ...dateObj, year })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDatePickerItemText,
                            dateObj.year === year && styles.enhancedDatePickerItemTextSelected,
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
                          dateObj.month === month && styles.enhancedDatePickerItemSelected,
                        ]}
                        onPress={() => setDateObj({ ...dateObj, month })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDatePickerItemText,
                            dateObj.month === month && styles.enhancedDatePickerItemTextSelected,
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
                          dateObj.day === day && styles.enhancedDatePickerItemSelected,
                        ]}
                        onPress={() => setDateObj({ ...dateObj, day })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.enhancedDatePickerItemText,
                            dateObj.day === day && styles.enhancedDatePickerItemTextSelected,
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
                  <Icon name="checkmark-circle" size={scale(18)} color="#fff" />
                  <Text style={styles.enhancedDatePickerConfirmText}>Confirm Date</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  ), []);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.compactModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
            style={styles.compactModalGradient}
          >
            {/* Compact Header */}
            <View style={styles.compactModalHeader}>
              <View style={styles.compactHeaderLeft}>
                <View style={styles.compactHeaderIcon}>
                  <Icon name="add-circle" size={scale(20)} color={ThemeColors.primary} />
                </View>
                <Text style={styles.compactModalTitle}>Add Activity</Text>
              </View>
              
              <TouchableOpacity
                style={styles.compactCloseButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={scale(18)} color={ThemeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Compact Content */}
            <ScrollView
              style={styles.compactScrollView}
              contentContainerStyle={styles.compactScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input - Compact */}
              <View style={styles.compactFormGroup}>
                <Text style={styles.compactFormLabel}>Activity Title</Text>
                <View style={[
                  styles.compactInputContainer,
                  errors.title && styles.inputError
                ]}>
                  <TextInput
                    style={[
                      styles.compactInput,
                      { fontSize: scale(14) * fontSizeMultiplier }
                    ]}
                    placeholder="Enter activity title"
                    placeholderTextColor={ThemeColors.textTertiary}
                    value={newActivity.title}
                    onChangeText={(text) => {
                      setNewActivity(prev => ({ ...prev, title: text }));
                      if (errors.title) {
                        setErrors(prev => ({ ...prev, title: "" }));
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
                {errors.title && <Text style={styles.compactErrorText}>{errors.title}</Text>}
              </View>

              {/* Category Slider - Horizontal */}
              <View style={styles.compactFormGroup}>
                <Text style={styles.compactFormLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categorySliderContent}
                  style={styles.categorySlider}
                >
                  {CATEGORIES.map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categorySliderItem,
                        newActivity.category === category.id && styles.categorySliderItemSelected,
                        { marginRight: index === CATEGORIES.length - 1 ? scale(20) : scale(12) }
                      ]}
                      onPress={() => setNewActivity(prev => ({ ...prev, category: category.id as any }))}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          newActivity.category === category.id
                            ? [category.color, `${category.color}CC`]
                            : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.04)"]
                        }
                        style={styles.categorySliderGradient}
                      >
                        <Icon
                          name={category.icon}
                          size={scale(16)}
                          color={
                            newActivity.category === category.id 
                              ? "#fff" 
                              : ThemeColors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.categorySliderText,
                            newActivity.category === category.id && styles.categorySliderTextSelected,
                          ]}
                        >
                          {category.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Enhanced Duration Input - Smaller and Better Design */}
              <View style={styles.compactFormGroup}>
                <Text style={styles.compactFormLabel}>Duration</Text>
                <TouchableOpacity
                  style={[
                    styles.enhancedDurationInputContainer,
                    errors.duration && styles.inputError
                  ]}
                  onPress={() => setShowDurationPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.enhancedDurationInputContent}>
                    <Text style={styles.enhancedDurationInputValue}>
                      {newActivity.duration || "00:00:00"}
                    </Text>
                    <Text style={styles.enhancedDurationInputHint}>Tap to select</Text>
                  </View>
                  <Icon 
                    name="time-outline" 
                    size={scale(16)} 
                    color={ThemeColors.primary} 
                  />
                </TouchableOpacity>
                {errors.duration ? (
                  <Text style={styles.compactErrorText}>{errors.duration}</Text>
                ) : (
                  <Text style={styles.compactHelpText}>Format: HH:MM:SS</Text>
                )}
              </View>

              {/* Date Range - Compact */}
              <View style={styles.compactFormGroup}>
                <Text style={styles.compactFormLabel}>Date Range</Text>
                <View style={styles.compactDateRangeContainer}>
                  <TouchableOpacity
                    style={[styles.compactDateInput, errors.startDate && styles.inputError]}
                    onPress={() => setShowStartDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.compactDateInputContent}>
                      <Text style={styles.compactDateLabel}>Start</Text>
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
                    style={[styles.compactDateInput, errors.endDate && styles.inputError]}
                    onPress={() => setShowEndDatePicker(true)}
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
                          marginRight: index === ACTIVITY_COLORS.length - 1 ? scale(20) : scale(10)
                        },
                        newActivity.color === color && styles.colorSliderItemSelected,
                      ]}
                      onPress={() => setNewActivity(prev => ({ ...prev, color }))}
                      activeOpacity={0.8}
                    >
                      {newActivity.color === color && (
                        <Icon name="checkmark" size={scale(14)} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.compactColorPreview}>
                  <Text style={styles.compactColorPreviewLabel}>Selected:</Text>
                  <View
                    style={[
                      styles.compactColorPreviewBox,
                      { backgroundColor: newActivity.color }
                    ]}
                  />
                  <Text style={styles.compactColorPreviewText}>{newActivity.color}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Enhanced Footer Actions */}
            <View style={styles.compactModalFooter}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                  style={styles.compactCancelButtonGradient}
                >
                  <Icon name="close-circle-outline" size={scale(16)} color={ThemeColors.textSecondary} />
                  <Text style={styles.compactCancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Animated.View style={[styles.compactAddButton, { transform: [{ scale: buttonPulseAnim }] }]}>
                <TouchableOpacity
                  style={styles.compactAddButtonTouchable}
                  onPress={handleAddActivity}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[ThemeColors.primary, ThemeColors.secondary, ThemeColors.success]}
                    style={[
                      styles.compactAddButtonGradient,
                      isLoading && styles.compactAddButtonDisabled
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="rocket" size={scale(18)} color="#fff" />
                        <Text style={styles.compactAddButtonText}>Create Activity</Text>
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

        {/* Enhanced Date Picker Modals */}
        {showStartDatePicker && renderCompactDatePicker(
          true,
          startDateObj,
          setStartDateObj,
          confirmStartDate,
          () => setShowStartDatePicker(false)
        )}

        {showEndDatePicker && renderCompactDatePicker(
          false,
          endDateObj,
          setEndDateObj,
          confirmEndDate,
          () => setShowEndDatePicker(false)
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
    maxHeight: height * 0.85,
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
  },
  compactModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
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
    fontSize: scale(18),
    fontWeight: "700",
    letterSpacing: 0.3,
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
  },
  compactScrollContent: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
  compactFormGroup: {
    marginBottom: scale(16),
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
  // Category Slider Styles
  categorySlider: {
    marginBottom: scale(8),
  },
  categorySliderContent: {
    paddingHorizontal: scale(4),
  },
  categorySliderItem: {
    borderRadius: scale(8),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  categorySliderItemSelected: {
    elevation: 4,
    shadowOpacity: 0.3,
  },
  categorySliderGradient: {
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
  categorySliderText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  categorySliderTextSelected: {
    color: "#fff",
  },
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
  enhancedDurationInputContent: {
    flex: 1,
  },
  enhancedDurationInputValue: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(1),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: ThemeColors.border,
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Enhanced Footer Styles
  compactModalFooter: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
    borderTopWidth: 0.5,
    borderTopColor: ThemeColors.border,
    gap: scale(12),
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
  enhancedDurationPickerContainer: {
    width: "100%",
    maxWidth: scale(380),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  enhancedDurationPickerGradient: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  enhancedDurationPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
  },
  enhancedDurationPickerHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  enhancedDurationPickerIconContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
    marginRight: scale(14),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  enhancedDurationPickerIconGradient: {
    width: scale(44),
    height: scale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedDurationPickerTitle: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  enhancedDurationPickerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(13),
    fontWeight: "500",
  },
  enhancedDurationPickerClose: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedDurationPickerContent: {
    padding: scale(24),
  },
  enhancedDurationPickerColumns: {
    flexDirection: "row",
    gap: scale(16),
    marginBottom: scale(24),
  },
  enhancedDurationPickerColumn: {
    flex: 1,
  },
  enhancedDurationColumnLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(12),
  },
  enhancedDurationColumnScroll: {
    height: scale(140),
    borderRadius: scale(12),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  enhancedDurationScrollContent: {
    paddingVertical: scale(8),
  },
  enhancedDurationPickerItem: {
    paddingVertical: scale(10),
    alignItems: "center",
    marginHorizontal: scale(8),
    borderRadius: scale(8),
  },
  enhancedDurationPickerItemSelected: {
    backgroundColor: "rgba(76, 206, 196, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(76, 206, 196, 0.4)",
  },
  enhancedDurationPickerItemText: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  enhancedDurationPickerItemTextSelected: {
    color: ThemeColors.success,
    fontWeight: "700",
  },
  enhancedDurationPreviewContainer: {
    alignItems: "center",
    marginBottom: scale(24),
  },
  enhancedDurationPreviewLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(12),
  },
  enhancedDurationPreviewBox: {
    borderRadius: scale(14),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  enhancedDurationPreviewGradient: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(14),
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  enhancedDurationPreviewText: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  enhancedDurationPickerConfirmButton: {
    borderRadius: scale(14),
    overflow: "hidden",
    elevation: 4,
    shadowColor: ThemeColors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  enhancedDurationPickerConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(10),
  },
  enhancedDurationPickerConfirmText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
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
});

export default AddActivityModal;
