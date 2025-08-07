import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity } from "../../types";

const { width } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

interface SessionHistory {
  id: string;
  date: string;
  duration: string;
  startTime: string;
  endTime: string;
  status: "completed" | "paused" | "interrupted";
  notes?: string;
  progress: number;
  calories?: number;
  intensity?: "low" | "medium" | "high";
  mood?: "great" | "good" | "okay" | "tired";
}

interface HistoryScreenProps {
  activity: Activity;
  sessions: SessionHistory[];
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
  cardLight: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "rgba(255, 255, 255, 0.1)",
};

// Enhanced mock data with more realistic information
const mockSessions: SessionHistory[] = [
  {
    id: "1",
    date: "2025-01-15",
    duration: "01:15:30",
    startTime: "08:00",
    endTime: "09:15",
    status: "completed",
    notes:
      "Excellent morning workout! Hit new PR on bench press (185lbs x 8). Energy was through the roof and form felt perfect on all lifts.",
    progress: 100,
    calories: 450,
    intensity: "high",
    mood: "great",
  },
  {
    id: "2",
    date: "2025-01-14",
    duration: "00:45:20",
    startTime: "07:30",
    endTime: "08:15",
    status: "completed",
    notes:
      "Good cardio session with HIIT intervals. Felt strong throughout and maintained good pace.",
    progress: 100,
    calories: 320,
    intensity: "medium",
    mood: "good",
  },
  {
    id: "3",
    date: "2025-01-13",
    duration: "00:35:00",
    startTime: "18:00",
    endTime: "18:35",
    status: "paused",
    notes:
      "Had to pause due to work emergency. Will continue tomorrow morning.",
    progress: 65,
    calories: 180,
    intensity: "medium",
    mood: "okay",
  },
  {
    id: "4",
    date: "2025-01-12",
    duration: "00:55:15",
    startTime: "08:15",
    endTime: "09:10",
    status: "completed",
    notes:
      "Amazing strength training session! New PR on deadlifts (275lbs x 5). Form was spot on.",
    progress: 100,
    calories: 520,
    intensity: "high",
    mood: "great",
  },
  {
    id: "5",
    date: "2025-01-11",
    duration: "00:25:30",
    startTime: "17:30",
    endTime: "17:55",
    status: "interrupted",
    notes: "Emergency call interrupted session. Will make up for it tomorrow.",
    progress: 40,
    calories: 120,
    intensity: "low",
    mood: "tired",
  },
  {
    id: "6",
    date: "2025-01-10",
    duration: "00:40:00",
    startTime: "09:00",
    endTime: "09:40",
    status: "completed",
    notes:
      "Morning yoga session. Great for flexibility and mindfulness. Feeling refreshed.",
    progress: 100,
    calories: 200,
    intensity: "low",
    mood: "good",
  },
  {
    id: "7",
    date: "2025-01-09",
    duration: "00:50:00",
    startTime: "16:00",
    endTime: "16:50",
    status: "completed",
    notes:
      "Intense HIIT workout. Burned lots of calories and felt amazing afterward.",
    progress: 100,
    calories: 480,
    intensity: "high",
    mood: "great",
  },
  {
    id: "8",
    date: "2025-01-08",
    duration: "00:20:00",
    startTime: "07:00",
    endTime: "07:20",
    status: "interrupted",
    notes: "Short session due to early meeting. Need to reschedule for later.",
    progress: 30,
    calories: 90,
    intensity: "low",
    mood: "okay",
  },
  {
    id: "9",
    date: "2025-01-07",
    duration: "00:42:00",
    startTime: "18:30",
    endTime: "19:12",
    status: "completed",
    notes:
      "Evening strength training. Focused on upper body and core. Good pump achieved.",
    progress: 100,
    calories: 380,
    intensity: "medium",
    mood: "good",
  },
  {
    id: "10",
    date: "2025-01-06",
    duration: "00:28:00",
    startTime: "06:45",
    endTime: "07:13",
    status: "completed",
    notes:
      "Early morning cardio session. Great way to start the day with energy.",
    progress: 100,
    calories: 250,
    intensity: "medium",
    mood: "good",
  },
];

const HistoryScreen: React.FC<HistoryScreenProps> = ({
  activity,
  sessions = mockSessions,
}) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const getStatusColor = (status: SessionHistory["status"]) => {
    switch (status) {
      case "completed":
        return ThemeColors.success;
      case "paused":
        return ThemeColors.warning;
      case "interrupted":
        return ThemeColors.danger;
      default:
        return ThemeColors.textSecondary;
    }
  };

  const getStatusIcon = (status: SessionHistory["status"]) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "paused":
        return "pause-circle";
      case "interrupted":
        return "close-circle";
      default:
        return "time";
    }
  };

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case "high":
        return "#FF4757";
      case "medium":
        return "#FF9500";
      case "low":
        return "#4ECDC4";
      default:
        return ThemeColors.textSecondary;
    }
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case "great":
        return "happy";
      case "good":
        return "happy-outline";
      case "okay":
        return "neutral";
      case "tired":
        return "sad-outline";
      default:
        return "happy-outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const renderSessionItem = useCallback(
    ({ item }: { item: SessionHistory }) => {
      const isSelected = selectedSession === item.id;

      return (
        <TouchableOpacity
          style={[styles.sessionItem, isSelected && styles.sessionItemSelected]}
          onPress={() => setSelectedSession(isSelected ? null : item.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isSelected
                ? ["rgba(0, 229, 255, 0.1)", "rgba(156, 108, 218, 0.1)"]
                : ["transparent", "transparent"]
            }
            style={styles.sessionItemGradient}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionDate}>
                <Text style={styles.sessionDateText}>
                  {formatDate(item.date)}
                </Text>
                <Text style={styles.sessionTimeText}>
                  {formatTime(item.startTime)} - {formatTime(item.endTime)}
                </Text>
              </View>

              <View style={styles.sessionStatus}>
                <Icon
                  name={getStatusIcon(item.status)}
                  size={scale(16)}
                  color={getStatusColor(item.status)}
                />
                <Text
                  style={[
                    styles.sessionStatusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.sessionDetails}>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionInfoItem}>
                  <Icon
                    name="time"
                    size={scale(12)}
                    color={ThemeColors.textSecondary}
                  />
                  <Text style={styles.sessionInfoText}>{item.duration}</Text>
                </View>

                <View style={styles.sessionInfoItem}>
                  <Icon
                    name="trending-up"
                    size={scale(12)}
                    color={ThemeColors.textSecondary}
                  />
                  <Text style={styles.sessionInfoText}>{item.progress}%</Text>
                </View>

                {item.calories && (
                  <View style={styles.sessionInfoItem}>
                    <Icon
                      name="flame"
                      size={scale(12)}
                      color={ThemeColors.textSecondary}
                    />
                    <Text style={styles.sessionInfoText}>
                      {item.calories} cal
                    </Text>
                  </View>
                )}
              </View>

              {item.intensity && (
                <View style={styles.intensityContainer}>
                  <View
                    style={[
                      styles.intensityDot,
                      { backgroundColor: getIntensityColor(item.intensity) },
                    ]}
                  />
                  <Text style={styles.intensityText}>
                    {item.intensity.charAt(0).toUpperCase() +
                      item.intensity.slice(1)}{" "}
                    Intensity
                  </Text>
                </View>
              )}

              {item.mood && (
                <View style={styles.moodContainer}>
                  <Icon
                    name={getMoodIcon(item.mood)}
                    size={scale(14)}
                    color={ThemeColors.textSecondary}
                  />
                  <Text style={styles.moodText}>
                    {item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}{" "}
                    Mood
                  </Text>
                </View>
              )}

              {isSelected && item.notes && (
                <View style={styles.sessionNotes}>
                  <Text style={styles.sessionNotesText}>{item.notes}</Text>
                </View>
              )}
            </View>

            <View style={styles.progressBar}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: getStatusColor(item.status),
                    },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [selectedSession]
  );

  const renderStatsCard = () => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const totalMinutes = sessions.reduce((acc, session) => {
      const [hours, minutes] = session.duration.split(":").map(Number);
      return acc + hours * 60 + minutes;
    }, 0);
    const avgProgress = Math.round(
      sessions.reduce((acc, session) => acc + session.progress, 0) /
        sessions.length
    );
    const totalCalories = sessions.reduce(
      (acc, session) => acc + (session.calories || 0),
      0
    );

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Session Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMinutes}m</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgProgress}%</Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
          </View>
        </View>

        <View style={styles.caloriesContainer}>
          <Icon name="flame" size={scale(16)} color={ThemeColors.warning} />
          <Text style={styles.caloriesText}>
            {totalCalories} calories burned
          </Text>
        </View>
      </View>
    );
  };

  const renderProgressChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Progress Over Time</Text>

      <View style={styles.chartContainer}>
        <View style={styles.chartYAxis}>
          <Text style={styles.chartYLabel}>100%</Text>
          <Text style={styles.chartYLabel}>75%</Text>
          <Text style={styles.chartYLabel}>50%</Text>
          <Text style={styles.chartYLabel}>25%</Text>
          <Text style={styles.chartYLabel}>0%</Text>
        </View>

        <View style={styles.chartContent}>
          <View style={styles.chartBars}>
            {sessions.slice(0, 7).map((session, index) => (
              <View key={session.id} style={styles.chartBarContainer}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${session.progress}%`,
                        backgroundColor: getStatusColor(session.status),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>
                  {new Date(session.date).getDate()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {renderStatsCard()}
            {renderProgressChart()}
            <Text style={styles.sectionTitle}>Session History</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  statsCard: {
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
  statsTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: ThemeColors.primary,
    fontSize: scale(20),
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
    textAlign: "center",
  },
  caloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
  },
  caloriesText: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
  },
  chartCard: {
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
  chartTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    height: 120,
  },
  chartYAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  chartYLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "500",
  },
  chartContent: {
    flex: 1,
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    paddingBottom: 20,
  },
  chartBarContainer: {
    alignItems: "center",
    flex: 1,
  },
  chartBar: {
    width: 20,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  chartBarFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 10,
  },
  chartBarLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "500",
  },
  sectionTitle: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "600",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sessionItem: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sessionItemSelected: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sessionItemGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionDate: {
    flex: 1,
  },
  sessionDateText: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: 2,
  },
  sessionTimeText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },
  sessionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionStatusText: {
    fontSize: scale(12),
    fontWeight: "600",
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  sessionInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionInfoText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },
  intensityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  intensityText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(11),
    fontWeight: "500",
  },
  moodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  moodText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(11),
    fontWeight: "500",
  },
  sessionNotes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
  },
  sessionNotesText: {
    color: ThemeColors.text,
    fontSize: scale(12),
    lineHeight: 16,
    fontStyle: "italic",
  },
  progressBar: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  separator: {
    height: 12,
  },
});

export default HistoryScreen;
