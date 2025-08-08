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
import { ThemeColors } from "../../config/theme";

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

// Using centralized ThemeColors

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
  const baseColor = activity.color || ThemeColors.primary;
  const [currentStreak, setCurrentStreak] = useState(5);
  const [longestStreak, setLongestStreak] = useState(7);
  const [averageTime, setAverageTime] = useState(35);
  const [streakAnim] = useState(new Animated.Value(0));
  const [calendarAnim] = useState(new Animated.Value(0));
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("monthly");

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

  const streakCompletion = Math.min(
    100,
    Math.round((currentStreak / Math.max(1, longestStreak)) * 100)
  );

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

  // Calendar helpers anchored to latest sample date for better demo visuals
  const formatYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const max = mockStreakData.reduce((acc, cur) => {
      const t = new Date(cur.date).getTime();
      return t > acc ? t : acc;
    }, 0);
    return max ? new Date(max) : new Date();
  });

  const getLastNDays = (
    n: number
  ): Array<{
    date: string;
    completed: boolean;
    timeSpent: number;
    streak: number;
  }> => {
    const byDate = new Map(
      mockStreakData.map((d) => [
        d.date,
        { completed: d.completed, timeSpent: d.timeSpent, streak: d.streak },
      ])
    );
    const days: Array<{
      date: string;
      completed: boolean;
      timeSpent: number;
      streak: number;
    }> = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - i);
      const key = formatYMD(d);
      const v = byDate.get(key);
      days.push({
        date: key,
        completed: !!v?.completed,
        timeSpent: v?.timeSpent || 0,
        streak: v?.streak || 0,
      });
    }
    return days;
  };

  const getDaysOfCurrentMonth = (): Array<{
    date: string;
    completed: boolean;
    timeSpent: number;
    streak: number;
  }> => {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const end = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() + 1,
      0
    );
    const byDate = new Map(
      mockStreakData.map((d) => [
        d.date,
        { completed: d.completed, timeSpent: d.timeSpent, streak: d.streak },
      ])
    );
    const days: Array<{
      date: string;
      completed: boolean;
      timeSpent: number;
      streak: number;
    }> = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = formatYMD(dt);
      const v = byDate.get(key);
      days.push({
        date: key,
        completed: !!v?.completed,
        timeSpent: v?.timeSpent || 0,
        streak: v?.streak || 0,
      });
    }
    return days;
  };

  const renderStreakSummary = () => (
    <View style={styles.summaryCard}>
      <View style={[styles.cardAccent, { backgroundColor: baseColor }]} />
      <Text style={styles.sectionTitle}>Current Streak</Text>

      <View style={styles.summaryBody}>
        <View style={styles.streakDisplay}>
          {renderStreakStars(currentStreak, 24)}
        </View>

        <LinearGradient
          colors={[`${baseColor}15`, `${baseColor}08`]}
          style={styles.streakValuePill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakUnit}>days</Text>
        </LinearGradient>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${streakCompletion}%`, backgroundColor: baseColor },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{streakCompletion}%</Text>
      </View>

      <View style={styles.summaryStatsRow}>
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>{longestStreak}</Text>
          <Text style={styles.summaryStatLabel}>Longest</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>{averageTime}m</Text>
          <Text style={styles.summaryStatLabel}>Avg/Day</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>
            {mockStreakData.filter((d) => d.completed).length}
          </Text>
          <Text style={styles.summaryStatLabel}>Active Days</Text>
        </View>
      </View>

      <Text style={styles.streakMotivationText}>
        {currentStreak >= 7
          ? "🔥 Fire streak! Keep burning!"
          : currentStreak >= 3
          ? "💪 Great momentum! Keep going!"
          : "🚀 Getting started! Every day counts!"}
      </Text>
    </View>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <View style={[styles.cardAccent, { backgroundColor: baseColor }]} />
        <View style={styles.statCardInner}>
          <View style={styles.statIcon}>
            <Icon name="trophy" size={scale(20)} color={ThemeColors.warning} />
          </View>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statSubtext}>🏆 Personal Best</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.cardAccent, { backgroundColor: baseColor }]} />
        <View style={styles.statCardInner}>
          <View style={styles.statIcon}>
            <Icon name="time" size={scale(20)} color={ThemeColors.primary} />
          </View>
          <Text style={styles.statValue}>{averageTime}m</Text>
          <Text style={styles.statLabel}>Avg Time/Day</Text>
          <Text style={styles.statSubtext}>⏱️ Daily Average</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.cardAccent, { backgroundColor: baseColor }]} />
        <View style={styles.statCardInner}>
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
        </View>
      </View>
    </View>
  );

  const renderStreakCalendar = () => {
    const days =
      viewMode === "weekly" ? getLastNDays(7) : getDaysOfCurrentMonth();

    const getMonthYearLabel = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const getWeeklyRangeLabel = (d: Date) => {
      const end = d;
      const start = new Date(d);
      start.setDate(start.getDate() - 6);
      const startLabel = start.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
      const endLabel = end.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      return `${startLabel} – ${endLabel}`;
    };

    const handlePrev = () => {
      if (viewMode === "weekly") {
        setAnchorDate((prev) => {
          const d = new Date(prev);
          d.setDate(d.getDate() - 7);
          return d;
        });
      } else {
        setAnchorDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 15)
        );
      }
    };

    const handleNext = () => {
      if (viewMode === "weekly") {
        setAnchorDate((prev) => {
          const d = new Date(prev);
          d.setDate(d.getDate() + 7);
          return d;
        });
      } else {
        setAnchorDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 15)
        );
      }
    };

    const handleJumpToday = () => {
      const today = new Date();
      if (viewMode === "weekly") {
        setAnchorDate(today);
      } else {
        setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 15));
      }
    };

    const handleResetCurrent = () => {
      const max = mockStreakData.reduce((acc, cur) => {
        const t = new Date(cur.date).getTime();
        return t > acc ? t : acc;
      }, 0);
      const latest = max ? new Date(max) : new Date();
      setAnchorDate(
        viewMode === "weekly"
          ? latest
          : new Date(latest.getFullYear(), latest.getMonth(), 15)
      );
    };

    return (
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarHeaderLeft}>
            <View style={styles.calendarNav}>
              <TouchableOpacity onPress={handlePrev} activeOpacity={0.8}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.navButtonGradient}
                >
                  <Icon
                    name="chevron-back"
                    size={scale(14)}
                    color={ThemeColors.text}
                  />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.navLabel}>
                {viewMode === "weekly"
                  ? getWeeklyRangeLabel(anchorDate)
                  : getMonthYearLabel(anchorDate)}
              </Text>
              <TouchableOpacity onPress={handleJumpToday} activeOpacity={0.8}>
                <LinearGradient
                  colors={[
                    "rgba(0, 229, 255, 0.18)",
                    "rgba(0, 229, 255, 0.10)",
                  ]}
                  style={styles.navChipGradient}
                >
                  <Icon
                    name="today-outline"
                    size={scale(12)}
                    color={ThemeColors.primary}
                  />
                  <Text style={styles.navChipText}>Today</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetCurrent}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    "rgba(156, 108, 218, 0.18)",
                    "rgba(156, 108, 218, 0.10)",
                  ]}
                  style={styles.navChipGradient}
                >
                  <Icon
                    name="refresh"
                    size={scale(12)}
                    color={ThemeColors.secondary}
                  />
                  <Text style={styles.navChipText}>Reset</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.navButtonGradient}
                >
                  <Icon
                    name="chevron-forward"
                    size={scale(14)}
                    color={ThemeColors.text}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              onPress={() => setViewMode("weekly")}
              activeOpacity={0.8}
              style={styles.viewToggle}
            >
              <LinearGradient
                colors={
                  viewMode === "weekly"
                    ? [`${baseColor}30`, `${baseColor}18`]
                    : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]
                }
                style={styles.viewToggleGradient}
              >
                <Text
                  style={[
                    styles.viewToggleText,
                    viewMode === "weekly" && { color: ThemeColors.text },
                  ]}
                >
                  Weekly
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("monthly")}
              activeOpacity={0.8}
              style={styles.viewToggle}
            >
              <LinearGradient
                colors={
                  viewMode === "monthly"
                    ? [`${baseColor}30`, `${baseColor}18`]
                    : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]
                }
                style={styles.viewToggleGradient}
              >
                <Text
                  style={[
                    styles.viewToggleText,
                    viewMode === "monthly" && { color: ThemeColors.text },
                  ]}
                >
                  Monthly
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: baseColor }]}
              />
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
          <View style={styles.weekdayHeaderRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <Text key={d} style={styles.weekdayLabel}>
                {d}
              </Text>
            ))}
          </View>
          <View
            style={[
              styles.calendarGrid,
              viewMode === "weekly" &&
                ({ gridTemplateColumns: "repeat(7, 1fr)" } as any),
            ]}
          >
            {days.map((day) => (
              <TouchableOpacity
                key={day.date}
                style={styles.calendarDay}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    day.completed
                      ? ([`${baseColor}CC`, `${baseColor}99`] as [
                          string,
                          string
                        ])
                      : ([
                          "rgba(255, 255, 255, 0.1)",
                          "rgba(255, 255, 255, 0.05)",
                        ] as [string, string])
                  }
                  style={[
                    styles.daySquare,
                    day.completed &&
                      ({ borderColor: `${baseColor}30` } as const),
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
  };

  const renderStreakHistory = () => (
    <View style={styles.historyCard}>
      <View style={[styles.cardAccent, { backgroundColor: baseColor }]} />
      <Text style={styles.sectionTitle}>Streak History</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyScroll}
      >
        {mockStreakData.slice(0, 10).map((day) => (
          <LinearGradient
            key={day.date}
            colors={
              day.completed
                ? ([`${baseColor}20`, `${baseColor}10`] as [string, string])
                : (["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"] as [
                    string,
                    string
                  ])
            }
            style={styles.historyPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.historyDot,
                day.completed ? { backgroundColor: baseColor } : null,
              ]}
            />
            <View style={styles.historyPillTextCol}>
              <Text style={styles.historyDate}>{formatDate(day.date)}</Text>
              <Text style={styles.historyStreak}>Day {day.streak}</Text>
            </View>
            {day.completed && (
              <Text style={[styles.historyTime, { color: baseColor }]}>
                {day.timeSpent}m
              </Text>
            )}
          </LinearGradient>
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
    paddingTop: scale(12),
    paddingBottom: 20,
  },
  summaryCard: {
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
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  cardAccent: {
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryBody: {
    alignItems: "center",
    marginBottom: 12,
  },
  streakMainContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  streakDisplay: {
    marginBottom: 16,
  },
  streakCount: {
    color: ThemeColors.text,
    fontSize: scale(28),
    fontWeight: "800",
    marginRight: 8,
  },
  streakUnit: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  streakMotivationText: {
    color: ThemeColors.text,
    fontSize: scale(13),
    fontWeight: "600",
    textAlign: "center",
  },
  streakValuePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  summaryStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ThemeColors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    marginBottom: 12,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: ThemeColors.border,
    marginHorizontal: 8,
  },
  summaryStatValue: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
  },
  summaryStatLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: ThemeColors.card,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  statCardInner: {
    alignItems: "center",
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
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarHeaderLeft: {
    flex: 1,
  },
  calendarNav: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButtonGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  navLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  navChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  navChipText: {
    color: ThemeColors.text,
    fontSize: scale(12),
    fontWeight: "700",
  },
  viewToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewToggle: {
    borderRadius: 12,
    overflow: "hidden",
  },
  viewToggleGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  viewToggleText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
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
  weekdayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  weekdayLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    fontWeight: "600",
    width: 40,
    textAlign: "center",
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
    borderWidth: 1,
    borderColor: ThemeColors.border,
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
  historyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    marginRight: 12,
    minWidth: 120,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 0,
  },
  historyPillTextCol: {
    flex: 1,
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
