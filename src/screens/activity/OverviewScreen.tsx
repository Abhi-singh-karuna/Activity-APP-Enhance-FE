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
import { Activity } from "../../types";
import { ThemeColors } from "../../config/theme";
import SegmentedProgressBar from "../../components/SegmentedProgressBar";
import StepProgress from "../../components/StepProgress";
import VerticalStarStepper from "../../components/VerticalStarStepper";

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
    totalTimeSpent?: number;
    lastCompletedDate?: string;
  };
  onTimerToggle: () => void;
  renderStreakStars: (streak: number, size?: number) => React.ReactNode;
}

// Using centralized ThemeColors

const OverviewScreen: React.FC<OverviewScreenProps> = ({
  activity,
  onTimerToggle,
  renderStreakStars,
}) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  const [buttonRipple] = useState(new Animated.Value(0));

  // Dataset (will be replaced by API later). All UI reads from this object
  const sessionData = {
    activityId: "ACT-1023",
    activityName: "Design Review",
    color: "#FF9500",
    plannedDurationMinutes: 120,
    workSessions: [
      {
        startTime: "2025-08-09T09:00:00Z",
        endTime: "2025-08-09T09:20:00Z",
        durationMinutes: 20,
        coveragePercentage: 16.67,
      },
      {
        startTime: "2025-08-09T09:45:00Z",
        endTime: "2025-08-09T10:25:00Z",
        durationMinutes: 40,
        coveragePercentage: 33.33,
      },
      {
        startTime: "2025-08-09T11:00:00Z",
        endTime: "2025-08-09T11:50:00Z",
        durationMinutes: 50,
        coveragePercentage: 41.67,
      },
    ],
    totalWorkMinutes: 110,
    remainingMinutes: 10,
    progressPercentage: 88.67,
    status: "In Progress",
    lastUpdated: "2025-08-09T11:50:00Z",
  } as const;

  // Animate ring to dataset percentage
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: sessionData.progressPercentage || 0,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

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

  const baseColor = activity.color || ThemeColors.primary;
  const completion = sessionData.progressPercentage ?? 0;
  const getStatusGradient = (): [string, string] => {
    if (activity.isCompleted) {
      return ["#2D5A27", "#1A3318"];
    }
    if (activity.isPaused) {
      return ["#666666", "#444444"];
    }
    if (activity.isRunning) {
      return [`${baseColor}40`, `${baseColor}20`];
    }
    return [`${baseColor}15`, `${baseColor}08`];
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

  const formatTimeHHMMSS = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Activity Status Card with gradient wrapper */}
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardOuterGradient}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusCardInner}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {sessionData.activityName}
                </Text>
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
                  {sessionData.progressPercentage}%
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Streak</Text>
                <View style={styles.streakDisplay}>
                  {renderStreakStars(activity.streak || 0, 14)}
                </View>
              </View>
            </View>

            {completion > 0 && (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${completion}%`,
                        backgroundColor: baseColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>{completion}%</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Vertical rating/stepper (stars with color thresholds) */}
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardOuterGradient}
      >
        <View style={styles.stepCard}>
          <VerticalStarStepper
            progressPercent={sessionData.progressPercentage}
            labels={["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]}
            height={300}
            icons={["⭐️", "👥", "🎯", "📅", "📍"]}
          />
        </View>
      </LinearGradient>

      {/* Timer Card */}
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardOuterGradient}
      >
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Icon name="time" size={scale(16)} color={ThemeColors.primary} />
            <Text style={styles.timerTitle}>Timer</Text>
          </View>

          <View style={styles.timerContent}>
            {/* Stylish timer pill */}
            <LinearGradient
              colors={[ThemeColors.primary, ThemeColors.secondary]}
              style={styles.timerPill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity
                onPress={handleButtonPress}
                activeOpacity={0.85}
                style={styles.timerPillButton}
              >
                <Icon
                  name={activity.isRunning ? "pause" : "play"}
                  size={scale(16)}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.timerPillText}>
                {String(Math.floor(sessionData.remainingMinutes / 60)).padStart(
                  2,
                  "0"
                )}
                :{String(sessionData.remainingMinutes % 60).padStart(2, "0")}:00
              </Text>
            </LinearGradient>

            {/* Segmented progress bar with labels */}
            <View style={styles.hProgressContainer}>
              <SegmentedProgressBar
                total={sessionData.plannedDurationMinutes}
                height={16}
                radius={10}
                segments={sessionData.workSessions.map((s, idx) => ({
                  value: s.durationMinutes,
                  color: idx % 2 === 0 ? "#4CAF50" : "#FB8C00",
                  label: String(s.durationMinutes),
                }))}
                showLabels
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Activity Details Card */}
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardOuterGradient}
      >
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Activity Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Planned</Text>
            <Text style={styles.detailValue}>
              {Math.floor(sessionData.plannedDurationMinutes / 60)}h{" "}
              {sessionData.plannedDurationMinutes % 60}m
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Worked</Text>
            <Text style={styles.detailValue}>
              {Math.floor(sessionData.totalWorkMinutes / 60)}h{" "}
              {sessionData.totalWorkMinutes % 60}m
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text style={styles.detailValue}>
              {Math.floor(sessionData.remainingMinutes / 60)}h{" "}
              {sessionData.remainingMinutes % 60}m
            </Text>
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

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{sessionData.status}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {new Date(sessionData.lastUpdated).toLocaleString()}
            </Text>
          </View>

          {typeof activity.elapsedSeconds === "number" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Elapsed Time</Text>
              <Text style={styles.detailValue}>
                {formatTimeHHMMSS(activity.elapsedSeconds)}
              </Text>
            </View>
          )}

          {typeof activity.totalTimeSpent === "number" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Time Spent</Text>
              <Text style={styles.detailValue}>
                {formatTimeHHMMSS(activity.totalTimeSpent)}
              </Text>
            </View>
          )}

          {activity.lastCompletedDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Completed</Text>
              <Text style={styles.detailValue}>
                {activity.lastCompletedDate}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Notes and Description sections removed as requested */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  contentContainer: {
    paddingTop: scale(12),
    paddingBottom: 20,
  },
  cardOuterGradient: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  statusCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0,
  },
  statusCardInner: {
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
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0,
  },
  stepCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
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
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 14,
  },
  timerPillButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  timerPillText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: scale(16),
  },
  hProgressContainer: {
    width: "100%",
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  // Old segment/knob styles removed in favor of reusable component
  playButton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: scale(14),
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: ThemeColors.text,
    fontSize: scale(10),
    fontWeight: "600",
  },
  analogWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  analogCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  centerPlayButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  centerPlayGradient: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  detailsCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0,
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

  // Progress styles
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    color: "#fff",
    fontSize: scale(12),
    fontWeight: "700",
  },
});

export default OverviewScreen;
