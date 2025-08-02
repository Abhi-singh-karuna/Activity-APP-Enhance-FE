import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { Task, Category } from "../../types";
import StyledText from "../../components/StyledText";
import { useAppContext } from "../../context/AppContext";

type TaskDetailRouteProp = RouteProp<RootStackParamList, "TaskDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Format date for display
const formatDisplayDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("/");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString(undefined, options);
};

// Format date as YYYY/MM/DD for API/storage
const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

// Parse date string to date object
const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day);
};

// Mock data for a single task
const getMockTask = (id: string, title: string, category: string): Task => {
  const isPastDue = Math.random() > 0.7; // Randomly determine if task is past due
  const isCompleted = Math.random() > 0.5; // Randomly determine if task is completed

  const currentDate = new Date();
  let dueDate = new Date();

  if (isPastDue) {
    dueDate.setDate(currentDate.getDate() - Math.floor(Math.random() * 10) - 1);
  } else {
    dueDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 10) + 1);
  }

  const priority = Math.floor(Math.random() * 5) + 1; // Random priority 1-5

  const createdDate = new Date();
  createdDate.setDate(
    currentDate.getDate() - Math.floor(Math.random() * 20) - 1
  );

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  return {
    id,
    title,
    description:
      "This is a detailed description of the task. It includes what needs to be done, how it should be approached, and any other relevant information that might be helpful.",
    category: category as Category,
    dueDate: formatDate(dueDate),
    isCompleted,
    color: ["#5B86E5", "#00E5FF", "#FF5722", "#753a88", "#4CAF50"][
      Math.floor(Math.random() * 5)
    ],
    priority,
    createdAt: formatDate(createdDate),
  };
};

const TaskDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { fontSizeMultiplier } = useAppContext();

  const { id, title, category } = route.params;

  // Local state
  const [task, setTask] = useState<Task | null>(null);
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  // Add state for edit task modal
  const [showEditTask, setShowEditTask] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  // Add state for date picker in edit mode
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  // Add state for category selection
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Add state for priority selection
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Fetch task data
  useEffect(() => {
    // For mock purposes - in real app we'd fetch from API/DB
    setTask(getMockTask(id, title, category));
  }, [id, title, category]);

  // Initialize edited task data when task loads
  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        category: task.category,
        dueDate: task.dueDate,
        priority: task.priority,
        color: task.color,
      });
    }
  }, [task]);

  // Initialize edited description when task loads
  useEffect(() => {
    if (task) {
      setEditedDescription(task.description || "");
    }
  }, [task]);

  // Toggle completion status
  const toggleComplete = () => {
    if (task) {
      if (!task.isCompleted) {
        setShowConfirmComplete(true);
      } else {
        updateCompletionStatus(false);
      }
    }
  };

  // Update completion status
  const updateCompletionStatus = (isCompleted: boolean) => {
    if (task) {
      setTask({
        ...task,
        isCompleted,
      });
      setShowConfirmComplete(false);
    }
  };

  // Save edited description
  const saveDescription = () => {
    if (task) {
      setTask({
        ...task,
        description: editedDescription,
      });
      setShowEditNotes(false);
    }
  };

  // Open edit task modal
  const openEditTaskModal = () => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        category: task.category,
        dueDate: task.dueDate,
        priority: task.priority,
        color: task.color,
      });
      setShowEditTask(true);
    }
  };

  // Save edited task
  const saveEditedTask = () => {
    if (task && editedTask.title) {
      setTask({
        ...task,
        ...(editedTask as Task),
      });
      setShowEditTask(false);

      // Show confirmation
      Alert.alert("Success", "Task updated successfully");
    } else {
      Alert.alert("Error", "Title is required");
    }
  };

  // Handle date selection
  const handleDateSelection = (date: Date) => {
    setDatePickerDate(date);
    setEditedTask({
      ...editedTask,
      dueDate: formatDateYYYYMMDD(date),
    });
    setShowDatePicker(false);
  };

  // Handle category selection
  const handleCategorySelection = (selectedCategory: Category) => {
    setEditedTask({
      ...editedTask,
      category: selectedCategory,
    });
    setShowCategoryPicker(false);
  };

  // Handle priority selection
  const handlePrioritySelection = (priority: number) => {
    setEditedTask({
      ...editedTask,
      priority,
    });
    setShowPriorityPicker(false);
  };

  // Get category icon name
  const getCategoryIcon = (category: Category): string => {
    switch (category) {
      case "Personal":
        return "person-outline";
      case "Work":
        return "briefcase-outline";
      case "Workout":
        return "fitness-outline";
      case "Learning":
        return "book-outline";
      default:
        return "list-outline";
    }
  };

  // Get priority color and label
  const getPriorityInfo = (
    priority: number
  ): { color: string; label: string } => {
    switch (priority) {
      case 1:
        return { color: "#FF3B30", label: "Highest" };
      case 2:
        return { color: "#FF9500", label: "High" };
      case 3:
        return { color: "#34C759", label: "Medium" };
      case 4:
        return { color: "#007AFF", label: "Low" };
      case 5:
        return { color: "#5856D6", label: "Lowest" };
      default:
        return { color: "#777777", label: "Not set" };
    }
  };

  // Is task overdue?
  const isOverdue = (): boolean => {
    if (!task) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate.replace(/\//g, "-"));
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today && !task.isCompleted;
  };

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <StyledText>Loading task details...</StyledText>
      </View>
    );
  }

  const priorityInfo = getPriorityInfo(task.priority);
  const overdueTask = isOverdue();

  // Adjust sizes based on font size multiplier
  const iconSize = Math.round(24 * fontSizeMultiplier);
  const smallIconSize = Math.round(18 * fontSizeMultiplier);
  const sectionPadding = Math.round(20 * fontSizeMultiplier);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with gradient background */}
      <LinearGradient
        colors={[task.color, task.color + "99"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={iconSize} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openEditTaskModal}
              >
                <Icon name="create-outline" size={iconSize} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    "Delete Task",
                    "Are you sure you want to delete this task?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Delete",
                        onPress: () => {
                          // Delete task and go back
                          navigation.goBack();
                        },
                        style: "destructive",
                      },
                    ]
                  );
                }}
              >
                <Icon name="trash-outline" size={iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <StyledText variant="title" style={styles.title}>
              {task.title}
            </StyledText>

            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Icon
                  name={getCategoryIcon(task.category)}
                  size={smallIconSize}
                  color="#fff"
                />
                <StyledText variant="caption" style={styles.categoryText}>
                  {task.category}
                </StyledText>
              </View>

              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priorityInfo.color },
                ]}
              >
                <StyledText variant="caption" style={styles.priorityText}>
                  P{task.priority} - {priorityInfo.label}
                </StyledText>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Task content */}
      <ScrollView style={styles.content}>
        {/* Status section */}
        <View style={[styles.section, { padding: sectionPadding }]}>
          <View style={styles.sectionHeader}>
            <StyledText variant="subtitle" style={styles.sectionTitle}>
              Status
            </StyledText>
          </View>

          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                task.isCompleted ? styles.completedBadge : styles.pendingBadge,
                overdueTask && !task.isCompleted && styles.overdueBadge,
              ]}
              onPress={toggleComplete}
            >
              <Icon
                name={
                  task.isCompleted
                    ? "checkmark-circle"
                    : overdueTask
                    ? "alert-circle"
                    : "time-outline"
                }
                size={smallIconSize}
                color="#fff"
              />
              <StyledText variant="body" style={styles.statusText}>
                {task.isCompleted
                  ? "Completed"
                  : overdueTask
                  ? "Overdue"
                  : "Pending"}
              </StyledText>
            </TouchableOpacity>

            {/* Complete button */}
            {!task.isCompleted && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={toggleComplete}
              >
                <Icon name="checkmark" size={smallIconSize} color="#fff" />
                <StyledText variant="body" style={styles.completeButtonText}>
                  Mark as Complete
                </StyledText>
              </TouchableOpacity>
            )}

            {/* Uncomplete button */}
            {task.isCompleted && (
              <TouchableOpacity
                style={styles.uncompleteButton}
                onPress={toggleComplete}
              >
                <Icon name="refresh" size={smallIconSize} color="#fff" />
                <StyledText variant="body" style={styles.uncompleteButtonText}>
                  Mark as Incomplete
                </StyledText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dates section */}
        <View style={[styles.section, { padding: sectionPadding }]}>
          <View style={styles.sectionHeader}>
            <StyledText variant="subtitle" style={styles.sectionTitle}>
              Dates
            </StyledText>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <View style={styles.dateIconContainer}>
                <Icon name="calendar" size={smallIconSize} color="#00E5FF" />
              </View>
              <View style={styles.dateContent}>
                <StyledText variant="caption" style={styles.dateLabel}>
                  Due Date
                </StyledText>
                <StyledText
                  variant="body"
                  style={[
                    styles.dateValue,
                    overdueTask && styles.overdueDateValue,
                  ]}
                >
                  {formatDisplayDate(task.dueDate)}
                  {overdueTask && " (Overdue)"}
                </StyledText>
              </View>
            </View>

            <View style={styles.dateItem}>
              <View style={styles.dateIconContainer}>
                <Icon name="create" size={smallIconSize} color="#00E5FF" />
              </View>
              <View style={styles.dateContent}>
                <StyledText variant="caption" style={styles.dateLabel}>
                  Created On
                </StyledText>
                <StyledText variant="body" style={styles.dateValue}>
                  {formatDisplayDate(task.createdAt)}
                </StyledText>
              </View>
            </View>
          </View>
        </View>

        {/* Description section */}
        <View style={[styles.section, { padding: sectionPadding }]}>
          <View style={styles.sectionHeader}>
            <StyledText variant="subtitle" style={styles.sectionTitle}>
              Description
            </StyledText>
            <TouchableOpacity onPress={() => setShowEditNotes(true)}>
              <Icon
                name="create-outline"
                size={smallIconSize}
                color="#00E5FF"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionContainer}>
            {task.description ? (
              <StyledText variant="body" style={styles.descriptionText}>
                {task.description}
              </StyledText>
            ) : (
              <StyledText variant="body" style={styles.noDescriptionText}>
                No description provided. Tap the edit icon to add one.
              </StyledText>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Notes Modal */}
      <Modal
        visible={showEditNotes}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditNotes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="subtitle" style={styles.modalTitle}>
                Edit Description
              </StyledText>
              <TouchableOpacity onPress={() => setShowEditNotes(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter task description"
              placeholderTextColor="#666"
              value={editedDescription}
              onChangeText={setEditedDescription}
              multiline={true}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditNotes(false)}
              >
                <StyledText variant="body" style={styles.cancelButtonText}>
                  Cancel
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveDescription}
              >
                <StyledText variant="body" style={styles.saveButtonText}>
                  Save
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Complete Modal */}
      <Modal
        visible={showConfirmComplete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmComplete(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completeModalContainer}>
            <View style={styles.completeIconContainer}>
              <Icon name="checkmark-circle" size={60} color="#34C759" />
            </View>

            <StyledText variant="title" style={styles.completeModalTitle}>
              Complete Task
            </StyledText>

            <StyledText variant="body" style={styles.completeModalText}>
              Are you sure you want to mark this task as completed?
            </StyledText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmComplete(false)}
              >
                <StyledText variant="body" style={styles.cancelButtonText}>
                  Cancel
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeConfirmButton}
                onPress={() => updateCompletionStatus(true)}
              >
                <Icon name="checkmark" size={18} color="#fff" />
                <StyledText variant="body" style={styles.completeConfirmText}>
                  Complete
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        visible={showEditTask}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditTask(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editTaskModalContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="subtitle" style={styles.modalTitle}>
                Edit Task
              </StyledText>
              <TouchableOpacity onPress={() => setShowEditTask(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editTaskForm}>
              {/* Title Input */}
              <View style={styles.formGroup}>
                <StyledText variant="body" style={styles.formLabel}>
                  Title
                </StyledText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter task title"
                  placeholderTextColor="#666"
                  value={editedTask.title}
                  onChangeText={(text) =>
                    setEditedTask({ ...editedTask, title: text })
                  }
                />
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <StyledText variant="body" style={styles.formLabel}>
                  Category
                </StyledText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <View style={styles.pickerButtonContent}>
                    <Icon
                      name={
                        editedTask.category
                          ? getCategoryIcon(editedTask.category)
                          : "list-outline"
                      }
                      size={smallIconSize}
                      color="#00E5FF"
                    />
                    <StyledText variant="body" style={styles.pickerButtonText}>
                      {editedTask.category || "Select Category"}
                    </StyledText>
                  </View>
                  <Icon name="chevron-down" size={smallIconSize} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Priority Selection */}
              <View style={styles.formGroup}>
                <StyledText variant="body" style={styles.formLabel}>
                  Priority
                </StyledText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowPriorityPicker(true)}
                >
                  <View style={styles.pickerButtonContent}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor: editedTask.priority
                            ? getPriorityInfo(editedTask.priority).color
                            : "#777",
                        },
                      ]}
                    />
                    <StyledText variant="body" style={styles.pickerButtonText}>
                      {editedTask.priority
                        ? `Priority ${editedTask.priority} - ${
                            getPriorityInfo(editedTask.priority).label
                          }`
                        : "Select Priority"}
                    </StyledText>
                  </View>
                  <Icon name="chevron-down" size={smallIconSize} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Due Date Selection */}
              <View style={styles.formGroup}>
                <StyledText variant="body" style={styles.formLabel}>
                  Due Date
                </StyledText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    if (editedTask.dueDate) {
                      setDatePickerDate(parseDate(editedTask.dueDate));
                    } else {
                      setDatePickerDate(new Date());
                    }
                    setShowDatePicker(true);
                  }}
                >
                  <View style={styles.pickerButtonContent}>
                    <Icon
                      name="calendar-outline"
                      size={smallIconSize}
                      color="#00E5FF"
                    />
                    <StyledText variant="body" style={styles.pickerButtonText}>
                      {editedTask.dueDate
                        ? formatDisplayDate(editedTask.dueDate)
                        : "Select Date"}
                    </StyledText>
                  </View>
                  <Icon name="chevron-down" size={smallIconSize} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Description Input */}
              <View style={styles.formGroup}>
                <StyledText variant="body" style={styles.formLabel}>
                  Description
                </StyledText>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter task description"
                  placeholderTextColor="#666"
                  value={editedTask.description}
                  onChangeText={(text) =>
                    setEditedTask({ ...editedTask, description: text })
                  }
                  multiline={true}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditTask(false)}
              >
                <StyledText variant="body" style={styles.cancelButtonText}>
                  Cancel
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEditedTask}
              >
                <StyledText variant="body" style={styles.saveButtonText}>
                  Save
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="subtitle" style={styles.modalTitle}>
                Select Category
              </StyledText>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryOptions}>
              {["Personal", "Work", "Workout", "Learning"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    editedTask.category === cat &&
                      styles.selectedCategoryOption,
                  ]}
                  onPress={() => handleCategorySelection(cat as Category)}
                >
                  <Icon
                    name={getCategoryIcon(cat as Category)}
                    size={24}
                    color={editedTask.category === cat ? "#000" : "#fff"}
                  />
                  <StyledText
                    variant="body"
                    style={[
                      styles.categoryOptionText,
                      editedTask.category === cat &&
                        styles.selectedCategoryOptionText,
                    ]}
                  >
                    {cat}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Priority Picker Modal */}
      <Modal
        visible={showPriorityPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriorityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="subtitle" style={styles.modalTitle}>
                Select Priority
              </StyledText>
              <TouchableOpacity onPress={() => setShowPriorityPicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.priorityOptions}>
              {[1, 2, 3, 4, 5].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    { backgroundColor: getPriorityInfo(priority).color },
                    editedTask.priority === priority &&
                      styles.selectedPriorityOption,
                  ]}
                  onPress={() => handlePrioritySelection(priority)}
                >
                  <StyledText variant="body" style={styles.priorityOptionText}>
                    P{priority} - {getPriorityInfo(priority).label}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="subtitle" style={styles.modalTitle}>
                Select Due Date
              </StyledText>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContent}>
              {/* Simple date picker with predefined options */}
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => handleDateSelection(new Date())}
              >
                <Icon name="today-outline" size={24} color="#00E5FF" />
                <StyledText variant="body" style={styles.dateOptionText}>
                  Today
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelection(tomorrow);
                }}
              >
                <Icon name="calendar-outline" size={24} color="#00E5FF" />
                <StyledText variant="body" style={styles.dateOptionText}>
                  Tomorrow
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleDateSelection(nextWeek);
                }}
              >
                <Icon name="calendar-outline" size={24} color="#00E5FF" />
                <StyledText variant="body" style={styles.dateOptionText}>
                  Next Week
                </StyledText>
              </TouchableOpacity>

              {/* Custom date selection */}
              <View style={styles.customDatePicker}>
                <StyledText variant="body" style={styles.customDateLabel}>
                  Or Select Custom Date:
                </StyledText>

                <View style={styles.datePickerRow}>
                  {/* Date Selector - this is a simplified version */}
                  <View style={styles.dateInputs}>
                    <View style={styles.dateInput}>
                      <TouchableOpacity
                        style={styles.dateArrow}
                        onPress={() => {
                          const newDate = new Date(datePickerDate);
                          newDate.setDate(newDate.getDate() - 1);
                          setDatePickerDate(newDate);
                        }}
                      >
                        <Icon name="chevron-back" size={24} color="#00E5FF" />
                      </TouchableOpacity>

                      <View style={styles.dateDisplay}>
                        <StyledText
                          variant="body"
                          style={styles.dateDisplayText}
                        >
                          {formatDisplayDate(
                            formatDateYYYYMMDD(datePickerDate)
                          )}
                        </StyledText>
                      </View>

                      <TouchableOpacity
                        style={styles.dateArrow}
                        onPress={() => {
                          const newDate = new Date(datePickerDate);
                          newDate.setDate(newDate.getDate() + 1);
                          setDatePickerDate(newDate);
                        }}
                      >
                        <Icon
                          name="chevron-forward"
                          size={24}
                          color="#00E5FF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.applyDateButton}
                  onPress={() => handleDateSelection(datePickerDate)}
                >
                  <StyledText variant="body" style={styles.applyDateButtonText}>
                    Apply This Date
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  titleContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 5,
  },
  categoryText: {
    color: "#fff",
    marginLeft: 6,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 5,
  },
  priorityText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
    backgroundColor: "#1E1E1E",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 10,
  },
  completedBadge: {
    backgroundColor: "#34C759",
  },
  pendingBadge: {
    backgroundColor: "#007AFF",
  },
  overdueBadge: {
    backgroundColor: "#FF3B30",
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  uncompleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#666",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  uncompleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  dateRow: {
    flexDirection: "column",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,229,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    color: "#aaa",
    marginBottom: 4,
  },
  dateValue: {
    color: "#fff",
    fontSize: 16,
  },
  overdueDateValue: {
    color: "#FF3B30",
  },
  descriptionContainer: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  descriptionText: {
    color: "#fff",
    lineHeight: 22,
  },
  noDescriptionText: {
    color: "#888",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  descriptionInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 200,
    margin: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  completeModalContainer: {
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
  completeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  completeModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  completeModalText: {
    color: "#ddd",
    textAlign: "center",
    marginBottom: 24,
  },
  completeConfirmButton: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#34C759",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  completeConfirmText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  editTaskModalContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  editTaskForm: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: "#ddd",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerButtonText: {
    color: "#fff",
    marginLeft: 8,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerModalContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  categoryOptions: {
    padding: 16,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCategoryOption: {
    backgroundColor: "#00E5FF",
  },
  categoryOptionText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 16,
  },
  selectedCategoryOptionText: {
    color: "#000",
    fontWeight: "bold",
  },
  priorityOptions: {
    padding: 16,
  },
  priorityOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPriorityOption: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  priorityOptionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  datePickerContent: {
    padding: 16,
  },
  dateOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateOptionText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 16,
  },
  customDatePicker: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
  },
  customDateLabel: {
    color: "#ddd",
    marginBottom: 16,
  },
  datePickerRow: {
    marginBottom: 16,
  },
  dateInputs: {
    alignItems: "center",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dateArrow: {
    padding: 8,
  },
  dateDisplay: {
    paddingHorizontal: 16,
  },
  dateDisplayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  applyDateButton: {
    backgroundColor: "#00E5FF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  applyDateButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
});

export default TaskDetailScreen;
