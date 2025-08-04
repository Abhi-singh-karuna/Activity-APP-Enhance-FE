import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Text,
  Animated,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { Activity, Category } from "../../types";

// Get device dimensions for responsive design
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

// Type definitions
type ActivityDetailRouteProp = RouteProp<RootStackParamList, "ActivityDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enhanced activity data structure
interface EnhancedActivityData {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color: string;
  priority: number;
  isRunning: boolean;
  isCompleted: boolean;
  isPaused: boolean;
  isFuture: boolean;
  currentTimer: string;
  remainingSeconds: number;
  elapsedSeconds: number;
  totalTimeSpent: number;
  completionPercentage: number;
  streak: number;
  lastStartTime?: number;
  lastCompletedDate?: string;
  description?: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Interaction history type
interface InteractionHistory {
  id: string;
  type:
    | "started"
    | "paused"
    | "resumed"
    | "completed"
    | "edited"
    | "interrupted";
  timestamp: string;
  duration?: string;
  note?: string;
}

// Streak history type
interface StreakHistory {
  date: string;
  streak: number;
  completed: boolean;
  timeSpent: number;
}

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
  textMuted: "#666666",
  border: "rgba(255, 255, 255, 0.1)",
  overlay: "rgba(0, 0, 0, 0.8)",
};

/**
 * ActivityDetailScreen - Production-level activity detail view
 * Features:
 * - Comprehensive activity information
 * - Interaction history tracking
 * - Streak visualization and history
 * - Edit/Delete functionality
 * - Modern, clean design
 */
const ActivityDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ActivityDetailRouteProp>();
  const { title, category, isPersonal } = route.params;

  // Enhanced activity data with dummy data
  const [activityData, setActivityData] = useState<EnhancedActivityData>({
    id: "activity_123",
    title: title || "Morning Workout",
    category: (category as Category) || "Workout",
    startDate: "2025/08/02",
    endDate: "2025/08/02",
    duration: "01:00:00",
    color: "#00E5FF",
    priority: 1,
    isRunning: true,
    isCompleted: false,
    isPaused: false,
    isFuture: false,
    currentTimer: "00:45:30",
    remainingSeconds: 2730,
    elapsedSeconds: 870,
    totalTimeSpent: 870,
    completionPercentage: 25,
    streak: 7,
    lastStartTime: Date.now() - 870000,
    description:
      "Complete morning workout routine including cardio and strength training",
    tags: ["Cardio", "Strength", "Morning"],
    notes: "Focus on form and breathing. Take breaks as needed.",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  });

  // Interaction history
  const [interactionHistory, setInteractionHistory] = useState<
    InteractionHistory[]
  >([
    {
      id: "1",
      type: "started",
      timestamp: "2025-08-02T08:00:00Z",
      duration: "00:45:30",
      note: "Started morning workout session",
    },
    {
      id: "2",
      type: "paused",
      timestamp: "2025-08-02T08:15:00Z",
      duration: "00:15:00",
      note: "Quick water break",
    },
    {
      id: "3",
      type: "resumed",
      timestamp: "2025-08-02T08:17:00Z",
      duration: "00:30:30",
      note: "Resumed after break",
    },
    {
      id: "4",
      type: "interrupted",
      timestamp: "2025-08-02T08:30:00Z",
      duration: "00:05:00",
      note: "Phone call interruption",
    },
    {
      id: "5",
      type: "resumed",
      timestamp: "2025-08-02T08:35:00Z",
      duration: "00:10:30",
      note: "Back to workout",
    },
  ]);

  // Streak history
  const [streakHistory, setStreakHistory] = useState<StreakHistory[]>([
    { date: "2025-08-01", streak: 6, completed: true, timeSpent: 3600 },
    { date: "2025-07-31", streak: 5, completed: true, timeSpent: 3300 },
    { date: "2025-07-30", streak: 4, completed: true, timeSpent: 3000 },
    { date: "2025-07-29", streak: 3, completed: true, timeSpent: 2700 },
    { date: "2025-07-28", streak: 2, completed: true, timeSpent: 2400 },
    { date: "2025-07-27", streak: 1, completed: true, timeSpent: 2100 },
    { date: "2025-07-26", streak: 0, completed: false, timeSpent: 0 },
  ]);

  // UI State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "streak">(
    "overview"
  );

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: activityData.title,
    category: activityData.category,
    description: activityData.description || "",
    notes: activityData.notes,
    priority: activityData.priority,
    color: activityData.color,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.3)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations
  useEffect(() => {
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
    ]).start();
  }, []);

  // Helper function to render streak stars
  const renderStreakStars = (streak: number, size: number = 12) => {
    const maxStars = 7;
    const starsToShow = Math.min(streak, maxStars);
    const stars = [];

    for (let i = 0; i < maxStars; i++) {
      const isFilled = i < starsToShow;
      const isSpecial = i === 6 && streak > maxStars;

      stars.push(
        <View key={i} style={styles.streakStarContainer}>
          <Icon
            name={isFilled ? "star" : "star-outline"}
            size={scale(size)}
            color={
              isSpecial
                ? "#FFD700"
                : isFilled
                ? "#FFD700"
                : "rgba(255, 215, 0, 0.3)"
            }
          />
          {isSpecial && (
            <Text style={styles.streakOverflowText}>+{streak - maxStars}</Text>
          )}
        </View>
      );
    }

    return stars;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get interaction icon
  const getInteractionIcon = (type: InteractionHistory["type"]) => {
    switch (type) {
      case "started":
        return "play-circle";
      case "paused":
        return "pause-circle";
      case "resumed":
        return "play";
      case "completed":
        return "checkmark-circle";
      case "edited":
        return "create";
      case "interrupted":
        return "hand-right";
      default:
        return "time";
    }
  };

  // Get interaction color
  const getInteractionColor = (type: InteractionHistory["type"]) => {
    switch (type) {
      case "started":
        return ThemeColors.success;
      case "paused":
        return ThemeColors.warning;
      case "resumed":
        return ThemeColors.primary;
      case "completed":
        return ThemeColors.success;
      case "edited":
        return ThemeColors.secondary;
      case "interrupted":
        return ThemeColors.danger;
      default:
        return ThemeColors.textSecondary;
    }
  };

  // Handle edit activity
  const handleEditActivity = () => {
    setActivityData({
      ...activityData,
      ...editForm,
      updatedAt: new Date().toISOString(),
    });

    // Add to interaction history
    const newInteraction: InteractionHistory = {
      id: Date.now().toString(),
      type: "edited",
      timestamp: new Date().toISOString(),
      note: "Activity details updated",
    };

    setInteractionHistory([newInteraction, ...interactionHistory]);
    setShowEditModal(false);
  };

  // Handle delete activity
  const handleDeleteActivity = () => {
    // In real app, call API to delete
    navigation.goBack();
  };

  // Handle timer toggle
  const handleTimerToggle = () => {
    const newIsRunning = !activityData.isRunning;
    const newStatus = newIsRunning ? "started" : "paused";

    setActivityData({
      ...activityData,
      isRunning: newIsRunning,
      lastStartTime: newIsRunning ? Date.now() : undefined,
    });

    // Add to interaction history
    const newInteraction: InteractionHistory = {
      id: Date.now().toString(),
      type: newStatus as any,
      timestamp: new Date().toISOString(),
      duration: activityData.currentTimer,
      note: newIsRunning ? "Activity started" : "Activity paused",
    };

    setInteractionHistory([newInteraction, ...interactionHistory]);
  };

  // Show edit modal
  const showEditModalWithAnimation = () => {
    setShowEditModal(true);
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
  };

  // Hide edit modal
  const hideEditModal = () => {
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 0.3,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEditModal(false);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ThemeColors.background}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="chevron-back" size={scale(24)} color={ThemeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Activity Details</Text>
          <Text style={styles.headerSubtitle}>{activityData.title}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={showEditModalWithAnimation}
            style={styles.headerButton}
          >
            <Icon
              name="create-outline"
              size={scale(20)}
              color={ThemeColors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={styles.headerButton}
          >
            <Icon
              name="trash-outline"
              size={scale(20)}
              color={ThemeColors.danger}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "overview" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("overview")}
        >
          <Icon
            name="information-circle-outline"
            size={scale(16)}
            color={
              activeTab === "overview"
                ? ThemeColors.primary
                : ThemeColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "overview" && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "history" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Icon
            name="time-outline"
            size={scale(16)}
            color={
              activeTab === "history"
                ? ThemeColors.primary
                : ThemeColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "streak" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("streak")}
        >
          <Icon
            name="star-outline"
            size={scale(16)}
            color={
              activeTab === "streak"
                ? ThemeColors.primary
                : ThemeColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "streak" && styles.activeTabText,
            ]}
          >
            Streak
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Activity Status Card */}
            <View style={styles.statusCard}>
              <LinearGradient
                colors={[activityData.color + "20", activityData.color + "10"]}
                style={styles.statusCardGradient}
              >
                <View style={styles.statusHeader}>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>{activityData.title}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {activityData.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusIcon}>
                    <Icon
                      name={
                        activityData.isCompleted
                          ? "checkmark-circle"
                          : activityData.isRunning
                          ? "play-circle"
                          : "pause-circle"
                      }
                      size={scale(32)}
                      color={
                        activityData.isCompleted
                          ? ThemeColors.success
                          : activityData.isRunning
                          ? ThemeColors.primary
                          : ThemeColors.warning
                      }
                    />
                  </View>
                </View>

                <View style={styles.statusDetails}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text style={styles.statusValue}>
                      {activityData.isCompleted
                        ? "Completed"
                        : activityData.isRunning
                        ? "Running"
                        : "Paused"}
                    </Text>
                  </View>

                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Progress</Text>
                    <Text style={styles.statusValue}>
                      {activityData.completionPercentage}%
                    </Text>
                  </View>

                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Current Streak</Text>
                    <View style={styles.streakDisplay}>
                      {renderStreakStars(activityData.streak, 14)}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Timer Controls */}
            {!activityData.isCompleted && (
              <View style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerTitle}>Timer</Text>
                  <Text style={styles.timerValue}>
                    {activityData.currentTimer}
                  </Text>
                </View>

                <View style={styles.timerControls}>
                  <TouchableOpacity
                    style={[
                      styles.timerButton,
                      activityData.isRunning && styles.activeTimerButton,
                    ]}
                    onPress={handleTimerToggle}
                  >
                    <Icon
                      name={activityData.isRunning ? "pause" : "play"}
                      size={scale(20)}
                      color={ThemeColors.text}
                    />
                    <Text style={styles.timerButtonText}>
                      {activityData.isRunning ? "Pause" : "Start"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Activity Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Activity Details</Text>

              <View style={styles.detailRow}>
                <Icon
                  name="time-outline"
                  size={scale(16)}
                  color={ThemeColors.textSecondary}
                />
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{activityData.duration}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon
                  name="calendar-outline"
                  size={scale(16)}
                  color={ThemeColors.textSecondary}
                />
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(activityData.startDate)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon
                  name="calendar-outline"
                  size={scale(16)}
                  color={ThemeColors.textSecondary}
                />
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(activityData.endDate)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon
                  name="flag-outline"
                  size={scale(16)}
                  color={ThemeColors.textSecondary}
                />
                <Text style={styles.detailLabel}>Priority</Text>
                <Text style={styles.detailValue}>
                  Level {activityData.priority}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon
                  name="color-palette-outline"
                  size={scale(16)}
                  color={ThemeColors.textSecondary}
                />
                <Text style={styles.detailLabel}>Color</Text>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: activityData.color },
                  ]}
                />
              </View>
            </View>

            {/* Description */}
            {activityData.description && (
              <View style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                  {activityData.description}
                </Text>
              </View>
            )}

            {/* Tags */}
            <View style={styles.tagsCard}>
              <View style={styles.tagsHeader}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <TouchableOpacity onPress={() => setShowTagModal(true)}>
                  <Icon
                    name="add"
                    size={scale(20)}
                    color={ThemeColors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {activityData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            {activityData.notes && (
              <View style={styles.notesCard}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{activityData.notes}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Interaction History</Text>

              {interactionHistory.map((interaction, index) => (
                <View key={interaction.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Icon
                      name={getInteractionIcon(interaction.type)}
                      size={scale(16)}
                      color={getInteractionColor(interaction.type)}
                    />
                  </View>

                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>
                      {interaction.type.charAt(0).toUpperCase() +
                        interaction.type.slice(1)}
                    </Text>
                    <Text style={styles.historyTime}>
                      {formatTime(interaction.timestamp)} •{" "}
                      {formatDate(interaction.timestamp)}
                    </Text>
                    {interaction.duration && (
                      <Text style={styles.historyDuration}>
                        Duration: {interaction.duration}
                      </Text>
                    )}
                    {interaction.note && (
                      <Text style={styles.historyNote}>{interaction.note}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Streak Tab */}
        {activeTab === "streak" && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.streakCard}>
              <Text style={styles.sectionTitle}>Streak History</Text>

              <View style={styles.streakSummary}>
                <View style={styles.streakSummaryItem}>
                  <Text style={styles.streakSummaryLabel}>Current Streak</Text>
                  <Text style={styles.streakSummaryValue}>
                    {activityData.streak} days
                  </Text>
                </View>

                <View style={styles.streakSummaryItem}>
                  <Text style={styles.streakSummaryLabel}>Longest Streak</Text>
                  <Text style={styles.streakSummaryValue}>12 days</Text>
                </View>
              </View>

              <View style={styles.streakHistory}>
                {streakHistory.map((streak, index) => (
                  <View key={index} style={styles.streakHistoryItem}>
                    <View style={styles.streakHistoryDate}>
                      <Text style={styles.streakHistoryDay}>
                        {new Date(streak.date).toLocaleDateString("en-US", {
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.streakHistoryMonth}>
                        {new Date(streak.date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </Text>
                    </View>

                    <View style={styles.streakHistoryContent}>
                      <View style={styles.streakHistoryStars}>
                        {renderStreakStars(streak.streak, 10)}
                      </View>
                      <Text style={styles.streakHistoryStatus}>
                        {streak.completed ? "Completed" : "Missed"}
                      </Text>
                      {streak.completed && (
                        <Text style={styles.streakHistoryTime}>
                          {Math.floor(streak.timeSpent / 60)}m
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.streakHistoryIndicator,
                        {
                          backgroundColor: streak.completed
                            ? ThemeColors.success
                            : ThemeColors.textMuted,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideEditModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScaleAnim }],
                opacity: modalOpacityAnim,
              },
            ]}
          >
            <LinearGradient
              colors={[ThemeColors.card, ThemeColors.cardSecondary]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Activity</Text>
                <TouchableOpacity onPress={hideEditModal}>
                  <Icon
                    name="close"
                    size={scale(24)}
                    color={ThemeColors.text}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.title}
                    onChangeText={(text) =>
                      setEditForm({ ...editForm, title: text })
                    }
                    placeholder="Activity title"
                    placeholderTextColor={ThemeColors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categorySelector}>
                    {(["Workout", "Work", "Personal"] as Category[]).map(
                      (cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryOption,
                            editForm.category === cat &&
                              styles.selectedCategoryOption,
                          ]}
                          onPress={() =>
                            setEditForm({ ...editForm, category: cat })
                          }
                        >
                          <Text
                            style={[
                              styles.categoryOptionText,
                              editForm.category === cat &&
                                styles.selectedCategoryOptionText,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.description}
                    onChangeText={(text) =>
                      setEditForm({ ...editForm, description: text })
                    }
                    placeholder="Activity description"
                    placeholderTextColor={ThemeColors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.notes}
                    onChangeText={(text) =>
                      setEditForm({ ...editForm, notes: text })
                    }
                    placeholder="Additional notes"
                    placeholderTextColor={ThemeColors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <View style={styles.prioritySelector}>
                    {[1, 2, 3].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          editForm.priority === priority &&
                            styles.selectedPriorityOption,
                        ]}
                        onPress={() => setEditForm({ ...editForm, priority })}
                      >
                        <Text
                          style={[
                            styles.priorityOptionText,
                            editForm.priority === priority &&
                              styles.selectedPriorityOptionText,
                          ]}
                        >
                          {priority}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={hideEditModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleEditActivity}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <LinearGradient
              colors={[ThemeColors.card, ThemeColors.cardSecondary]}
              style={styles.deleteModalGradient}
            >
              <Icon
                name="alert-circle-outline"
                size={scale(48)}
                color={ThemeColors.danger}
              />
              <Text style={styles.deleteModalTitle}>Delete Activity</Text>
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete "{activityData.title}"? This
                action cannot be undone.
              </Text>

              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={styles.deleteCancelButton}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.deleteCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteConfirmButton}
                  onPress={handleDeleteActivity}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout and container styles
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    paddingBottom: 30,
  },

  // Enhanced Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9c9c9c",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Tab Navigation styles
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1E1E1E",
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  activeTabButton: {
    backgroundColor: "#2d2d2d",
    borderRadius: 10,
  },
  tabText: {
    color: "#9c9c9c",
    fontSize: 12,
    marginLeft: 5,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Status Card styles
  statusCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusCardGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusItem: {
    alignItems: "center",
  },
  statusLabel: {
    color: "#9c9c9c",
    fontSize: 13,
    marginBottom: 5,
  },
  statusValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  streakDisplay: {
    flexDirection: "row",
    marginTop: 5,
  },

  // Timer Card styles
  timerCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timerHeader: {
    padding: 20,
    backgroundColor: "#121212",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  timerControls: {
    padding: 20,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  timerButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    backgroundColor: "rgba(58, 43, 79, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  activeTimerButton: {
    backgroundColor: "rgba(58, 43, 79, 0.9)",
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Details Card styles
  detailsCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  detailLabel: {
    color: "#9c9c9c",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Description Card styles
  descriptionCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  descriptionText: {
    color: "#fff",
    fontSize: 14,
    padding: 20,
    lineHeight: 22,
  },

  // Tags Card styles
  tagsCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tagsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
  },
  tag: {
    backgroundColor: "#252525",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
  },

  // Notes Card styles
  notesCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  notesText: {
    color: "#fff",
    fontSize: 14,
    padding: 20,
    lineHeight: 22,
  },

  // History Card styles
  historyCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyTime: {
    color: "#9c9c9c",
    fontSize: 12,
    marginTop: 2,
  },
  historyDuration: {
    color: "#9c9c9c",
    fontSize: 12,
    marginTop: 2,
  },
  historyNote: {
    color: "#9c9c9c",
    fontSize: 12,
    marginTop: 2,
  },

  // Streak Card styles
  streakCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  streakSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  streakSummaryItem: {
    alignItems: "center",
  },
  streakSummaryLabel: {
    color: "#9c9c9c",
    fontSize: 13,
    marginBottom: 5,
  },
  streakSummaryValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  streakHistory: {
    padding: 20,
  },
  streakHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  streakHistoryDate: {
    width: 60,
    alignItems: "center",
  },
  streakHistoryDay: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  streakHistoryMonth: {
    color: "#9c9c9c",
    fontSize: 12,
  },
  streakHistoryContent: {
    flex: 1,
    marginLeft: 15,
  },
  streakHistoryStars: {
    flexDirection: "row",
    marginBottom: 5,
  },
  streakHistoryStatus: {
    color: "#9c9c9c",
    fontSize: 12,
  },
  streakHistoryTime: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  streakHistoryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  modalContent: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: "#9c9c9c",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 15,
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 5,
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 5,
  },
  selectedCategoryOption: {
    backgroundColor: "#3a2b4f",
    borderWidth: 1,
    borderColor: "#9c6cda",
  },
  categoryOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryOptionText: {
    color: "#9c6cda",
  },
  prioritySelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 5,
  },
  priorityOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 5,
  },
  selectedPriorityOption: {
    backgroundColor: "#3a2b4f",
    borderWidth: 1,
    borderColor: "#9c6cda",
  },
  priorityOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedPriorityOptionText: {
    color: "#9c6cda",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#9c6cda",
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Streak Star styles
  streakStarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakOverflowText: {
    color: "#FFD700",
    fontSize: 12,
    marginLeft: 5,
  },

  // Color indicator
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  // Delete Modal styles
  deleteModalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  deleteModalGradient: {
    padding: 30,
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 16,
    color: "#9c9c9c",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  deleteModalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
    marginHorizontal: 5,
  },
  deleteCancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FF4757",
    alignItems: "center",
    marginHorizontal: 5,
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ActivityDetailScreen;
