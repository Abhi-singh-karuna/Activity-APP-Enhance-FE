import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { RootStackParamList } from "../../navigation";
import { CompletionRate, Activity, Task } from "../../types";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import StyledText from "../../components/StyledText";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../../context/AppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type StatsRouteProp = RouteProp<RootStackParamList, "Stats">;

// Custom type definitions or imports from types file
interface DailyStats {
  day: string;
  hours: number;
}

interface TaskStats {
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

interface DailyTaskCompletion {
  day: string;
  completed: number;
  total: number;
}

// Extending the CompletionRate type to include the fields we're using
type CompletionRateExtended = {
  category: string;
  percentage: number;
};

// Extended StatsData interface
interface StatsDataExtended {
  totalHours: string;
  billableHours: string;
  billablePercentage: string;
  completionRates: CompletionRateExtended[];
  dailyStats: DailyStats[];
  taskStats: TaskStats;
  taskCompletionByDay: DailyTaskCompletion[];
  taskCompletionByCategory: CompletionRateExtended[];
}

const TIME_PERIODS = [
  "Yesterday",
  "Last Week",
  "Last Month",
  "This Year",
  "Custom",
];

// API URL - replace with your actual backend URL
const API_BASE_URL = "https://your-backend-api.com";

const StatsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StatsRouteProp>();
  const { categories } = useAppContext();

  const [activeTab, setActiveTab] = useState<
    "activities" | "tasks" | "combined"
  >("activities");
  const [selectedPeriod, setSelectedPeriod] = useState("Last Week");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [statsData, setStatsData] = useState<StatsDataExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats data from backend
  const fetchStatsData = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/stats?period=${selectedPeriod
        .toLowerCase()
        .replace(" ", "_")}`;

      // Add date range parameters for custom period
      if (selectedPeriod === "Custom") {
        url += `&startDate=${format(
          dateRange.startDate,
          "yyyy-MM-dd"
        )}&endDate=${format(dateRange.endDate, "yyyy-MM-dd")}`;
      }

      // For development purposes, use mock data
      // In production, uncomment this code to use the real API
      /*
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats data: ${response.status}`);
      }
      const data = await response.json();
      setStatsData(data);
      setLoading(false);
      */

      // Mock data for development
      setTimeout(() => {
        setStatsData({
          totalHours: "26:50:32",
          billableHours: "05:00:20",
          billablePercentage: "33.04%",
          completionRates: [
            { category: "Sport", percentage: 30 },
            { category: "Work", percentage: 63 },
            { category: "Design", percentage: 12 },
            { category: "Personal", percentage: 45 },
          ],
          dailyStats: [
            { day: "MON", hours: 4.5 },
            { day: "TUE", hours: 3.2 },
            { day: "WED", hours: 6.0 },
            { day: "THU", hours: 2.0 },
            { day: "FRI", hours: 4.0 },
            { day: "SAT", hours: 5.2 },
            { day: "SUN", hours: 3.6 },
          ],
          taskStats: {
            completed: 15,
            pending: 8,
            overdue: 3,
            total: 26,
          },
          taskCompletionByDay: [
            { day: "MON", completed: 3, total: 4 },
            { day: "TUE", completed: 2, total: 3 },
            { day: "WED", completed: 4, total: 6 },
            { day: "THU", completed: 1, total: 3 },
            { day: "FRI", completed: 2, total: 5 },
            { day: "SAT", completed: 2, total: 3 },
            { day: "SUN", completed: 1, total: 2 },
          ],
          taskCompletionByCategory: [
            { category: "Personal", percentage: 75 },
            { category: "Work", percentage: 45 },
            { category: "Workout", percentage: 33 },
            { category: "Design", percentage: 60 },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Error fetching data: ${errorMessage}`);
      setLoading(false);
      console.error("Error fetching stats data:", err);
    }
  };

  // Fetch stats when period changes or date range changes
  useEffect(() => {
    fetchStatsData();
  }, [selectedPeriod, dateRange]);

  // Set initial active tab based on navigation params, if provided
  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    } else if (route.params?.title) {
      if (route.params.title.toLowerCase().includes("task")) {
        setActiveTab("tasks");
      } else if (route.params.title.toLowerCase().includes("combin")) {
        setActiveTab("combined");
      }
    }
  }, [route.params]);

  const renderCompletionRate = (
    item: CompletionRateExtended,
    index: number
  ) => {
    const gradientColor = index % 2 === 0 ? "#36D1DC" : "#9c6cda";

    return (
      <View key={`completion-item-${index}`} style={styles.completionItem}>
        <View style={styles.completionInfo}>
          <StyledText variant="body" style={styles.completionCategory}>
            {item.category}
          </StyledText>
          <StyledText variant="body" style={styles.completionPercentage}>
            {item.percentage}%
          </StyledText>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${item.percentage}%`, backgroundColor: gradientColor },
            ]}
          />
        </View>
      </View>
    );
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    if (period === "Custom") {
      setDatePickerVisible(true);
    } else {
      // Set default date ranges based on period
      let startDate = new Date();
      const endDate = new Date(); // Today

      switch (period) {
        case "Yesterday":
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case "Last Week":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "Last Month":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "This Year":
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      setDateRange({ startDate, endDate });
    }
  };

  const handleConfirmDates = () => {
    // Validate date range
    if (dateRange.endDate < dateRange.startDate) {
      Alert.alert("Invalid Date Range", "End date must be after start date", [
        { text: "OK" },
      ]);
      return;
    }

    setDatePickerVisible(false);
    // Data will be fetched by the useEffect
  };

  // Calculate max height for chart bars
  const getMaxBarHeight = () => {
    if (!statsData?.dailyStats) return 150;
    const maxHours = Math.max(
      ...statsData.dailyStats.map((item) => item.hours)
    );
    return maxHours > 0 ? maxHours : 1;
  };

  // Calculate height for individual chart bars
  const calculateBarHeight = (hours: number) => {
    const maxHours = getMaxBarHeight();
    const heightPercentage = (hours / maxHours) * 100;
    return Math.max(20, heightPercentage * 1.5); // Minimum height of 20
  };

  // Calculate max height for task completion chart bars
  const getMaxTaskCompletionHeight = () => {
    if (!statsData?.taskCompletionByDay) return 10;
    const maxTasks = Math.max(
      ...statsData.taskCompletionByDay.map((item) => item.total)
    );
    return maxTasks > 0 ? maxTasks : 1;
  };

  // Calculate height for individual task completion chart bars
  const calculateTaskBarHeight = (total: number) => {
    const maxTasks = getMaxTaskCompletionHeight();
    const heightPercentage = (total / maxTasks) * 100;
    return Math.max(20, heightPercentage * 1.5); // Minimum height of 20
  };

  // Calculate completion percentage for task bars
  const calculateTaskCompletionPercentage = (
    completed: number,
    total: number
  ) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  // Render the activity stats content
  const renderActivityStats = () => {
    if (!statsData) return null;

    return (
      <>
        <View style={styles.activityStatCardsContainer}>
          <View style={styles.activityStatCard}>
            <Icon
              name="time-outline"
              size={24}
              color="#36D1DC"
              style={styles.activityStatIcon}
            />
            <StyledText variant="body" style={styles.activityStatLabel}>
              Total Hours
            </StyledText>
            <StyledText variant="title" style={styles.activityStatValue}>
              {statsData.totalHours}
            </StyledText>
          </View>

          <View style={styles.activityStatCard}>
            <Icon
              name="cash-outline"
              size={24}
              color="#5B86E5"
              style={styles.activityStatIcon}
            />
            <StyledText variant="body" style={styles.activityStatLabel}>
              Billable
            </StyledText>
            <StyledText variant="title" style={styles.activityStatValue}>
              {statsData.billableHours}
            </StyledText>
          </View>

          <View style={styles.activityStatCard}>
            <Icon
              name="trending-up"
              size={24}
              color="#9c6cda"
              style={styles.activityStatIcon}
            />
            <StyledText variant="body" style={styles.activityStatLabel}>
              Efficiency
            </StyledText>
            <StyledText variant="title" style={styles.activityStatValue}>
              {statsData.billablePercentage}
            </StyledText>
          </View>

          <View style={styles.activityStatCard}>
            <Icon
              name="bar-chart-outline"
              size={24}
              color="#FF5722"
              style={styles.activityStatIcon}
            />
            <StyledText variant="body" style={styles.activityStatLabel}>
              Categories
            </StyledText>
            <StyledText variant="title" style={styles.activityStatValue}>
              {statsData.completionRates.length}
            </StyledText>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {statsData.dailyStats?.map((item, index) => (
            <View key={`chart-column-${index}`} style={styles.chartColumn}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: calculateBarHeight(item.hours),
                    backgroundColor: index % 2 === 0 ? "#9c6cda" : "#36D1DC",
                  },
                ]}
              />
              <StyledText variant="caption" style={styles.chartLabel}>
                {item.day}
              </StyledText>
            </View>
          ))}
        </View>

        <View style={styles.completionSection}>
          <StyledText variant="subtitle" style={styles.completionTitle}>
            Activity by Category
          </StyledText>
          {statsData.completionRates.map(renderCompletionRate)}
        </View>
      </>
    );
  };

  // Render the task stats content
  const renderTaskStats = () => {
    if (!statsData) return null;

    return (
      <>
        <View style={styles.taskStatCardsContainer}>
          <View style={styles.taskStatCard}>
            <Icon
              name="checkmark-circle"
              size={24}
              color="#36D1DC"
              style={styles.taskStatIcon}
            />
            <StyledText variant="body" style={styles.taskStatLabel}>
              Completed
            </StyledText>
            <StyledText variant="title" style={styles.taskStatValue}>
              {statsData.taskStats.completed}
            </StyledText>
          </View>

          <View style={styles.taskStatCard}>
            <Icon
              name="time"
              size={24}
              color="#ffab40"
              style={styles.taskStatIcon}
            />
            <StyledText variant="body" style={styles.taskStatLabel}>
              Pending
            </StyledText>
            <StyledText variant="title" style={styles.taskStatValue}>
              {statsData.taskStats.pending}
            </StyledText>
          </View>

          <View style={styles.taskStatCard}>
            <Icon
              name="alert-circle"
              size={24}
              color="#ff4757"
              style={styles.taskStatIcon}
            />
            <StyledText variant="body" style={styles.taskStatLabel}>
              Overdue
            </StyledText>
            <StyledText variant="title" style={styles.taskStatValue}>
              {statsData.taskStats.overdue}
            </StyledText>
          </View>

          <View style={styles.taskStatCard}>
            <Icon
              name="clipboard"
              size={24}
              color="#8e8e93"
              style={styles.taskStatIcon}
            />
            <StyledText variant="body" style={styles.taskStatLabel}>
              Total
            </StyledText>
            <StyledText variant="title" style={styles.taskStatValue}>
              {statsData.taskStats.total}
            </StyledText>
          </View>
        </View>

        <View style={styles.taskCompletionSection}>
          <StyledText variant="subtitle" style={styles.sectionTitle}>
            TASK COMPLETION (LAST 7 DAYS)
          </StyledText>

          <View style={styles.taskChartContainer}>
            {statsData.taskCompletionByDay?.map((item, index) => (
              <View
                key={`task-chart-column-${index}`}
                style={styles.chartColumn}
              >
                <View style={styles.taskBarContainer}>
                  <View
                    style={[
                      styles.taskTotalBar,
                      {
                        height: calculateTaskBarHeight(item.total),
                        backgroundColor: "#2c2c2e",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.taskCompletedBar,
                        {
                          height: `${calculateTaskCompletionPercentage(
                            item.completed,
                            item.total
                          )}%`,
                          backgroundColor:
                            index % 2 === 0 ? "#9c6cda" : "#36D1DC",
                        },
                      ]}
                    />
                  </View>
                </View>
                <StyledText variant="caption" style={styles.chartLabel}>
                  {item.day}
                </StyledText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.completionSection}>
          <StyledText variant="subtitle" style={styles.completionTitle}>
            Task Completion by Category
          </StyledText>
          {statsData.taskCompletionByCategory.map(renderCompletionRate)}
        </View>
      </>
    );
  };

  // Render combined stats
  const renderCombinedStats = () => {
    if (!statsData) return null;

    return (
      <>
        <View style={styles.combinedStatsOverview}>
          <View style={styles.combinedStatCard}>
            <Icon
              name="time-outline"
              size={24}
              color="#36D1DC"
              style={styles.combinedStatIcon}
            />
            <StyledText variant="body" style={styles.combinedStatLabel}>
              Activities
            </StyledText>
            <StyledText variant="subtitle" style={styles.combinedStatValue}>
              {statsData.totalHours}
            </StyledText>
          </View>

          <View style={styles.combinedStatCard}>
            <Icon
              name="checkbox-outline"
              size={24}
              color="#5B86E5"
              style={styles.combinedStatIcon}
            />
            <StyledText variant="body" style={styles.combinedStatLabel}>
              Tasks
            </StyledText>
            <StyledText variant="subtitle" style={styles.combinedStatValue}>
              {statsData.taskStats.completed}/{statsData.taskStats.total}
            </StyledText>
          </View>
        </View>

        <View style={styles.productivityScoreContainer}>
          <StyledText variant="subtitle" style={styles.sectionTitle}>
            PRODUCTIVITY SCORE
          </StyledText>

          <View style={styles.productivityScoreCircle}>
            <StyledText variant="title" style={styles.productivityScoreValue}>
              78%
            </StyledText>
          </View>

          <StyledText variant="body" style={styles.productivityScoreText}>
            Your productivity has increased by 12% compared to last week
          </StyledText>
        </View>

        <View style={styles.completionSection}>
          <StyledText variant="subtitle" style={styles.completionTitle}>
            Activities by Category
          </StyledText>
          {statsData.completionRates.map(renderCompletionRate)}
        </View>

        <View style={styles.completionSection}>
          <StyledText variant="subtitle" style={styles.completionTitle}>
            Tasks by Category
          </StyledText>
          {statsData.taskCompletionByCategory.map(renderCompletionRate)}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <StyledText variant="subtitle" style={styles.headerTitle}>
          Analytics
        </StyledText>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "activities" && styles.activeTab]}
          onPress={() => setActiveTab("activities")}
        >
          <StyledText
            style={[
              styles.tabText,
              activeTab === "activities" && styles.activeTabText,
            ]}
          >
            ACTIVITY
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "tasks" && styles.activeTab]}
          onPress={() => setActiveTab("tasks")}
        >
          <StyledText
            style={[
              styles.tabText,
              activeTab === "tasks" && styles.activeTabText,
            ]}
          >
            TASK
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "combined" && styles.activeTab]}
          onPress={() => setActiveTab("combined")}
        >
          <StyledText
            style={[
              styles.tabText,
              activeTab === "combined" && styles.activeTabText,
            ]}
          >
            COMBINED
          </StyledText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={{ paddingHorizontal: 5 }}
        >
          {TIME_PERIODS.map((period, index) => (
            <TouchableOpacity
              key={`period-${index}`}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriod,
              ]}
              onPress={() => handlePeriodSelect(period)}
            >
              <StyledText
                variant="body"
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.selectedPeriodText,
                ]}
              >
                {period}
              </StyledText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPeriod === "Custom" && (
          <View style={styles.customDateDisplay}>
            <StyledText variant="caption" style={styles.customDateText}>
              {format(dateRange.startDate, "MMM dd, yyyy")} -{" "}
              {format(dateRange.endDate, "MMM dd, yyyy")}
            </StyledText>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#36D1DC" />
            <StyledText variant="body" style={styles.loadingText}>
              Loading stats...
            </StyledText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={60} color="#ff4757" />
            <StyledText variant="body" style={styles.errorText}>
              {error}
            </StyledText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchStatsData}
            >
              <StyledText variant="body" style={styles.retryButtonText}>
                Retry
              </StyledText>
            </TouchableOpacity>
          </View>
        ) : statsData ? (
          activeTab === "activities" ? (
            renderActivityStats()
          ) : activeTab === "tasks" ? (
            renderTaskStats()
          ) : (
            renderCombinedStats()
          )
        ) : null}
      </ScrollView>

      {/* Custom Date Range Picker Modal */}
      <Modal
        visible={isDatePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.modalHeader}>
              <StyledText variant="title" style={styles.modalTitle}>
                Select Date Range
              </StyledText>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateSelectionContainer}>
              <View style={styles.dateInputContainer}>
                <StyledText variant="subtitle" style={styles.dateLabel}>
                  Start Date
                </StyledText>
                <DateSelector
                  date={dateRange.startDate}
                  onDateChange={(date) =>
                    setDateRange((prev) => ({ ...prev, startDate: date }))
                  }
                />
              </View>

              <View style={styles.dateInputContainer}>
                <StyledText variant="subtitle" style={styles.dateLabel}>
                  End Date
                </StyledText>
                <DateSelector
                  date={dateRange.endDate}
                  onDateChange={(date) =>
                    setDateRange((prev) => ({ ...prev, endDate: date }))
                  }
                  minDate={dateRange.startDate}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmDates}
            >
              <StyledText variant="body" style={styles.confirmButtonText}>
                Confirm
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Custom DateSelector component for selecting start and end dates
const DateSelector = ({
  date,
  onDateChange,
  minDate,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Format the date for display
  const formattedDate = format(date, "MMM dd, yyyy");

  return (
    <View style={styles.dateSelectContainer}>
      <TouchableOpacity
        style={styles.dateSelectButton}
        onPress={() => setShowPicker(true)}
      >
        <StyledText variant="body" style={styles.dateText}>
          {formattedDate}
        </StyledText>
        <Icon name="calendar-outline" size={20} color="#fff" />
      </TouchableOpacity>

      {Platform.OS === "ios" ? (
        <Modal visible={showPicker} transparent={true} animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <StyledText variant="body" style={styles.pickerCancel}>
                    Cancel
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(false);
                  }}
                >
                  <StyledText variant="body" style={styles.pickerDone}>
                    Done
                  </StyledText>
                </TouchableOpacity>
              </View>
              {/* Use a date picker appropriate for iOS */}
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    onDateChange(selectedDate);
                  }
                }}
                minimumDate={minDate}
              />
            </View>
          </View>
        </Modal>
      ) : (
        // For Android, show the date picker directly when showPicker is true
        showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) {
                onDateChange(selectedDate);
              }
            }}
            minimumDate={minDate}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    marginRight: 10,
  },
  selectedPeriod: {
    backgroundColor: "#00E5FF",
  },
  periodText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedPeriodText: {
    color: "#000",
    fontWeight: "bold",
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: "#8e8e93",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },
  billableSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 0.0,
  },
  billableInfo: {
    flex: 1,
  },
  billableTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  billableHours: {
    fontSize: 24,
    color: "#8e8e93",
  },
  billablePercentage: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  percentageValue: {
    fontSize: 24,
    color: "#8e8e93",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    height: 200,
    marginBottom: 30,
  },
  chartColumn: {
    alignItems: "center",
    width: 30,
  },
  chartBar: {
    width: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  chartLabel: {
    color: "#8e8e93",
    fontSize: 12,
  },
  completionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  completionItem: {
    marginBottom: 20,
  },
  completionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  completionCategory: {
    color: "#8e8e93",
    fontSize: 16,
  },
  completionPercentage: {
    color: "#8e8e93",
    fontSize: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#2c2c2e",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  customDateDisplay: {
    paddingHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
  },
  customDateText: {
    color: "#36D1DC",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    width: Dimensions.get("window").width * 0.9,
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  dateSelectionContainer: {
    marginBottom: 20,
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    color: "#8e8e93",
    fontSize: 16,
    marginBottom: 10,
  },
  dateSelector: {
    backgroundColor: "#2c2c2e",
    borderRadius: 8,
    padding: 10,
  },
  datePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerColumn: {
    alignItems: "center",
    width: "30%",
  },
  dateArrow: {
    padding: 8,
  },
  dateValue: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 8,
  },
  confirmButton: {
    backgroundColor: "#36D1DC",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  loadingText: {
    color: "#8e8e93",
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  errorText: {
    color: "#ff4757",
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#36D1DC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateSelectContainer: {
    marginBottom: 10,
  },
  dateSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
  },
  dateText: {
    color: "#fff",
    fontSize: 14,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  pickerCancel: {
    color: "#ff3b30",
    fontSize: 16,
  },
  pickerDone: {
    color: "#34c759",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerDateSelector: {
    marginVertical: 10,
  },
  pickerDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerDateColumn: {
    alignItems: "center",
    width: 90,
  },
  pickerDateArrow: {
    padding: 8,
  },
  pickerDateValue: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 5,
  },
  // Task stat styles
  taskStatCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  taskStatCard: {
    width: "48%",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  taskStatIcon: {
    marginBottom: 8,
  },
  taskStatLabel: {
    color: "#8e8e93",
    fontSize: 14,
    marginBottom: 5,
  },
  taskStatValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  taskCompletionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  taskChartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 200,
    marginBottom: 10,
    marginTop: 20,
  },
  taskBarContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 160,
  },
  taskTotalBar: {
    width: 18,
    borderRadius: 9,
    marginBottom: 10,
    overflow: "hidden",
  },
  taskCompletedBar: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  // Combined stats styles
  combinedStatsOverview: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  combinedStatCard: {
    width: "48%",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  combinedStatIcon: {
    marginBottom: 8,
  },
  combinedStatLabel: {
    color: "#8e8e93",
    fontSize: 14,
    marginBottom: 5,
  },
  combinedStatValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  productivityScoreContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
  },
  productivityScoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#252525",
    borderWidth: 8,
    borderColor: "#36D1DC",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  productivityScoreValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  productivityScoreText: {
    color: "#8e8e93",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  activityStatCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  activityStatCard: {
    width: "48%",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  activityStatIcon: {
    marginBottom: 8,
  },
  activityStatLabel: {
    color: "#8e8e93",
    fontSize: 14,
    marginBottom: 5,
  },
  activityStatValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default StatsScreen;
