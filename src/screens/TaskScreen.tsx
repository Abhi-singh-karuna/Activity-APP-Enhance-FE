import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Modal,
  Animated,
  Vibration,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../navigation";
import { Task, Category } from "../types";
import AddTaskModal from "../components/AddTaskModal";
import StyledText from "../components/StyledText";
import { useAppContext } from "../context/AppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Format date as YYYY/MM/DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

// Mock tasks data
const MOCK_TASKS = [
  {
    id: "1",
    title: "Complete project proposal",
    description: "Finalize the project proposal for the client meeting",
    category: "Work" as Category,
    dueDate: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
    isCompleted: false,
    color: "#5B86E5",
    priority: 1,
    createdAt: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
  },
  {
    id: "2",
    title: "Gym session",
    description: "Leg day workout",
    category: "Workout" as Category,
    dueDate: formatDate(new Date()),
    isCompleted: true,
    color: "#00E5FF",
    priority: 2,
    createdAt: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
  },
  {
    id: "3",
    title: "Read design book",
    description: "Read chapter 3 and 4 about UI/UX principles",
    category: "Learning" as Category,
    dueDate: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago (overdue)
    isCompleted: false,
    color: "#753a88",
    priority: 3,
    createdAt: formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
  },
  {
    id: "4",
    title: "Call mom",
    description: "Weekly check-in call",
    category: "Personal" as Category,
    dueDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
    isCompleted: false,
    color: "#FF5722",
    priority: 2,
    createdAt: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
  },
];

const TaskScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState("TASK");
  const [modalVisible, setModalVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date())
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const [deleteReady, setDeleteReady] = useState(false);

  // Custom date selection states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [dateRangeMode, setDateRangeMode] = useState(false); // true for range, false for single date
  const [customDateLabel, setCustomDateLabel] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [highlightedDates, setHighlightedDates] = useState<number[]>([]);
  const [rangeStartDay, setRangeStartDay] = useState<number | null>(null);
  const [datePickerAnimation] = useState(new Animated.Value(0));

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(0)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;
  const deleteMode = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Add fontSizeMultiplier to ensure text responds to font size changes
  const { fontSizeMultiplier } = useAppContext();

  // Date filtering options
  const dateFilters = [
    { label: "Today", value: formatDate(new Date()) },
    {
      label: "Tomorrow",
      value: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    },
    { label: "This Week", value: "week" },
    { label: "All", value: "all" },
    { label: "Custom", value: "custom" },
  ];

  // Toggle complete status
  const toggleCompleteStatus = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            isCompleted: !task.isCompleted,
          };
        }
        return task;
      })
    );
  };

  // Reset delete mode
  const resetDeleteMode = () => {
    deleteMode.current = false;
    setLongPressedId(null);
    setDeleteReady(false);

    // Clear any pending timers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Animate out delete UI
    Animated.parallel([
      Animated.timing(deleteScaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle outside touch
  const handleOutsideTouch = () => {
    if (deleteMode.current && longPressedId) {
      resetDeleteMode();
    }
  };

  // Handle long press on task card
  const handleLongPress = (task: Task) => {
    // Vibration feedback
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Vibration.vibrate(100);
    }

    // Set delete mode
    deleteMode.current = true;
    setDeleteReady(true);

    // Animate the delete icon appearance
    setLongPressedId(task.id);
    Animated.parallel([
      Animated.spring(deleteScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle press in for animation
  const handlePressIn = (id: string) => {
    // Only scale if not already in delete mode
    if (!deleteMode.current) {
      setLongPressedId(id);
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Setup timer to track long press but don't show delete UI yet
      longPressTimer.current = setTimeout(() => {
        // This will be triggered after the delayLongPress time,
        // but we don't show red background until handleLongPress is called
      }, 100);
    }
  };

  // Handle press out for animation
  const handlePressOut = () => {
    // Clear any pending timers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only reset if not in delete mode
    if (!deleteMode.current) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setLongPressedId(null);
      });
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  };

  // Handle delete task
  const handleDeleteTask = () => {
    if (!taskToDelete) return;

    // Remove the task from the list
    setTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== taskToDelete.id)
    );

    // Close the delete modal
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  };

  // Handle add task
  const handleAddTask = (newTask: Partial<Task>) => {
    // Create a new task with unique ID
    const task = {
      ...newTask,
      id: Date.now().toString(),
      isCompleted: false,
      createdAt: formatDate(new Date()),
    } as Task;

    // Add to tasks list
    setTasks([...tasks, task]);

    // Close modal
    setModalVisible(false);
  };

  // Get filtered tasks based on selected date
  const getFilteredTasks = () => {
    if (selectedDate === "all") {
      return tasks;
    } else if (selectedDate === "week") {
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      return tasks.filter((task) => {
        const dueDate = new Date(task.dueDate.replace(/\//g, "-"));
        return dueDate >= today && dueDate <= endOfWeek;
      });
    } else if (selectedDate === "custom") {
      if (dateRangeMode) {
        // Filter tasks within the date range
        return tasks.filter((task) => {
          const dueDate = new Date(task.dueDate.replace(/\//g, "-"));
          // Set time to 00:00:00 for date-only comparison
          const startDateOnly = new Date(customStartDate);
          startDateOnly.setHours(0, 0, 0, 0);
          const endDateOnly = new Date(customEndDate);
          endDateOnly.setHours(23, 59, 59, 999);

          return dueDate >= startDateOnly && dueDate <= endDateOnly;
        });
      } else {
        // Filter tasks for a single date
        return tasks.filter((task) => {
          const dueDate = new Date(task.dueDate.replace(/\//g, "-"));
          const dateOnly = new Date(customStartDate);
          dateOnly.setHours(0, 0, 0, 0);

          // Compare only the date part (year, month, day)
          return (
            dueDate.getFullYear() === dateOnly.getFullYear() &&
            dueDate.getMonth() === dateOnly.getMonth() &&
            dueDate.getDate() === dateOnly.getDate()
          );
        });
      }
    } else {
      return tasks.filter((task) => task.dueDate === selectedDate);
    }
  };

  // Filter and sort tasks by priority
  const filteredTasks = getFilteredTasks().sort(
    (a, b) => a.priority - b.priority
  );

  // Handle custom date selection
  const applyCustomDate = () => {
    if (dateRangeMode) {
      // Format for display
      const startFormatted = formatDisplayDate(customStartDate);
      const endFormatted = formatDisplayDate(customEndDate);
      setCustomDateLabel(`${startFormatted} - ${endFormatted}`);
    } else {
      // Single date
      setCustomDateLabel(formatDisplayDate(customStartDate));
    }

    // Set state to custom
    setSelectedDate("custom");

    // Animate out
    Animated.timing(datePickerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDatePickerVisible(false);
    });
  };

  // Create calendar data for the current month/year
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const days = [];

    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Handle opening the date picker
  const handleOpenDatePicker = () => {
    // If custom is selected but we don't have a custom date yet, use today
    if (selectedDate !== "custom") {
      setCustomStartDate(new Date());
      setCustomEndDate(new Date());
    }

    // Reset calendar to current month/year if needed
    if (selectedDate !== "custom") {
      const today = new Date();
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
    }

    // If in range mode, set highlighted dates
    if (dateRangeMode && customStartDate && customEndDate) {
      const startDay = customStartDate.getDate();
      const endDay = customEndDate.getDate();

      if (
        customStartDate.getMonth() === selectedMonth &&
        customStartDate.getFullYear() === selectedYear &&
        customEndDate.getMonth() === selectedMonth &&
        customEndDate.getFullYear() === selectedYear
      ) {
        const highlightedDaysArray = [];
        for (let i = startDay; i <= endDay; i++) {
          highlightedDaysArray.push(i);
        }
        setHighlightedDates(highlightedDaysArray);
      }
    }

    setDatePickerVisible(true);

    // Animate in
    Animated.timing(datePickerAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle day selection on calendar
  const handleDaySelection = (day: number) => {
    if (!day) return; // Handle empty slots

    if (dateRangeMode) {
      // Range selection logic
      if (rangeStartDay === null) {
        // First selection
        setRangeStartDay(day);
        setCustomStartDate(new Date(selectedYear, selectedMonth, day));
        setHighlightedDates([day]);
      } else {
        // Second selection
        const startDate = new Date(selectedYear, selectedMonth, rangeStartDay);
        const endDate = new Date(selectedYear, selectedMonth, day);

        // Swap if end date is before start date
        if (endDate < startDate) {
          setCustomStartDate(endDate);
          setCustomEndDate(startDate);
        } else {
          setCustomStartDate(startDate);
          setCustomEndDate(endDate);
        }

        // Highlight all days in the range
        const start = Math.min(rangeStartDay, day);
        const end = Math.max(rangeStartDay, day);
        const highlightedDaysArray = [];
        for (let i = start; i <= end; i++) {
          highlightedDaysArray.push(i);
        }
        setHighlightedDates(highlightedDaysArray);
        setRangeStartDay(null); // Reset for next selection
      }
    } else {
      // Single date selection
      setCustomStartDate(new Date(selectedYear, selectedMonth, day));
      setHighlightedDates([day]);
    }
  };

  // Change month
  const changeMonth = (increment: number) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setHighlightedDates([]);
    setRangeStartDay(null);
  };

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsideTouch}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              style={styles.profileImage}
              onPress={() => navigation.navigate("Settings")}
            >
              <Icon name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <StyledText variant="title" style={styles.headerTitle}>
              Tasks
            </StyledText>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity>
              <Icon
                name="stats-chart"
                size={24}
                color="#fff"
                onPress={() =>
                  navigation.navigate("Stats", { activeTab: "tasks" })
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "ACTIVITY" && styles.activeTab]}
            onPress={() => {
              setActiveTab("ACTIVITY");
              navigation.navigate("Activity");
            }}
          >
            <StyledText
              style={[
                styles.tabText,
                activeTab === "ACTIVITY" && styles.activeTabText,
              ]}
            >
              ACTIVITY
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "TASK" && styles.activeTab]}
            onPress={() => setActiveTab("TASK")}
          >
            <StyledText
              style={[
                styles.tabText,
                activeTab === "TASK" && styles.activeTabText,
              ]}
            >
              TASK
            </StyledText>
          </TouchableOpacity>
        </View>

        {/* Date filter selector */}
        <View style={styles.dateFilterContainer}>
          {dateFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.dateFilterButton,
                selectedDate === filter.value && styles.activeDateFilter,
              ]}
              onPress={() => {
                if (filter.value === "custom") {
                  handleOpenDatePicker();
                } else {
                  setSelectedDate(filter.value);
                }
              }}
            >
              <StyledText
                style={[
                  styles.dateFilterText,
                  selectedDate === filter.value && styles.activeDateFilterText,
                ]}
              >
                {filter.value === "custom" && selectedDate === "custom"
                  ? "Custom" // Just show "Custom" as the label
                  : filter.label}
              </StyledText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom date display */}
        {selectedDate === "custom" && (
          <View style={styles.customDateDisplay}>
            <StyledText style={styles.customDateText}>
              {customDateLabel}
            </StyledText>
            <TouchableOpacity
              style={styles.customDateEditButton}
              onPress={handleOpenDatePicker}
            >
              <Icon name="calendar-outline" size={16} color="#00E5FF" />
              <StyledText style={styles.customDateEditText}>Change</StyledText>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
          <StyledText style={styles.addButtonText}>Add new task</StyledText>
        </TouchableOpacity>

        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => {
            const isLongPressed = longPressedId === item.id;
            const showDeleteUI = isLongPressed && deleteReady;
            const isOverdue =
              new Date(item.dueDate.replace(/\//g, "-")) < new Date() &&
              !item.isCompleted;

            // Calculate scaled icon sizes based on fontSizeMultiplier
            const smallIconSize = Math.round(16 * fontSizeMultiplier);
            const mediumIconSize = Math.round(20 * fontSizeMultiplier);
            const deleteIconSize = Math.round(28 * fontSizeMultiplier);

            // Additional adjustments for container and button sizes
            const buttonSize = Math.round(32 * fontSizeMultiplier);
            const cardHeight = Math.max(
              Math.round(90 * fontSizeMultiplier),
              90
            );
            const borderRadius = Math.round(16 * fontSizeMultiplier);

            return (
              <Animated.View
                style={[
                  styles.taskItemContainer,
                  isLongPressed && { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.taskItem,
                    isOverdue && styles.overdueTaskItem,
                    item.isCompleted && styles.completedTaskItem,
                    { height: cardHeight, borderRadius: borderRadius },
                  ]}
                  onPress={() => {
                    // If in delete mode, cancel it
                    if (deleteMode.current && isLongPressed) {
                      resetDeleteMode();
                      return;
                    }

                    // Navigate to Task Details screen
                    navigation.navigate("TaskDetail", {
                      id: item.id,
                      title: item.title,
                      category: item.category,
                    });
                  }}
                  onLongPress={() => handleLongPress(item)}
                  onPressIn={() => handlePressIn(item.id)}
                  onPressOut={handlePressOut}
                  delayLongPress={300}
                  activeOpacity={0.9}
                >
                  {showDeleteUI ? (
                    // Delete mode UI
                    <View
                      style={[
                        styles.deleteCardContent,
                        { height: cardHeight, borderRadius: borderRadius },
                      ]}
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
                          <Icon
                            name="trash-outline"
                            size={deleteIconSize}
                            color="#fff"
                          />
                          <StyledText
                            variant="body"
                            style={styles.deleteCardText}
                          >
                            Delete task
                          </StyledText>
                        </TouchableOpacity>
                      </Animated.View>

                      {/* Cancel button */}
                      <TouchableOpacity
                        style={styles.cancelDeleteButton}
                        onPress={resetDeleteMode}
                      >
                        <Icon name="close" size={mediumIconSize} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // Normal task UI
                    <LinearGradient
                      colors={[item.color, item.color + "99"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.taskContent,
                        item.isCompleted && styles.completedTaskContent,
                        isOverdue && styles.overdueTaskContent,
                      ]}
                    >
                      <View style={styles.taskLeftSection}>
                        <TouchableOpacity
                          style={[
                            styles.checkboxContainer,
                            item.isCompleted && styles.checkedContainer,
                          ]}
                          onPress={() => toggleCompleteStatus(item.id)}
                        >
                          {item.isCompleted ? (
                            <Icon
                              name="checkmark"
                              size={smallIconSize}
                              color="#fff"
                            />
                          ) : null}
                        </TouchableOpacity>
                      </View>

                      <View style={styles.taskMiddleSection}>
                        <StyledText
                          variant="body"
                          style={[
                            styles.taskTitle,
                            item.isCompleted && styles.completedTaskText,
                          ]}
                        >
                          {item.title}
                        </StyledText>

                        <View style={styles.taskDetailsRow}>
                          <View style={styles.dueDateContainer}>
                            <Icon
                              name="calendar-outline"
                              size={smallIconSize}
                              color={isOverdue ? "#FF3B30" : "#fff"}
                            />
                            <StyledText
                              variant="caption"
                              style={[
                                styles.dueDateText,
                                isOverdue && styles.overdueDateText,
                              ]}
                            >
                              {isOverdue ? "Overdue: " : "Due: "}
                              {item.dueDate}
                            </StyledText>
                          </View>

                          <View style={styles.categoryBadge}>
                            <Icon
                              name={
                                item.category === "Personal"
                                  ? "person-outline"
                                  : item.category === "Work"
                                  ? "briefcase-outline"
                                  : item.category === "Workout"
                                  ? "fitness-outline"
                                  : "book-outline"
                              }
                              size={smallIconSize}
                              color="#fff"
                            />
                            <StyledText
                              variant="caption"
                              style={styles.categoryText}
                            >
                              {item.category}
                            </StyledText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.taskRightSection}>
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor:
                                item.priority === 1
                                  ? "#FF3B30"
                                  : item.priority === 2
                                  ? "#FF9500"
                                  : item.priority === 3
                                  ? "#34C759"
                                  : item.priority === 4
                                  ? "#007AFF"
                                  : "#5856D6",
                            },
                          ]}
                        >
                          <StyledText
                            variant="caption"
                            style={styles.priorityText}
                          >
                            P{item.priority}
                          </StyledText>
                        </View>
                      </View>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon
                name="checkmark-done-circle-outline"
                size={60}
                color="#444"
              />
              <StyledText variant="body" style={styles.emptyText}>
                No tasks for this period
              </StyledText>
            </View>
          )}
        />

        {/* Add Task Modal */}
        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddTask}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalIconContainer}>
                <Icon name="alert-circle" size={50} color="#FF3B30" />
              </View>
              <StyledText variant="title" style={styles.deleteModalTitle}>
                Delete Task
              </StyledText>

              <StyledText variant="body" style={styles.deleteModalText}>
                Are you sure you want to delete "{taskToDelete?.title}"? This
                action cannot be undone.
              </StyledText>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <StyledText
                    variant="body"
                    style={styles.deleteModalCancelText}
                  >
                    Cancel
                  </StyledText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteModalDeleteButton}
                  onPress={handleDeleteTask}
                >
                  <StyledText
                    variant="body"
                    style={styles.deleteModalDeleteText}
                  >
                    Delete
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Date Picker Modal with Improved UI */}
        <Modal
          visible={datePickerVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => {
            Animated.timing(datePickerAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setDatePickerVisible(false);
            });
          }}
        >
          <View style={styles.datePickerOverlay}>
            <Animated.View
              style={[
                styles.datePickerContainer,
                {
                  opacity: datePickerAnimation,
                  transform: [
                    {
                      scale: datePickerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.datePickerHeader}>
                <StyledText variant="subtitle" style={styles.datePickerTitle}>
                  {dateRangeMode ? "Select Date Range" : "Select Date"}
                </StyledText>
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(datePickerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setDatePickerVisible(false);
                    });
                  }}
                >
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.datePickerModeButton,
                    !dateRangeMode && styles.datePickerModeButtonActive,
                  ]}
                  onPress={() => {
                    setDateRangeMode(false);
                    setHighlightedDates([]);
                    setRangeStartDay(null);
                  }}
                >
                  <StyledText
                    style={[
                      styles.datePickerModeText,
                      !dateRangeMode && styles.datePickerModeTextActive,
                    ]}
                  >
                    Single Date
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.datePickerModeButton,
                    dateRangeMode && styles.datePickerModeButtonActive,
                  ]}
                  onPress={() => {
                    setDateRangeMode(true);
                    setHighlightedDates([]);
                    setRangeStartDay(null);
                  }}
                >
                  <StyledText
                    style={[
                      styles.datePickerModeText,
                      dateRangeMode && styles.datePickerModeTextActive,
                    ]}
                  >
                    Date Range
                  </StyledText>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.monthChangeButton}
                  onPress={() => changeMonth(-1)}
                >
                  <Icon name="chevron-back" size={24} color="#36D1DC" />
                </TouchableOpacity>

                <StyledText style={styles.currentMonthText}>
                  {new Date(selectedYear, selectedMonth).toLocaleString(
                    "default",
                    { month: "long" }
                  )}{" "}
                  {selectedYear}
                </StyledText>

                <TouchableOpacity
                  style={styles.monthChangeButton}
                  onPress={() => changeMonth(1)}
                >
                  <Icon name="chevron-forward" size={24} color="#36D1DC" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayHeader}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <StyledText key={index} style={styles.weekdayText}>
                      {day}
                    </StyledText>
                  )
                )}
              </View>

              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      day && highlightedDates.includes(day)
                        ? styles.selectedDay
                        : undefined,
                      day &&
                      customStartDate.getDate() === day &&
                      customStartDate.getMonth() === selectedMonth &&
                      customStartDate.getFullYear() === selectedYear
                        ? styles.startDay
                        : undefined,
                      day &&
                      customEndDate.getDate() === day &&
                      customEndDate.getMonth() === selectedMonth &&
                      customEndDate.getFullYear() === selectedYear
                        ? styles.endDay
                        : undefined,
                      !day ? styles.emptyDay : undefined,
                    ]}
                    disabled={!day}
                    onPress={() => day && handleDaySelection(day)}
                  >
                    {day ? (
                      <StyledText
                        style={[
                          styles.calendarDayText,
                          highlightedDates.includes(day) &&
                            styles.selectedDayText,
                        ]}
                      >
                        {day}
                      </StyledText>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>

              {dateRangeMode && rangeStartDay && (
                <View style={styles.selectionHint}>
                  <Icon
                    name="information-circle-outline"
                    size={18}
                    color="#36D1DC"
                  />
                  <StyledText style={styles.selectionHintText}>
                    Now select the end date
                  </StyledText>
                </View>
              )}

              <View style={styles.dateSelectionInfo}>
                {dateRangeMode ? (
                  <>
                    <View style={styles.dateInfoItem}>
                      <StyledText style={styles.dateInfoLabel}>
                        Start:
                      </StyledText>
                      <StyledText style={styles.dateInfoValue}>
                        {formatDisplayDate(customStartDate)}
                      </StyledText>
                    </View>
                    <View style={styles.dateInfoItem}>
                      <StyledText style={styles.dateInfoLabel}>End:</StyledText>
                      <StyledText style={styles.dateInfoValue}>
                        {formatDisplayDate(customEndDate)}
                      </StyledText>
                    </View>
                  </>
                ) : (
                  <View style={styles.dateInfoItem}>
                    <StyledText style={styles.dateInfoLabel}>
                      Selected:
                    </StyledText>
                    <StyledText style={styles.dateInfoValue}>
                      {formatDisplayDate(customStartDate)}
                    </StyledText>
                  </View>
                )}
              </View>

              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerCancelButton}
                  onPress={() => {
                    Animated.timing(datePickerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setDatePickerVisible(false);
                    });
                  }}
                >
                  <StyledText style={styles.datePickerCancelText}>
                    Cancel
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerApplyButton}
                  onPress={applyCustomDate}
                >
                  <StyledText style={styles.datePickerApplyText}>
                    Apply
                  </StyledText>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
    height: 42,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#00E5FF",
    borderRadius: 25,
  },
  tabText: {
    color: "#888",
    fontWeight: "600",
    fontSize: 14,
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 15,
  },
  dateFilterContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  dateFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
  },
  activeDateFilter: {
    backgroundColor: "#00E5FF",
  },
  dateFilterText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  activeDateFilterText: {
    color: "#000",
    fontWeight: "bold",
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskItemContainer: {
    marginBottom: 12,
  },
  taskItem: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskContent: {
    flexDirection: "row",
    padding: 16,
    height: "100%",
    alignItems: "center",
  },
  taskLeftSection: {
    marginRight: 12,
  },
  taskMiddleSection: {
    flex: 1,
    justifyContent: "center",
  },
  taskRightSection: {
    alignItems: "flex-end",
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkedContainer: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  taskDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  dueDateText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  completedTaskItem: {
    opacity: 0.7,
  },
  completedTaskContent: {
    opacity: 0.7,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
    color: "#ccc",
  },
  overdueTaskItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  overdueTaskContent: {
    opacity: 0.9,
  },
  overdueDateText: {
    color: "#FF3B30",
    fontWeight: "bold",
  },
  deleteCardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    borderRadius: 16,
  },
  deleteIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 70,
  },
  cancelDeleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteCardText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#777",
    marginTop: 12,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  deleteModalIconContainer: {
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  deleteModalText: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalCancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteModalDeleteButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  deleteModalDeleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  datePickerModeToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerModeButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
  },
  datePickerModeButtonActive: {
    backgroundColor: "#00E5FF",
  },
  datePickerModeText: {
    color: "#fff",
    fontWeight: "600",
  },
  datePickerModeTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  datePickerBody: {
    marginBottom: 16,
  },
  singleDateContainer: {
    marginBottom: 16,
  },
  datePickerLabel: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateDisplay: {
    paddingHorizontal: 8,
  },
  dateDisplayText: {
    color: "#fff",
    fontWeight: "600",
  },
  dateAdjustButton: {
    padding: 8,
  },
  rangeDateContainer: {
    marginBottom: 16,
  },
  dateRangeRow: {
    marginBottom: 8,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  datePickerCancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  datePickerCancelText: {
    color: "#fff",
    fontWeight: "600",
  },
  datePickerApplyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  datePickerApplyText: {
    color: "#fff",
    fontWeight: "bold",
  },
  customDateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  customDateText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 16,
  },
  customDateEditButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  customDateEditText: {
    color: "#00E5FF",
    fontWeight: "600",
    marginLeft: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  monthChangeButton: {
    padding: 8,
  },
  currentMonthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weekdayText: {
    color: "#fff",
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDay: {
    backgroundColor: "#00E5FF",
  },
  startDay: {
    backgroundColor: "#00E5FF",
  },
  endDay: {
    backgroundColor: "#00E5FF",
  },
  calendarDayText: {
    color: "#fff",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#000",
  },
  selectionHint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionHintText: {
    color: "#fff",
    fontWeight: "600",
  },
  dateSelectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  dateInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInfoLabel: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 8,
  },
  dateInfoValue: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
});

export default TaskScreen;
