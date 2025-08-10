import React, { useState, useEffect } from "react";
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

interface ApiStreakData {
  streak_Day: StreakDay[];
  longest_streak_day: number;
  current_streak_day: number;
  is_longest_is_current: boolean;
  average_streak: number;
  total_day: number;
  remaining_day: number;
  streak_history: Array<
    | { one_star: number }
    | { two_star: number }
    | { three_star: number }
    | { four_star: number }
    | { five_star: number }
  >;
}

interface StreakScreenProps {
  activity: Activity & {
    isRunning?: boolean;
    isCompleted?: boolean;
    isPaused?: boolean;
  };
  renderStreakStars: (streak: number, size?: number) => React.ReactNode;
}

// Using centralized ThemeColors

// Mock API response (replace with real API integration later)
const mockApiData: ApiStreakData = {
  streak_Day: [
    { date: "2025-08-02", completed: true, timeSpent: 45, streak: 5 },
    { date: "2025-08-01", completed: false, timeSpent: 30, streak: 4 },
    { date: "2025-07-31", completed: true, timeSpent: 20, streak: 3 },
    { date: "2025-07-30", completed: true, timeSpent: 40, streak: 2 },
  ],
  longest_streak_day: 7,
  current_streak_day: 5,
  is_longest_is_current: false,
  average_streak: 3.5,
  total_day: 35,
  remaining_day: 24,
  streak_history: [
    { one_star: 5 },
    { two_star: 4 },
    { three_star: 3 },
    { four_star: 2 },
    { five_star: 2 },
  ],
};

// Normalize for calendar rendering
const mockStreakData: StreakDay[] = mockApiData.streak_Day;

const StreakScreen: React.FC<StreakScreenProps> = ({
  activity,
  renderStreakStars,
}) => {
  const baseColor = activity.color || ThemeColors.primary;
  const [currentStreak, setCurrentStreak] = useState<number>(
    mockApiData.current_streak_day
  );
  const [longestStreak, setLongestStreak] = useState<number>(
    mockApiData.longest_streak_day
  );
  const [averageStreak, setAverageStreak] = useState<number>(
    mockApiData.average_streak
  );
  const [streakAnim] = useState(new Animated.Value(0));
  const [calendarAnim] = useState(new Animated.Value(0));
  // Only monthly view is supported

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
    hasData: boolean;
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
      hasData: boolean;
    }> = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = formatYMD(dt);
      const v = byDate.get(key);
      days.push({
        date: key,
        completed: !!v?.completed,
        timeSpent: v?.timeSpent || 0,
        streak: v?.streak || 0,
        hasData: byDate.has(key),
      });
    }
    return days;
  };

  const renderStreakSummary = () => (
    <LinearGradient
      colors={getStatusGradient()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardOuterGradient}
    >
      <View style={styles.summaryCard}>
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
            <Text style={styles.summaryStatValue}>
              {averageStreak.toFixed(1)}
            </Text>
            <Text style={styles.summaryStatLabel}>Avg Stars/Day</Text>
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
    </LinearGradient>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardOuterGradient}
      >
        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <View style={styles.statIcon}>
              <Icon
                name="trophy"
                size={scale(20)}
                color={ThemeColors.warning}
              />
            </View>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statSubtext}>
              {mockApiData.is_longest_is_current
                ? "Matches current"
                : "🏆 Personal Best"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardOuterGradient}
      >
        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <View style={styles.statIcon}>
              <Icon name="star" size={scale(20)} color={ThemeColors.primary} />
            </View>
            <Text style={styles.statValue}>{averageStreak.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Stars/Day</Text>
            <Text style={styles.statSubtext}>⏱️ Rolling Average</Text>
          </View>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardOuterGradient}
      >
        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <View style={styles.statIcon}>
              <Icon
                name="calendar"
                size={scale(20)}
                color={ThemeColors.success}
              />
            </View>
            <Text style={styles.statValue}>{mockApiData.total_day}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
            <Text
              style={styles.statSubtext}
            >{`${mockApiData.remaining_day} days remaining`}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStreakCalendar = () => {
    const days = getDaysOfCurrentMonth();

    const getMonthYearLabel = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const handlePrev = () => {
      setAnchorDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 15)
      );
    };

    const handleNext = () => {
      setAnchorDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 15)
      );
    };

    const handleJumpToday = () => {
      const today = new Date();
      setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 15));
    };

    const handleResetCurrent = () => {
      const max = mockStreakData.reduce((acc, cur) => {
        const t = new Date(cur.date).getTime();
        return t > acc ? t : acc;
      }, 0);
      const latest = max ? new Date(max) : new Date();
      setAnchorDate(new Date(latest.getFullYear(), latest.getMonth(), 15));
    };

    // Compute leading/trailing placeholders for proper monthly grid alignment
    const firstOfMonth = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      1
    );
    const leading = firstOfMonth.getDay(); // 0=Sun ... 6=Sat
    const totalCells = leading + days.length;
    const rows = Math.ceil(totalCells / 7);
    const trailing = rows * 7 - totalCells;

    return (
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardOuterGradient}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View style={styles.calendarHeaderLeft}>
              <View style={styles.calendarNav}>
                <TouchableOpacity onPress={handlePrev} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
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
                  {getMonthYearLabel(anchorDate)}
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
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
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
            {/* Monthly view only; toggle removed */}
            {/* Legend moved to bottom of the card */}
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
            <View style={styles.calendarGrid}>
              {Array.from({ length: leading }).map((_, idx) => (
                <View key={`lead-${idx}`} style={styles.calendarDay}>
                  <View style={styles.daySquarePlaceholder} />
                </View>
              ))}
              {days.map((day) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayKey = formatYMD(today);
                const isToday = day.date === todayKey;
                const dayDate = new Date(day.date);
                const isFuture = dayDate > today;
                // Only treat future days as out of range; past days rely solely on list data
                const isOutOfRange = isFuture;
                const isGray = !day.hasData; // not present in list => gray
                return (
                  <TouchableOpacity
                    key={day.date}
                    style={styles.calendarDay}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.daySquare,
                        isGray || isOutOfRange
                          ? ({ borderColor: ThemeColors.border } as const)
                          : day.completed
                          ? ({ borderColor: ThemeColors.success } as const)
                          : ({ borderColor: ThemeColors.danger } as const),
                        isToday && styles.daySquareToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          (isGray || isOutOfRange) && styles.dayNumberMuted,
                        ]}
                      >
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                    {day.hasData && !isOutOfRange ? (
                      <View style={styles.dayStreakRow}>
                        <Icon
                          name="star"
                          size={scale(8)}
                          color={
                            day.completed
                              ? ThemeColors.success
                              : ThemeColors.danger
                          }
                        />
                        <Text
                          style={[
                            styles.dayStreakText,
                            {
                              color: day.completed
                                ? ThemeColors.success
                                : ThemeColors.danger,
                            },
                          ]}
                        >
                          {day.streak}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.dayStreakSpacer} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {Array.from({ length: trailing }).map((_, idx) => (
                <View key={`trail-${idx}`} style={styles.calendarDay}>
                  <View style={styles.daySquarePlaceholder} />
                </View>
              ))}
            </View>
            <View style={styles.calendarLegendBottom}>
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
          </Animated.View>
        </View>
      </LinearGradient>
    );
  };

  const renderStreakHistory = () => (
    <LinearGradient
      colors={getStatusGradient()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardOuterGradient}
    >
      <View style={styles.historyCard}>
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
    </LinearGradient>
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
  cardOuterGradient: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  summaryCard: {
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
  // cardAccent removed in favor of gradient wrapper like OverviewScreen
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
  statCardOuterGradient: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0,
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
  // weekly/monthly toggle styles removed
  calendarTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
  },
  calendarLegend: {
    flexDirection: "row",
    gap: 12,
  },
  calendarLegendBottom: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 12,
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
  dayStreakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    minHeight: 10,
  },
  dayStreakText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(8),
    fontWeight: "700",
  },
  dayStreakSpacer: {
    height: 10,
    marginTop: 2,
  },
  daySquarePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    opacity: 0,
  },
  daySquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: ThemeColors.border,
    backgroundColor: "transparent",
  },
  daySquareToday: {
    borderRadius: 16,
    borderColor: ThemeColors.primary,
    borderWidth: 1,
    shadowColor: ThemeColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  daySquareCompleted: {
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  dayNumber: {
    color: ThemeColors.text,
    fontSize: scale(10),
    fontWeight: "700",
  },
  dayNumberMuted: {
    color: ThemeColors.textTertiary,
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
  // dayLabel removed since weekday is already shown in header
  historyCard: {
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
