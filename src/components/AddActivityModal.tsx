import React, { useState, useRef } from "react";
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
  Alert,
  Animated,
  Easing,
  BackHandler,
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

// Predefined colors for quick selection
const PREDEFINED_COLORS = [
  "#00E5FF", // cyan
  "#5B86E5", // blue
  "#753a88", // purple
  "#cc2b5e", // pink
  "#FF5722", // orange
  "#4CAF50", // green
  "#FFC107", // amber
  "#9C27B0", // deep purple
];

// Color palette for custom selection
const COLOR_PALETTE = [
  // Row 1: Reds and Pinks
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  // Row 2: Purples and Blues
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  // Row 3: Teals and Greens
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  // Row 4: Yellows and Oranges
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: "",
    category: "Personal",
    startDate: "",
    endDate: "",
    color: "#00E5FF",
    duration: "00:00:00", // Default duration in HH:MM:SS format
  });

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Current date for date pickers
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Selected dates
  const [startDateObj, setStartDateObj] = useState({
    year: currentYear,
    month: currentMonth + 1, // JavaScript months are 0-indexed
    day: currentDay,
  });

  const [endDateObj, setEndDateObj] = useState({
    year: currentYear,
    month: currentMonth + 1,
    day: currentDay,
  });

  // Generate arrays for picker options
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Format date as YYYY/MM/DD
  const formatDate = (dateObj: {
    year: number;
    month: number;
    day: number;
  }) => {
    return `${dateObj.year}/${String(dateObj.month).padStart(2, "0")}/${String(
      dateObj.day
    ).padStart(2, "0")}`;
  };

  // Set start date and update activity
  const confirmStartDate = () => {
    const formattedDate = formatDate(startDateObj);
    setNewActivity({ ...newActivity, startDate: formattedDate });
    setShowStartDatePicker(false);
  };

  // Set end date and update activity
  const confirmEndDate = () => {
    const formattedDate = formatDate(endDateObj);
    setNewActivity({ ...newActivity, endDate: formattedDate });
    setShowEndDatePicker(false);
  };

  // Validate the duration format (HH:MM:SS)
  const isValidDuration = (duration: string): boolean => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    return regex.test(duration);
  };

  const handleAddActivity = () => {
    // Validate required fields
    if (!newActivity.title) {
      Alert.alert("Error", "Please enter an activity title");
      return;
    }

    if (!newActivity.startDate) {
      Alert.alert("Error", "Please select a start date");
      return;
    }

    if (!newActivity.endDate) {
      Alert.alert("Error", "Please select an end date");
      return;
    }

    if (!newActivity.duration) {
      Alert.alert("Error", "Please enter a duration");
      return;
    }

    if (!isValidDuration(newActivity.duration)) {
      Alert.alert(
        "Error",
        "Please enter a valid duration in 24-hour format (HH:MM:SS)"
      );
      return;
    }

    onAdd(newActivity);
    // Reset form
    setNewActivity({
      title: "",
      category: "Personal",
      startDate: "",
      endDate: "",
      color: "#00E5FF",
      duration: "00:00:00",
    });
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setShowColorPicker(false);
  };

  // Animation when modal opens
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  // Handle Android back button
  React.useEffect(() => {
    const handleAndroidBackPress = () => {
      if (showStartDatePicker) {
        setShowStartDatePicker(false);
        return true;
      }
      if (showEndDatePicker) {
        setShowEndDatePicker(false);
        return true;
      }
      if (showColorPicker) {
        setShowColorPicker(false);
        return true;
      }
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };

    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleAndroidBackPress
      );

      return () => {
        subscription.remove();
      };
    }

    return undefined;
  }, [
    visible,
    showStartDatePicker,
    showEndDatePicker,
    showColorPicker,
    onClose,
  ]);

  // Get font size multiplier from context
  const { fontSizeMultiplier } = useAppContext();

  return (
    <Modal
      animationType="none" // Using our own animations
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={["#1E1E1E", "#2C2C2E"]}
              style={styles.modalContentGradient}
            >
              <View style={styles.modalHeader}>
                <StyledText variant="title" style={styles.modalTitle}>
                  Add New Activity
                </StyledText>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    style={styles.addActivityButtonTop}
                    onPress={handleAddActivity}
                  >
                    <Icon
                      name="add-circle-outline"
                      size={18}
                      color="#000"
                      style={styles.addButtonIcon}
                    />
                    <StyledText
                      variant="body"
                      style={styles.addActivityButtonTextTop}
                    >
                      Add
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.formGroup}>
                  <StyledText variant="subtitle" style={styles.formLabel}>
                    Title
                  </StyledText>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[
                        styles.input,
                        { fontSize: 16 * fontSizeMultiplier },
                      ]}
                      placeholder="Enter activity title"
                      placeholderTextColor="#888"
                      value={newActivity.title}
                      onChangeText={(text) =>
                        setNewActivity({ ...newActivity, title: text })
                      }
                    />
                    <Icon
                      name="create-outline"
                      size={20}
                      color="#555"
                      style={styles.inputIcon}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <StyledText variant="subtitle" style={styles.formLabel}>
                    Category
                  </StyledText>
                  <View style={styles.categoryButtonsCompact}>
                    {["Personal", "Work", "Workout"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButtonCompact,
                          newActivity.category === cat &&
                            styles.categoryButtonActiveCompact,
                        ]}
                        onPress={() =>
                          setNewActivity({
                            ...newActivity,
                            category: cat as any,
                          })
                        }
                      >
                        <Icon
                          name={
                            cat === "Personal"
                              ? "person-outline"
                              : cat === "Work"
                              ? "briefcase-outline"
                              : "fitness-outline"
                          }
                          size={16}
                          color={newActivity.category === cat ? "#000" : "#888"}
                          style={styles.categoryIcon}
                        />
                        <StyledText
                          variant="body"
                          style={[
                            styles.categoryButtonTextCompact,
                            newActivity.category === cat &&
                              styles.categoryButtonTextActiveCompact,
                          ]}
                        >
                          {cat}
                        </StyledText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <StyledText variant="subtitle" style={styles.formLabel}>
                    Duration (HH:MM:SS)
                  </StyledText>
                  <View style={styles.durationInputContainer}>
                    <TextInput
                      style={[
                        styles.durationInput,
                        { fontSize: 16 * fontSizeMultiplier },
                      ]}
                      placeholder="00:00:00"
                      placeholderTextColor="#888"
                      value={newActivity.duration}
                      onChangeText={(text) =>
                        setNewActivity({ ...newActivity, duration: text })
                      }
                      keyboardType="numbers-and-punctuation"
                      maxLength={8}
                    />
                    <Icon
                      name="time-outline"
                      size={20}
                      color="#00E5FF"
                      style={styles.durationIcon}
                    />
                    <StyledText
                      variant="caption"
                      style={styles.durationHelpText}
                    >
                      Format: 01:30:00 (1h 30m)
                    </StyledText>
                  </View>
                </View>

                {/* Date inputs in one line */}
                <View style={styles.formGroup}>
                  <StyledText variant="subtitle" style={styles.formLabel}>
                    Date Range
                  </StyledText>
                  <View style={styles.dateRangeContainer}>
                    <TouchableOpacity
                      style={styles.dateInputHalf}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <StyledText
                        variant="caption"
                        style={styles.dateInputLabel}
                      >
                        Start
                      </StyledText>
                      <View style={styles.dateInputContent}>
                        <StyledText variant="body" style={styles.dateInputText}>
                          {newActivity.startDate || "Select"}
                        </StyledText>
                        <Icon
                          name="calendar-outline"
                          size={18}
                          color="#00E5FF"
                        />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.dateRangeSeparator}>
                      <Icon name="arrow-forward" size={16} color="#555" />
                    </View>

                    <TouchableOpacity
                      style={styles.dateInputHalf}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <StyledText
                        variant="caption"
                        style={styles.dateInputLabel}
                      >
                        End
                      </StyledText>
                      <View style={styles.dateInputContent}>
                        <StyledText variant="body" style={styles.dateInputText}>
                          {newActivity.endDate || "Select"}
                        </StyledText>
                        <Icon
                          name="calendar-outline"
                          size={18}
                          color="#00E5FF"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.colorLabelContainer}>
                    <StyledText variant="subtitle" style={styles.formLabel}>
                      Color
                    </StyledText>
                    <TouchableOpacity
                      style={styles.customColorButton}
                      onPress={() => setShowColorPicker(true)}
                    >
                      <StyledText
                        variant="body"
                        style={styles.customColorButtonText}
                      >
                        More
                      </StyledText>
                      <Icon
                        name="color-palette-outline"
                        size={16}
                        color="#00E5FF"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Quick color selection - Compact grid */}
                  <View style={styles.colorPickerCompact}>
                    {PREDEFINED_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOptionCompact,
                          { backgroundColor: color },
                          newActivity.color === color &&
                            styles.colorOptionSelected,
                        ]}
                        onPress={() =>
                          setNewActivity({ ...newActivity, color })
                        }
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.colorPreviewContainer}>
                  <StyledText
                    variant="caption"
                    style={styles.colorPreviewLabel}
                  >
                    Selected:
                  </StyledText>
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: newActivity.color || "#00E5FF" },
                    ]}
                  />
                  <StyledText variant="body" style={styles.colorPreviewText}>
                    {newActivity.color}
                  </StyledText>
                </View>
              </ScrollView>

              {/* Custom Color Picker Modal */}
              {showColorPicker && (
                <View style={styles.colorPickerContainer}>
                  <TouchableOpacity
                    style={styles.modalBackdropClose}
                    onPress={() => setShowColorPicker(false)}
                  >
                    <Icon
                      name="close-circle"
                      size={36}
                      color="rgba(255,255,255,0.7)"
                    />
                  </TouchableOpacity>
                  <View style={styles.colorPickerContent}>
                    <View style={styles.colorPickerHeader}>
                      <StyledText
                        variant="subtitle"
                        style={styles.colorPickerTitle}
                      >
                        Choose a Color
                      </StyledText>
                      <TouchableOpacity
                        onPress={() => setShowColorPicker(false)}
                      >
                        <Icon name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.colorPaletteContainer}>
                      <StyledText
                        variant="subtitle"
                        style={styles.colorPaletteTitle}
                      >
                        Color Palette
                      </StyledText>
                      <View style={styles.colorPaletteGrid}>
                        {COLOR_PALETTE.map((color) => (
                          <TouchableOpacity
                            key={color}
                            style={[
                              styles.colorPaletteItem,
                              { backgroundColor: color },
                              newActivity.color === color &&
                                styles.colorPaletteItemSelected,
                            ]}
                            onPress={() => {
                              setNewActivity({ ...newActivity, color });
                            }}
                          />
                        ))}
                      </View>
                    </View>

                    <LinearGradient
                      colors={[
                        "#ff0000",
                        "#ffff00",
                        "#00ff00",
                        "#00ffff",
                        "#0000ff",
                        "#ff00ff",
                        "#ff0000",
                      ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.colorGradient}
                    >
                      <View style={styles.colorSlider}>
                        {/* This is just a visual representation - in a real app you'd implement a color slider */}
                      </View>
                    </LinearGradient>

                    <TouchableOpacity
                      style={styles.colorPickerConfirmButton}
                      onPress={() => setShowColorPicker(false)}
                    >
                      <StyledText
                        variant="body"
                        style={styles.colorPickerConfirmText}
                      >
                        Confirm
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Start Date Picker Modal */}
              {showStartDatePicker && (
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity
                    style={styles.modalBackdropClose}
                    onPress={() => setShowStartDatePicker(false)}
                  >
                    <Icon
                      name="close-circle"
                      size={36}
                      color="rgba(255,255,255,0.7)"
                    />
                  </TouchableOpacity>
                  <View style={styles.datePickerContent}>
                    <View style={styles.datePickerHeader}>
                      <StyledText
                        variant="subtitle"
                        style={styles.datePickerTitle}
                      >
                        Select Start Date
                      </StyledText>
                      <TouchableOpacity
                        onPress={() => setShowStartDatePicker(false)}
                      >
                        <Icon name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.datePickerControls}>
                      {/* Month Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Month
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {months.map((month) => (
                            <TouchableOpacity
                              key={`month-${month}`}
                              style={[
                                styles.datePickerItem,
                                startDateObj.month === month &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setStartDateObj({ ...startDateObj, month })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  startDateObj.month === month &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {String(month).padStart(2, "0")}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Day Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Day
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {days.map((day) => (
                            <TouchableOpacity
                              key={`day-${day}`}
                              style={[
                                styles.datePickerItem,
                                startDateObj.day === day &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setStartDateObj({ ...startDateObj, day })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  startDateObj.day === day &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {String(day).padStart(2, "0")}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Year Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Year
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {years.map((year) => (
                            <TouchableOpacity
                              key={`year-${year}`}
                              style={[
                                styles.datePickerItem,
                                startDateObj.year === year &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setStartDateObj({ ...startDateObj, year })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  startDateObj.year === year &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {year}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.datePickerConfirmButton}
                      onPress={confirmStartDate}
                    >
                      <StyledText
                        variant="body"
                        style={styles.datePickerConfirmText}
                      >
                        Confirm
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* End Date Picker Modal */}
              {showEndDatePicker && (
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity
                    style={styles.modalBackdropClose}
                    onPress={() => setShowEndDatePicker(false)}
                  >
                    <Icon
                      name="close-circle"
                      size={36}
                      color="rgba(255,255,255,0.7)"
                    />
                  </TouchableOpacity>
                  <View style={styles.datePickerContent}>
                    <View style={styles.datePickerHeader}>
                      <StyledText
                        variant="subtitle"
                        style={styles.datePickerTitle}
                      >
                        Select End Date
                      </StyledText>
                      <TouchableOpacity
                        onPress={() => setShowEndDatePicker(false)}
                      >
                        <Icon name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.datePickerControls}>
                      {/* Month Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Month
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {months.map((month) => (
                            <TouchableOpacity
                              key={`month-${month}`}
                              style={[
                                styles.datePickerItem,
                                endDateObj.month === month &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setEndDateObj({ ...endDateObj, month })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  endDateObj.month === month &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {String(month).padStart(2, "0")}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Day Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Day
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {days.map((day) => (
                            <TouchableOpacity
                              key={`day-${day}`}
                              style={[
                                styles.datePickerItem,
                                endDateObj.day === day &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setEndDateObj({ ...endDateObj, day })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  endDateObj.day === day &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {String(day).padStart(2, "0")}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Year Selector */}
                      <View style={styles.datePickerColumn}>
                        <StyledText
                          variant="caption"
                          style={styles.datePickerLabel}
                        >
                          Year
                        </StyledText>
                        <ScrollView
                          style={styles.datePickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {years.map((year) => (
                            <TouchableOpacity
                              key={`year-${year}`}
                              style={[
                                styles.datePickerItem,
                                endDateObj.year === year &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setEndDateObj({ ...endDateObj, year })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={[
                                  styles.datePickerItemText,
                                  endDateObj.year === year &&
                                    styles.datePickerItemTextSelected,
                                ]}
                              >
                                {year}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.datePickerConfirmButton}
                      onPress={confirmEndDate}
                    >
                      <StyledText
                        variant="body"
                        style={styles.datePickerConfirmText}
                      >
                        Confirm
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    maxHeight: "90%",
  },
  modalContentGradient: {
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  addActivityButtonTop: {
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  addActivityButtonTextTop: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWithIcon: {
    position: "relative",
  },
  input: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: "#444",
  },
  inputIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  dateRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputHalf: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  dateInputLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  dateInputContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRangeSeparator: {
    width: 30,
    alignItems: "center",
  },
  dateInputText: {
    color: "#fff",
    fontSize: 15,
  },
  categoryButtonsCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryButtonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  categoryButtonActiveCompact: {
    backgroundColor: "#00E5FF",
    borderColor: "#00E5FF",
  },
  categoryButtonTextCompact: {
    color: "#888",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryButtonTextActiveCompact: {
    color: "#000",
    fontWeight: "bold",
  },
  colorPickerCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  colorOptionCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  colorPickerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBackdropClose: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1001,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 25,
    padding: 5,
  },
  colorPickerContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  colorPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  colorPaletteContainer: {
    marginBottom: 20,
  },
  colorPaletteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  colorPaletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorPaletteItem: {
    width: 40,
    height: 40,
    margin: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  colorPaletteItemSelected: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorGradient: {
    width: "100%",
    height: 30,
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
  colorSlider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 10,
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  colorPickerConfirmButton: {
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  colorPickerConfirmText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  colorLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  customColorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
  },
  customColorButtonText: {
    color: "#00E5FF",
    fontWeight: "600",
    marginRight: 5,
  },
  colorPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  colorPreviewLabel: {
    fontSize: 14,
    color: "#fff",
    marginRight: 10,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  colorPreviewText: {
    color: "#fff",
    fontSize: 16,
  },
  datePickerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  datePickerContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  datePickerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  datePickerLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  datePickerScroll: {
    height: 200,
    width: "100%",
  },
  datePickerItem: {
    paddingVertical: 12,
    alignItems: "center",
  },
  datePickerItemSelected: {
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    borderRadius: 8,
  },
  datePickerItemText: {
    fontSize: 16,
    color: "#fff",
  },
  datePickerItemTextSelected: {
    color: "#00E5FF",
    fontWeight: "bold",
  },
  datePickerConfirmButton: {
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  datePickerConfirmText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  durationInputContainer: {
    marginTop: 8,
  },
  durationInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  durationIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  durationHelpText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default AddActivityModal;
