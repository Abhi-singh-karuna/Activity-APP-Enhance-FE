import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Task, Category } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import StyledText from "./StyledText";
import { useAppContext } from "../context/AppContext";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Partial<Task>) => void;
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

// Color gradient pairs for visual appeal
const COLOR_GRADIENTS: { [key: string]: string[] } = {
  "#F44336": ["#F44336", "#FF5252"],
  "#E91E63": ["#E91E63", "#FF4081"],
  "#9C27B0": ["#9C27B0", "#D500F9"],
  "#673AB7": ["#673AB7", "#7C4DFF"],
  "#3F51B5": ["#3F51B5", "#536DFE"],
  "#2196F3": ["#2196F3", "#40C4FF"],
  "#03A9F4": ["#03A9F4", "#18FFFF"],
  "#00BCD4": ["#00BCD4", "#64FFDA"],
  "#009688": ["#009688", "#69F0AE"],
  "#4CAF50": ["#4CAF50", "#B2FF59"],
  "#8BC34A": ["#8BC34A", "#EEFF41"],
  "#CDDC39": ["#CDDC39", "#FFFF00"],
  "#FFEB3B": ["#FFEB3B", "#FFD740"],
  "#FFC107": ["#FFC107", "#FFAB40"],
  "#FF9800": ["#FF9800", "#FF6E40"],
  "#FF5722": ["#FF5722", "#FF3D00"],
  "#00E5FF": ["#00E5FF", "#5B86E5"],
  "#5B86E5": ["#5B86E5", "#36D1DC"],
  "#753a88": ["#753a88", "#cc2b5e"],
  "#cc2b5e": ["#cc2b5e", "#ec008c"],
};

// Format a date as YYYY/MM/DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [btnScale] = useState(new Animated.Value(1));
  const { categories } = useAppContext();

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    category: "Personal",
    dueDate: "",
    color: "#00E5FF",
    isCompleted: false,
    priority: 1,
    createdAt: formatDate(new Date()),
  });

  // Date picker states
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Current date for date pickers
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Selected dates
  const [dueDateObj, setDueDateObj] = useState({
    year: currentYear,
    month: currentMonth + 1, // JavaScript months are 0-indexed
    day: currentDay,
  });

  // Generate arrays for picker options
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const priorities = [1, 2, 3, 4, 5]; // 1 is highest priority, 5 is lowest

  // Set due date and update task
  const confirmDueDate = () => {
    const formattedDate = formatDate(
      new Date(dueDateObj.year, dueDateObj.month - 1, dueDateObj.day)
    );
    setNewTask({ ...newTask, dueDate: formattedDate });
    setShowDueDatePicker(false);
  };

  // Animation when modal opens
  useEffect(() => {
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
  }, [visible, fadeAnim, scaleAnim]);

  // Button press animation
  const animateButtonPress = (pressed: boolean) => {
    Animated.spring(btnScale, {
      toValue: pressed ? 0.95 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleAddTask = () => {
    // Validate required fields
    if (!newTask.title) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    if (!newTask.dueDate) {
      Alert.alert("Error", "Please select a due date");
      return;
    }

    onAdd(newTask);
    // Reset form
    setNewTask({
      title: "",
      description: "",
      category: "Personal",
      dueDate: "",
      color: "#00E5FF",
      isCompleted: false,
      priority: 1,
      createdAt: formatDate(new Date()),
    });
    setShowDueDatePicker(false);
    setShowColorPicker(false);
    setShowPriorityPicker(false);
  };

  // Adjust sizing based on font size multiplier
  const inputHeight = 50;
  const buttonHeight = 44;
  const iconSize = 18;
  const padding = 15;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={["#1E1E1E", "#121212"]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <StyledText variant="title" style={styles.modalTitle}>
                  Add New Task
                </StyledText>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Task Title Input */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Title
                  </StyledText>
                  <TextInput
                    style={[styles.textInput, { height: inputHeight }]}
                    placeholder="Enter task title"
                    placeholderTextColor="#666"
                    value={newTask.title}
                    onChangeText={(text) =>
                      setNewTask({ ...newTask, title: text })
                    }
                  />
                </View>

                {/* Task Description Input */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Description (Optional)
                  </StyledText>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      { height: inputHeight * 2 },
                    ]}
                    placeholder="Enter task description"
                    placeholderTextColor="#666"
                    value={newTask.description}
                    onChangeText={(text) =>
                      setNewTask({ ...newTask, description: text })
                    }
                    multiline={true}
                    textAlignVertical="top"
                  />
                </View>

                {/* Category Selection */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Category
                  </StyledText>
                  <View style={styles.categoryContainer}>
                    {["Personal", "Work", "Workout", "Learning"].map(
                      (category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryOption,
                            newTask.category === category &&
                              styles.categoryOptionSelected,
                            { height: buttonHeight },
                          ]}
                          onPress={() =>
                            setNewTask({
                              ...newTask,
                              category: category as Category,
                            })
                          }
                        >
                          <Icon
                            name={
                              category === "Personal"
                                ? "person-outline"
                                : category === "Work"
                                ? "briefcase-outline"
                                : category === "Workout"
                                ? "fitness-outline"
                                : "book-outline"
                            }
                            size={iconSize}
                            color={
                              newTask.category === category ? "#000" : "#fff"
                            }
                          />
                          <StyledText
                            variant="body"
                            style={[
                              styles.categoryOptionText,
                              newTask.category === category &&
                                styles.categoryOptionTextSelected,
                            ]}
                          >
                            {category}
                          </StyledText>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Priority Selection */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Priority (1-5)
                  </StyledText>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { height: buttonHeight }]}
                    onPress={() => setShowPriorityPicker(true)}
                  >
                    <StyledText variant="body" style={styles.datePickerText}>
                      {newTask.priority
                        ? `Priority ${newTask.priority} - ${
                            newTask.priority === 1
                              ? "Highest"
                              : newTask.priority === 5
                              ? "Lowest"
                              : ""
                          }`
                        : "Select Priority"}
                    </StyledText>
                    <Icon name="chevron-down" size={iconSize} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Due Date Selection */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Due Date
                  </StyledText>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { height: buttonHeight }]}
                    onPress={() => setShowDueDatePicker(true)}
                  >
                    <StyledText variant="body" style={styles.datePickerText}>
                      {newTask.dueDate || "Select Due Date"}
                    </StyledText>
                    <Icon
                      name="calendar-outline"
                      size={iconSize}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {/* Color Selection */}
                <View style={styles.inputContainer}>
                  <StyledText variant="body" style={styles.inputLabel}>
                    Color
                  </StyledText>
                  <View style={styles.colorPreviewContainer}>
                    <TouchableOpacity
                      style={[
                        styles.colorPreview,
                        { backgroundColor: newTask.color },
                        styles.elevatedItem,
                      ]}
                      onPress={() => {
                        // Add haptic feedback if available
                        if (
                          Platform.OS === "ios" ||
                          Platform.OS === "android"
                        ) {
                          try {
                            Keyboard.dismiss();
                            // This would require react-native-haptic-feedback in a real app
                          } catch (error) {
                            console.log("Haptic feedback not available");
                          }
                        }
                        setShowColorPicker(true);
                      }}
                    />
                    <StyledText variant="body" style={styles.colorText}>
                      Tap to select a color
                    </StyledText>
                  </View>
                </View>

                {/* Priority Picker Modal */}
                {showPriorityPicker && (
                  <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <StyledText
                          variant="subtitle"
                          style={styles.pickerTitle}
                        >
                          Select Priority
                        </StyledText>
                        <TouchableOpacity
                          onPress={() => setShowPriorityPicker(false)}
                        >
                          <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.priorityButtonsContainer}>
                        {priorities.map((priority) => (
                          <TouchableOpacity
                            key={priority}
                            style={[
                              styles.priorityButton,
                              newTask.priority === priority &&
                                styles.selectedPriorityButton,
                              {
                                backgroundColor:
                                  priority === 1
                                    ? "#FF5722"
                                    : priority === 2
                                    ? "#FFC107"
                                    : priority === 3
                                    ? "#4CAF50"
                                    : priority === 4
                                    ? "#2196F3"
                                    : "#9C27B0",
                              },
                            ]}
                            onPress={() => {
                              setNewTask({ ...newTask, priority });
                              setShowPriorityPicker(false);
                            }}
                          >
                            <StyledText
                              variant="body"
                              style={styles.priorityButtonText}
                            >
                              {priority}
                              {priority === 1
                                ? " - Highest"
                                : priority === 5
                                ? " - Lowest"
                                : ""}
                            </StyledText>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowPriorityPicker(false)}
                      >
                        <StyledText
                          variant="body"
                          style={styles.cancelButtonText}
                        >
                          Cancel
                        </StyledText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Date Picker Modal */}
                {showDueDatePicker && (
                  <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <StyledText
                          variant="subtitle"
                          style={styles.pickerTitle}
                        >
                          Select Due Date
                        </StyledText>
                        <TouchableOpacity
                          onPress={() => setShowDueDatePicker(false)}
                        >
                          <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.datePickerContainer}>
                        {/* Year Picker */}
                        <ScrollView
                          style={[styles.datePickerColumn, { flex: 2 }]}
                          showsVerticalScrollIndicator={false}
                        >
                          {years.map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.datePickerItem,
                                dueDateObj.year === year &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setDueDateObj({
                                  ...dueDateObj,
                                  year,
                                })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={
                                  dueDateObj.year === year
                                    ? styles.datePickerTextSelected
                                    : styles.datePickerItemText
                                }
                              >
                                {year}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Month Picker */}
                        <ScrollView
                          style={[styles.datePickerColumn, { flex: 1 }]}
                          showsVerticalScrollIndicator={false}
                        >
                          {months.map((month) => (
                            <TouchableOpacity
                              key={month}
                              style={[
                                styles.datePickerItem,
                                dueDateObj.month === month &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setDueDateObj({
                                  ...dueDateObj,
                                  month,
                                })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={
                                  dueDateObj.month === month
                                    ? styles.datePickerTextSelected
                                    : styles.datePickerItemText
                                }
                              >
                                {month}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Day Picker */}
                        <ScrollView
                          style={[styles.datePickerColumn, { flex: 1 }]}
                          showsVerticalScrollIndicator={false}
                        >
                          {days.map((day) => (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.datePickerItem,
                                dueDateObj.day === day &&
                                  styles.datePickerItemSelected,
                              ]}
                              onPress={() =>
                                setDueDateObj({
                                  ...dueDateObj,
                                  day,
                                })
                              }
                            >
                              <StyledText
                                variant="body"
                                style={
                                  dueDateObj.day === day
                                    ? styles.datePickerTextSelected
                                    : styles.datePickerItemText
                                }
                              >
                                {day}
                              </StyledText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                      <View style={styles.pickerButtonsContainer}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setShowDueDatePicker(false)}
                        >
                          <StyledText
                            variant="body"
                            style={styles.cancelButtonText}
                          >
                            Cancel
                          </StyledText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={confirmDueDate}
                        >
                          <StyledText
                            variant="body"
                            style={styles.confirmButtonText}
                          >
                            Confirm
                          </StyledText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Color Picker Modal */}
                {showColorPicker && (
                  <View style={styles.pickerOverlay}>
                    <Animated.View
                      style={[
                        styles.pickerContainer,
                        { transform: [{ scale: fadeAnim }] },
                      ]}
                    >
                      <View style={styles.pickerHeader}>
                        <StyledText
                          variant="subtitle"
                          style={styles.pickerTitle}
                        >
                          Select Color
                        </StyledText>
                        <TouchableOpacity
                          onPress={() => setShowColorPicker(false)}
                        >
                          <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.colorPickerContainer}>
                        <StyledText
                          variant="subtitle"
                          style={styles.colorSectionTitle}
                        >
                          Suggested Colors
                        </StyledText>
                        <View style={styles.colorPickerRow}>
                          {PREDEFINED_COLORS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorOption,
                                newTask.color === color && styles.selectedColor,
                              ]}
                              onPress={() => {
                                setNewTask({ ...newTask, color });
                                setShowColorPicker(false);
                              }}
                            >
                              <LinearGradient
                                colors={
                                  COLOR_GRADIENTS[color]
                                    ? [
                                        COLOR_GRADIENTS[color][0],
                                        COLOR_GRADIENTS[color][1],
                                      ]
                                    : [color, color]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.colorGradient}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>

                        <StyledText
                          variant="subtitle"
                          style={styles.colorSectionTitle}
                        >
                          All Colors
                        </StyledText>

                        <View style={styles.colorPaletteGrid}>
                          {COLOR_PALETTE.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorPaletteOption,
                                newTask.color === color &&
                                  styles.selectedPaletteColor,
                              ]}
                              onPress={() => {
                                setNewTask({ ...newTask, color });
                                setShowColorPicker(false);
                              }}
                            >
                              <LinearGradient
                                colors={
                                  COLOR_GRADIENTS[color]
                                    ? [
                                        COLOR_GRADIENTS[color][0],
                                        COLOR_GRADIENTS[color][1],
                                      ]
                                    : [color, color]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.colorGradient}
                              />
                              {newTask.color === color && (
                                <View style={styles.colorCheckmark}>
                                  <Icon
                                    name="checkmark"
                                    size={14}
                                    color="#fff"
                                  />
                                </View>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={styles.pickerButtonsContainer}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setShowColorPicker(false)}
                        >
                          <StyledText
                            variant="body"
                            style={styles.cancelButtonText}
                          >
                            Cancel
                          </StyledText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confirmButton,
                            { backgroundColor: newTask.color },
                          ]}
                          onPress={() => setShowColorPicker(false)}
                        >
                          <StyledText
                            variant="body"
                            style={styles.confirmButtonText}
                          >
                            Apply
                          </StyledText>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  </View>
                )}

                {/* Add Task Button */}
                <Animated.View
                  style={{
                    transform: [{ scale: btnScale }],
                    marginTop: 16,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { height: buttonHeight, padding: padding },
                      styles.elevatedItem,
                    ]}
                    onPress={handleAddTask}
                    onPressIn={() => animateButtonPress(true)}
                    onPressOut={() => animateButtonPress(false)}
                  >
                    <Icon name="add" size={iconSize} color="#000" />
                    <StyledText variant="body" style={styles.addButtonText}>
                      Add Task
                    </StyledText>
                  </TouchableOpacity>
                </Animated.View>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalContent: {
    height: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  modalBody: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    color: "#ddd",
  },
  textInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryOptionSelected: {
    backgroundColor: "#00E5FF",
  },
  categoryOptionText: {
    marginLeft: 8,
    color: "#fff",
  },
  categoryOptionTextSelected: {
    color: "#000",
    fontWeight: "bold",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerText: {
    color: "#fff",
  },
  colorPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  colorText: {
    color: "#aaa",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  pickerContainer: {
    width: "90%",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  datePickerContainer: {
    flexDirection: "row",
    height: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  datePickerColumn: {
    flex: 1,
    paddingVertical: 8,
  },
  datePickerItem: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerItemSelected: {
    backgroundColor: "#2C2C2E",
  },
  datePickerItemText: {
    color: "#aaa",
  },
  datePickerTextSelected: {
    color: "#00E5FF",
    fontWeight: "bold",
  },
  pickerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  confirmButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  colorPickerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  colorSectionTitle: {
    marginBottom: 12,
    color: "#fff",
    fontSize: 16,
  },
  colorPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 10,
    padding: 2,
    backgroundColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  colorGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  colorPaletteTitle: {
    marginBottom: 12,
    color: "#ddd",
  },
  colorPaletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorPaletteOption: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPaletteColor: {
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ scale: 1.05 }],
  },
  colorCheckmark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -10,
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#000",
    fontWeight: "bold",
    marginLeft: 8,
  },
  priorityButtonsContainer: {
    flexDirection: "column",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  priorityButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  selectedPriorityButton: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  priorityButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  elevatedItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AddTaskModal;
