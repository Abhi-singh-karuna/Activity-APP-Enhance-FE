import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity } from "../../types";

const { width } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

interface StreakDay {
  date: string;
  completed: boolean;
  timeSpent: number;
  streak: number;
}

interface StreakScreenProps {
  activity: Activity;
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

// Mock data for demonstration
const mockStreakData: StreakDay[] = [
  { date: "2025-08-02", completed: true, timeSpent: 45, streak: 5 },
  { date: "2025-08-01", completed: true, timeSpent: 30, streak: 4 },
  { date: "2025-07-31", completed: true, timeSpent: 20, streak: 3 },
  { date: "2025-07-30", completed: true, timeSpent: 40, streak: 2 },
  { date: "2025-07-29", completed: true, timeSpent: 25, streak: 1 },
  { date: "2025-07-28", completed: false, timeSpent: 0, streak: 0 },
  { date: "2025-07-27", completed: true, timeSpent: 35, streak: 1 },
  { date: "2025-07-26", completed: true, timeSpent: 50, streak: 2 },
  { date: "2025-07-25", completed: false, timeSpent: 0, streak: 0 },
  { date: "2025-07-24", completed: true, timeSpent: 30, streak: 1 },
  { date: "2025-07-23", completed: true, timeSpent: 45, streak: 2 },
  { date: "2025-07-22", completed: true, timeSpent: 25, streak: 3 },
  { date: "2025-07-21", completed: true, timeSpent: 40, streak: 4 },
  { date: "2025-07-20", completed: true, timeSpent: 35, streak: 5 },
  { date: "2025-07-19", completed: false, timeSpent: 0, streak: 0 },
  { date: "2025-07-18", completed: true, timeSpent: 30, streak: 1 },
  { date: "2025-07-17", completed: true, timeSpent: 45, streak: 2 },
  { date: "2025-07-16", completed: true, timeSpent: 20, streak: 3 },
  { date: "2025-07-15", completed: true, timeSpent: 50, streak: 4 },
  { date: "2025-07-14", completed: true, timeSpent: 35, streak: 5 },
  { date: "2025-07-13", completed: true, timeSpent: 25, streak: 6 },
  { date: "2025-07-12", completed: true, timeSpent: 40, streak: 7 },
  { date: "2025-07-11", completed: false, timeSpent: 0, streak: 0 },
  { date: "2025-07-10", completed: true, timeSpent: 30, streak: 1 },
  { date: "2025-07-09", completed: true, timeSpent: 45, streak: 2 },
  { date: "2025-07-08", completed: true, timeSpent: 35, streak: 3 },
  { date: "2025-07-07", completed: true, timeSpent: 25, streak: 4 },
  { date: "2025-07-06", completed: true, timeSpent: 50, streak: 5 },
  { date: "2025-07-05", completed: true, timeSpent: 30, streak: 6 },
  { date: "2025-07-04", completed: true, timeSpent: 40, streak: 7 },
  { date: "2025-07-03", completed: false, timeSpent: 0, streak: 0 },
  { date: "2025-07-02", completed: true, timeSpent: 35, streak: 1 },
  { date: "2025-07-01", completed: true, timeSpent: 45, streak: 2 },
];

const StreakScreen: React.FC<StreakScreenProps> = ({
  activity,
  renderStreakStars,
}) => {
  const [currentStreak, setCurrentStreak] = useState(5);
  const [longestStreak, setLongestStreak] = useState(7);
  const [averageTime, setAverageTime] = useState(35);
  const [streakAnim] = useState(new Animated.Value(0));
  const [calendarAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate streak progress
    Animated.timing(streakAnim, {
      toValue: currentStreak,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate calendar appearance
    Animated.timing(calendarAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentStreak]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  const renderStreakSummary = () => (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={["#00E5FF", "#9C6CDA", "#FF6B9D"]}
        style={styles.summaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIconContainer}>
            <Icon name="flame" size={scale(28)} color="#fff" />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Current Streak</Text>
            <Text style={styles.summarySubtitle}>🔥 Amazing progress!</Text>
          </View>
        </View>

        <View style={styles.streakMainContent}>
          <View style={styles.streakDisplay}>
            {renderStreakStars(currentStreak, 24)}
          </View>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakUnit}>days</Text>
        </View>

        <View style={styles.streakMotivation}>
          <Text style={styles.streakMotivationText}>
            {currentStreak >= 7
              ? "🔥 Fire streak! Keep burning!"
              : currentStreak >= 3
              ? "💪 Great momentum! Keep going!"
              : "🚀 Getting started! Every day counts!"}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <LinearGradient
          colors={["rgba(255, 149, 0, 0.1)", "rgba(255, 149, 0, 0.05)"]}
          style={styles.statCardGradient}
        >
          <View style={styles.statIcon}>
            <Icon name="trophy" size={scale(20)} color={ThemeColors.warning} />
          </View>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statSubtext}>🏆 Personal Best</Text>
        </LinearGradient>
      </View>

      <View style={styles.statCard}>
        <LinearGradient
          colors={["rgba(0, 229, 255, 0.1)", "rgba(0, 229, 255, 0.05)"]}
          style={styles.statCardGradient}
        >
          <View style={styles.statIcon}>
            <Icon name="time" size={scale(20)} color={ThemeColors.primary} />
          </View>
          <Text style={styles.statValue}>{averageTime}m</Text>
          <Text style={styles.statLabel}>Avg Time/Day</Text>
          <Text style={styles.statSubtext}>⏱️ Daily Average</Text>
        </LinearGradient>
      </View>

      <View style={styles.statCard}>
        <LinearGradient
          colors={["rgba(78, 205, 196, 0.1)", "rgba(78, 205, 196, 0.05)"]}
          style={styles.statCardGradient}
        >
          <View style={styles.statIcon}>
            <Icon
              name="calendar"
              size={scale(20)}
              color={ThemeColors.success}
            />
          </View>
          <Text style={styles.statValue}>
            {mockStreakData.filter((day) => day.completed).length}
          </Text>
          <Text style={styles.statLabel}>Total Days</Text>
          <Text style={styles.statSubtext}>📅 Active Days</Text>
        </LinearGradient>
      </View>
    </View>
  );

  const renderStreakCalendar = () => (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>30-Day Streak Calendar</Text>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4ECDC4" }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: "rgba(255, 255, 255, 0.2)" },
              ]}
            />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </View>

      <Animated.View
        style={[
          styles.calendarContainer,
          {
            opacity: calendarAnim,
            transform: [{ scale: calendarAnim }],
          },
        ]}
      >
        <View style={styles.calendarGrid}>
          {mockStreakData.map((day, index) => (
            <TouchableOpacity
              key={day.date}
              style={styles.calendarDay}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  day.completed
                    ? ["#4ECDC4", "#44A08D"]
                    : ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]
                }
                style={[
                  styles.daySquare,
                  day.completed && styles.daySquareCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    day.completed && styles.dayNumberCompleted,
                  ]}
                >
                  {new Date(day.date).getDate()}
                </Text>
                {day.completed && (
                  <View style={styles.completedIndicator}>
                    <Icon name="checkmark" size={scale(8)} color="#fff" />
                  </View>
                )}
              </LinearGradient>
              <Text style={styles.dayLabel}>{getDayOfWeek(day.date)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );

  const renderStreakHistory = () => (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>Streak History</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyScroll}
      >
        {mockStreakData.slice(0, 10).map((day) => (
          <View key={day.date} style={styles.historyItem}>
            <View
              style={[
                styles.historyDot,
                day.completed && styles.historyDotCompleted,
              ]}
            />
            <Text style={styles.historyDate}>{formatDate(day.date)}</Text>
            <Text style={styles.historyStreak}>Day {day.streak}</Text>
            {day.completed && (
              <Text style={styles.historyTime}>{day.timeSpent}m</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {renderStreakSummary()}
      {renderStatsGrid()}
      {renderStreakCalendar()}
      {renderStreakHistory()}
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
  summaryCard: {
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
  summaryGradient: {
    padding: 24,
    alignItems: "center",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: 4,
  },
  summarySubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: scale(14),
    fontWeight: "500",
  },
  streakMainContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  streakDisplay: {
    marginBottom: 16,
  },
  streakCount: {
    color: "#fff",
    fontSize: scale(36),
    fontWeight: "800",
    marginBottom: 4,
  },
  streakUnit: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: scale(16),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  streakMotivation: {
    alignItems: "center",
  },
  streakMotivationText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: scale(14),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    color: ThemeColors.text,
    fontSize: scale(20),
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  statSubtext: {
    color: ThemeColors.textTertiary,
    fontSize: scale(10),
    fontWeight: "500",
    textAlign: "center",
  },
  calendarCard: {
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
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
  },
  calendarLegend: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "500",
  },
  calendarContainer: {
    alignItems: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  calendarDay: {
    alignItems: "center",
    width: 40,
  },
  daySquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  daySquareCompleted: {
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  dayNumber: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "600",
  },
  dayNumberCompleted: {
    color: "#fff",
  },
  completedIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  dayLabel: {
    color: ThemeColors.textTertiary,
    fontSize: scale(8),
    fontWeight: "500",
  },
  historyCard: {
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
  historyTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: 16,
  },
  historyScroll: {
    paddingRight: 20,
  },
  historyItem: {
    alignItems: "center",
    marginRight: 20,
    minWidth: 60,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 8,
  },
  historyDotCompleted: {
    backgroundColor: ThemeColors.success,
  },
  historyDate: {
    color: ThemeColors.text,
    fontSize: scale(10),
    fontWeight: "600",
    marginBottom: 2,
  },
  historyStreak: {
    color: ThemeColors.textSecondary,
    fontSize: scale(8),
    fontWeight: "500",
    marginBottom: 2,
  },
  historyTime: {
    color: ThemeColors.primary,
    fontSize: scale(8),
    fontWeight: "600",
  },
});

export default StreakScreen;
