import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
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
import { ThemeColors } from "../../config/theme";
import { RootStackParamList } from "../../navigation";
import { Activity, Category } from "../../types";
// Use AddActivityModal for both create and edit
import AddActivityModal from "../../components/AddActivityModal";
import OverviewScreen from "./OverviewScreen";
import HistoryScreen from "./HistoryScreen";
import StreakScreen from "./StreakScreen";
import NotesScreen from "./NotesScreen";

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

// Using centralized ThemeColors
const GradientConfigs = {
  header: ["#000000", "#121212"] as [string, string],
  primary: ["#00E5FF", "#9C6CDA"] as [string, string],
};

const ActivityDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ActivityDetailRouteProp>();
  const { title, category, isPersonal } = route.params;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State management
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "streak" | "notes"
  >("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Enhanced activity data with mock values
  const [activityData, setActivityData] = useState<EnhancedActivityData>({
    id: "activity_123",
    title: title || "Morning Workout",
    category: (category as Category) || "Workout",
    startDate: "2025-08-01",
    endDate: "2025-12-31",
    duration: "00:45:00",
    color: "#00E5FF",
    priority: 2,
    isRunning: false,
    isCompleted: false,
    isPaused: false,
    isFuture: false,
    currentTimer: "00:45:00",
    remainingSeconds: 2700,
    elapsedSeconds: 0,
    totalTimeSpent: 0,
    completionPercentage: 0,
    streak: 5,
    description: "Daily morning workout routine to stay fit and healthy.",
    tags: ["fitness", "morning", "health"],
    notes: "Focus on form and consistency. Track progress weekly.",
    createdAt: "2025-08-01T08:00:00Z",
    updatedAt: "2025-08-02T08:00:00Z",
  });

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Render streak stars function
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
    return <>{stars}</>;
  };

  // Timer toggle handler
  const handleTimerToggle = () => {
    setActivityData((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
      isPaused: prev.isRunning ? true : false,
    }));
  };

  // Edit activity handler
  const handleEditActivity = (updatedActivity: Partial<Activity>) => {
    setActivityData((prev) => ({
      ...prev,
      ...updatedActivity,
      // Ensure category remains typed correctly if changed
      category: (updatedActivity.category as Category) || prev.category,
      updatedAt: new Date().toISOString(),
    }));
    setShowEditModal(false);
  };

  // Delete activity handler
  const handleDeleteActivity = () => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
    setShowDeleteModal(false);
  };

  // Show edit modal with animation
  const showEditModalWithAnimation = () => {
    setShowEditModal(true);
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
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={GradientConfigs.header}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <View style={styles.headerIconWrapper}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"]}
                  style={styles.headerIconGradient}
                >
                  <Icon
                    name="chevron-back"
                    size={scale(18)}
                    color={ThemeColors.text}
                  />
                </LinearGradient>
              </View>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Activity Details</Text>
              <View style={styles.headerSubtitleRow}>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {activityData.title}
                </Text>
                <View style={styles.headerCategoryBadge}>
                  <Text style={styles.headerCategoryText}>
                    {String(activityData.category).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={showEditModalWithAnimation}
                activeOpacity={0.85}
              >
                <View style={styles.headerIconWrapper}>
                  <LinearGradient
                    colors={GradientConfigs.primary}
                    style={styles.headerIconGradient}
                  >
                    <Icon name="create-outline" size={scale(16)} color="#000" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.85}
              >
                <View style={styles.headerIconWrapper}>
                  <LinearGradient
                    colors={["#FF4757", "#FF6B9D"]}
                    style={styles.headerIconGradient}
                  >
                    <Icon name="trash-outline" size={scale(16)} color="#fff" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
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
            name="flame-outline"
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

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "notes" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("notes")}
        >
          <Icon
            name="document-text-outline"
            size={scale(16)}
            color={
              activeTab === "notes"
                ? ThemeColors.primary
                : ThemeColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "notes" && styles.activeTabText,
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewScreen
          activity={activityData}
          onTimerToggle={handleTimerToggle}
          renderStreakStars={renderStreakStars}
        />
      )}

      {activeTab === "history" && (
        <HistoryScreen
          activity={activityData}
          sessions={[]} // Pass actual session data here
        />
      )}

      {activeTab === "streak" && (
        <StreakScreen
          activity={activityData}
          renderStreakStars={renderStreakStars}
        />
      )}

      {activeTab === "notes" && <NotesScreen activity={activityData} />}

      {/* Edit Activity Modal - reuse AddActivityModal in edit mode */}
      <AddActivityModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleEditActivity}
        mode="edit"
        initialActivity={activityData}
      />

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
    backgroundColor: ThemeColors.background,
  },

  // Enhanced Header styles
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 14 : 10,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    color: ThemeColors.text,
    fontSize: scale(20),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  headerCategoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerCategoryText: {
    color: ThemeColors.text,
    fontSize: scale(10),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  headerIconGradient: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    alignItems: "center",
    justifyContent: "center",
  },

  // Tab Navigation styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: ThemeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  tabText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(13),
    fontWeight: "500",
  },
  activeTabText: {
    color: ThemeColors.primary,
    fontWeight: "600",
  },

  // Streak star styles
  streakStarContainer: {
    position: "relative",
    marginRight: 2,
  },
  streakOverflowText: {
    position: "absolute",
    top: -2,
    right: -2,
    color: "#FFD700",
    fontSize: scale(8),
    fontWeight: "bold",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteModalGradient: {
    padding: 24,
    alignItems: "center",
  },
  deleteModalTitle: {
    color: ThemeColors.text,
    fontSize: scale(20),
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  deleteCancelButtonText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ThemeColors.danger,
    alignItems: "center",
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: scale(14),
    fontWeight: "600",
  },
});

export default ActivityDetailScreen;
