import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity, Category } from "../../types";

const { width } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

interface OverviewScreenProps {
  activity: Activity & {
    isRunning?: boolean;
    isCompleted?: boolean;
    isPaused?: boolean;
    currentTimer?: string;
    elapsedSeconds?: number;
    remainingSeconds?: number;
    completionPercentage?: number;
    streak?: number;
    description?: string;
    tags?: string[];
    notes?: string;
  };
  onTimerToggle: () => void;
  renderStreakStars: (streak: number, size?: number) => React.ReactNode;
}

const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "rgba(255, 255, 255, 0.1)",
};

const OverviewScreen: React.FC<OverviewScreenProps> = ({
  activity,
  onTimerToggle,
  renderStreakStars,
}) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  const [buttonRipple] = useState(new Animated.Value(0));

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: activity.completionPercentage || 0,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activity.completionPercentage]);

  // Button press animation
  const handleButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRipple, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRipple, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    onTimerToggle();
  }, [onTimerToggle]);

  const getStatusGradient = (): [string, string] => {
    if (activity.isCompleted) {
      return ["#4ECDC4", "#44A08D"];
    }
    if (activity.isRunning) {
      return ["#00E5FF", "#9C6CDA"];
    }
    if (activity.isPaused) {
      return ["#666666", "#444444"];
    }
    return ["#FF9500", "#FF6B35"];
  };

  const getStatusText = () => {
    if (activity.isCompleted) return "Completed";
    if (activity.isRunning) return "Running";
    if (activity.isPaused) return "Paused";
    return "Not Started";
  };

  const getStatusIcon = () => {
    if (activity.isCompleted) return "checkmark-circle";
    if (activity.isRunning) return "play-circle";
    if (activity.isPaused) return "pause-circle";
    return "time";
  };

  const getPriorityText = () => {
    switch (activity.priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Medium";
    }
  };

  const getPriorityColor = () => {
    switch (activity.priority) {
      case 1:
        return "#4ECDC4";
      case 2:
        return "#FF9500";
      case 3:
        return "#FF4757";
      default:
        return "#FF9500";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Activity Status Card */}
      <View style={styles.statusCard}>
        <LinearGradient
          colors={getStatusGradient()}
          style={styles.statusCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{activity.title}</Text>
              <View style={styles.statusBadge}>
                <Icon name={getStatusIcon()} size={scale(14)} color="#fff" />
                <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
              </View>
            </View>
            <View style={styles.categoryBadge}>
              <Icon name="folder" size={scale(12)} color="#fff" />
              <Text style={styles.categoryText}>{activity.category}</Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Progress</Text>
              <Text style={styles.statusValue}>
                {activity.completionPercentage || 0}%
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Current Streak</Text>
              <View style={styles.streakDisplay}>
                {renderStreakStars(activity.streak || 0, 14)}
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Icon name="time" size={scale(16)} color={ThemeColors.primary} />
          <Text style={styles.timerTitle}>Timer</Text>
        </View>

        <View style={styles.timerContent}>
          <Text style={styles.timerValue}>
            {activity.currentTimer || activity.duration}
          </Text>

          <TouchableOpacity
            style={styles.timerControls}
            onPress={handleButtonPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.timerButton,
                { transform: [{ scale: buttonScale }] },
              ]}
            >
              <LinearGradient
                colors={
                  activity.isRunning
                    ? ["#FF4757", "#FF3742"]
                    : ["#4ECDC4", "#44A08D"]
                }
                style={styles.timerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon
                  name={activity.isRunning ? "pause" : "play"}
                  size={scale(20)}
                  color="#fff"
                />
                <Text style={styles.timerButtonText}>
                  {activity.isRunning ? "Pause" : "Start"}
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Activity Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{activity.duration}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date</Text>
          <Text style={styles.detailValue}>{activity.startDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Date</Text>
          <Text style={styles.detailValue}>{activity.endDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority</Text>
          <View style={styles.priorityContainer}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: getPriorityColor() },
              ]}
            />
            <Text style={styles.detailValue}>{getPriorityText()}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Color</Text>
          <View style={styles.colorIndicator}>
            <View
              style={[styles.colorDot, { backgroundColor: activity.color }]}
            />
            <Text style={styles.detailValue}>{activity.color}</Text>
          </View>
        </View>
      </View>

      {/* Description Card */}
      {activity.description && (
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{activity.description}</Text>
        </View>
      )}

      {/* Tags Card */}
      {activity.tags && activity.tags.length > 0 && (
        <View style={styles.tagsCard}>
          <View style={styles.tagsHeader}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <TouchableOpacity style={styles.addTagButton}>
              <Icon name="add" size={scale(16)} color={ThemeColors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {activity.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notes Preview Card */}
      <View style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity style={styles.addNoteButton}>
            <Icon name="add" size={scale(16)} color={ThemeColors.primary} />
            <Text style={styles.addNoteText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesPreview}>
          <Text style={styles.notesPreviewText}>
            {activity.notes || 'No notes yet. Tap "Add Note" to get started.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.viewAllNotesButton}>
          <LinearGradient
            colors={["rgba(0, 229, 255, 0.1)", "rgba(156, 108, 218, 0.1)"]}
            style={styles.viewAllNotesGradient}
          >
            <Text style={styles.viewAllNotesText}>View All Notes</Text>
            <Icon
              name="chevron-forward"
              size={scale(14)}
              color={ThemeColors.primary}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
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
    alignItems: "flex-start",
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: "#fff",
    fontSize: scale(20),
    fontWeight: "700",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: scale(12),
    fontWeight: "600",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  categoryText: {
    color: "#fff",
    fontSize: scale(10),
    fontWeight: "600",
  },
  statusDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusItem: {
    alignItems: "center",
  },
  statusLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: scale(12),
    fontWeight: "500",
    marginBottom: 4,
  },
  statusValue: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
  },
  streakDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerCard: {
    backgroundColor: ThemeColors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  timerTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
  },
  timerContent: {
    alignItems: "center",
  },
  timerValue: {
    color: ThemeColors.text,
    fontSize: scale(32),
    fontWeight: "700",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  timerControls: {
    alignItems: "center",
  },
  timerButton: {
    borderRadius: 50,
    overflow: "hidden",
  },
  timerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  timerButtonText: {
    color: "#fff",
    fontSize: scale(14),
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: ThemeColors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  detailLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "500",
  },
  detailValue: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  descriptionCard: {
    backgroundColor: ThemeColors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  descriptionText: {
    color: ThemeColors.text,
    fontSize: scale(14),
    lineHeight: 22,
  },
  tagsCard: {
    backgroundColor: ThemeColors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tagsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: ThemeColors.text,
    fontSize: scale(12),
    fontWeight: "500",
  },
  notesCard: {
    backgroundColor: ThemeColors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addNoteText: {
    color: ThemeColors.primary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  notesPreview: {
    marginBottom: 16,
  },
  notesPreviewText: {
    color: ThemeColors.text,
    fontSize: scale(14),
    lineHeight: 22,
  },
  viewAllNotesButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  viewAllNotesGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  viewAllNotesText: {
    color: ThemeColors.primary,
    fontSize: scale(14),
    fontWeight: "600",
  },
});

export default OverviewScreen;
