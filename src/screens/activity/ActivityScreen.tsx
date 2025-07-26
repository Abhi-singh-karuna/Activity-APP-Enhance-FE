import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Vibration,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { Activity, Category } from "../../types";
import AddActivityModal from "../../components/AddActivityModal";
import StyledText from "../../components/StyledText";
import { useAppContext } from "../../context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extended activity type with timer-related properties
interface ActivityWithTimer extends Activity {
  isRunning?: boolean;
  currentTimer?: string;
  elapsedSeconds?: number;
  isFuture?: boolean;
  remainingSeconds?: number;
  isCompleted?: boolean;
}

// Helper functions (keep existing ones)
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const formatTimeHHMMSS = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(2, "0")}`;
};

// Mock API response (keep existing)
const MOCK_ACTIVITIES_RESPONSE = {
  success: true,
  activities: [
    {
      id: "1",
      title: "Gym",
      category: "Personal" as Category,
      startDate: "2022/02/03",
      endDate: "2022/02/05",
      duration: "01:30:00",
      color: "#00E5FF",
      elapsedSeconds: 0,
      priority: 1,
    },
    {
      id: "2",
      title: "Copywriting",
      category: "Personal" as Category,
      startDate: "2022/02/05",
      endDate: "2022/04/09",
      duration: "00:00:10",
      color: "#9C6CDA",
      elapsedSeconds: 10,
      priority: 2,
    },
    {
      id: "3",
      title: "Design",
      category: "Workout" as Category,
      startDate: "2022/02/10",
      endDate: "2022/04/13",
      duration: "05:30:00",
      color: "#4ECDC4",
      elapsedSeconds: 0,
      priority: 3,
    },
    {
      id: "4",
      title: "Product Launch",
      category: "Work" as Category,
      startDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      duration: "00:00:00",
      color: "#FF6B6B",
      elapsedSeconds: 0,
      isFuture: true,
      priority: 4,
    },
  ],
};

const ActivityScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState("ACTIVITY");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityWithTimer | null>(null);
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [apiResponses, setApiResponses] = useState<any[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activityToDelete, setActivityToDelete] =
    useState<ActivityWithTimer | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const [deleteReady, setDeleteReady] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(0)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.3)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerGlowAnim = useRef(new Animated.Value(0)).current;

  const deleteMode = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { fontSizeMultiplier, logout } = useAppContext();

  // Initialize activities
  const [activities, setActivities] = useState<ActivityWithTimer[]>(
    MOCK_ACTIVITIES_RESPONSE.activities.map(
      (activity) =>
        ({
          ...activity,
          isRunning: false,
          currentTimer: activity.duration,
          remainingSeconds: timeToSeconds(activity.duration),
          elapsedSeconds: 0,
          isCompleted: false,
        } as ActivityWithTimer)
    )
  );

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(timerGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Simulate fetching activities
  useEffect(() => {
    const requestObject = {
      method: "GET",
      endpoint: "/api/activities",
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    };

    setApiRequests((prev) => [...prev, requestObject]);
    setApiResponses((prev) => [...prev, MOCK_ACTIVITIES_RESPONSE]);
  }, []);

  // Pulse animation for running activities
  useEffect(() => {
    const createPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (activities && activities.some((a) => a.isRunning)) {
          createPulseAnimation();
        } else {
          pulseAnim.setValue(1);
        }
      });
    };

    if (activities && activities.some((a) => a.isRunning)) {
      createPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.setValue(1);
    };
  }, [activities]);

  // Enhanced gradient colors
  const getGradientColors = (activity: ActivityWithTimer): [string, string] => {
    if (activity.isCompleted) {
      return ["#4ECDC4", "#44A08D"];
    }

    const isFuture = isActivityInFuture(activity);
    if (isFuture) {
      return ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"];
    }

    if (!activity.isRunning) {
      return ["#1A1A1A", "#2A2A2A"];
    }

    // Enhanced running gradients
    switch (activity.title) {
      case "Gym":
        return ["#00E5FF", "#4ECDC4"];
      case "Copywriting":
        return ["#9C6CDA", "#7B4397"];
      case "Design":
        return ["#4ECDC4", "#44A08D"];
      default:
        return ["#00E5FF", "#9C6CDA"];
    }
  };

  const isActivityInFuture = (activity: ActivityWithTimer): boolean => {
    if (activity.isFuture === true) return true;
    const today = new Date();
    const startDate = new Date(activity.startDate.replace(/\//g, "-"));
    return startDate > today;
  };

  // Keep all existing timer and interaction functions...
  const toggleTimer = (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return;

    const isCurrentlyRunning = activity.isRunning || false;
    const newIsRunning = !isCurrentlyRunning;

    const requestObject = {
      method: "PUT",
      endpoint: `/api/activities/${id}/timer`,
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "Content-Type": "application/json",
      },
      body: {
        isRunning: newIsRunning,
        remainingSeconds: activity.remainingSeconds || 0,
      },
    };

    const responseObject = {
      success: true,
      activity: {
        id,
        isRunning: newIsRunning,
        remainingSeconds: activity.remainingSeconds || 0,
        currentTimer: formatTimeHHMMSS(activity.remainingSeconds || 0),
      },
    };

    setApiRequests((prev) => [...prev, requestObject]);
    setApiResponses((prev) => [...prev, responseObject]);

    setActivities((prevActivities) =>
      prevActivities.map((a) => {
        if (a.id === id) {
          return { ...a, isRunning: newIsRunning };
        }
        return a;
      })
    );
  };

  // Update timers for running activities
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setActivities((prevActivities) =>
        prevActivities.map((activity) => {
          if (activity.isRunning) {
            const remainingSeconds = Math.max(
              0,
              (activity.remainingSeconds || 0) - 1
            );
            const isCompleted = remainingSeconds === 0;

            if (isCompleted && activity.isRunning) {
              if (Platform.OS === "ios" || Platform.OS === "android") {
                Vibration.vibrate([500, 500, 500]);
              }
            }

            return {
              ...activity,
              remainingSeconds,
              currentTimer: formatTimeHHMMSS(remainingSeconds),
              isRunning: isCompleted ? false : activity.isRunning,
              isCompleted: isCompleted || activity.isCompleted,
            };
          }
          return activity;
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Keep all existing interaction handlers...
  const resetDeleteMode = () => {
    deleteMode.current = false;
    setLongPressedId(null);
    setDeleteReady(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(deleteScaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOutsideTouch = () => {
    if (deleteMode.current && longPressedId) {
      resetDeleteMode();
    }
  };

  const handleLongPress = (activity: ActivityWithTimer) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Vibration.vibrate(100);
    }

    deleteMode.current = true;
    setDeleteReady(true);
    setLongPressedId(activity.id);

    Animated.parallel([
      Animated.spring(deleteScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = (id: string) => {
    if (!deleteMode.current) {
      setLongPressedId(id);
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 150,
        useNativeDriver: true,
      }).start();

      longPressTimer.current = setTimeout(() => {}, 100);
    }
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!deleteMode.current) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setLongPressedId(null);
      });
    }
  };

  const showDeleteConfirmation = (activity: ActivityWithTimer) => {
    setActivityToDelete(activity);
    setDeleteModalVisible(true);

    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDeleteModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDeleteModalVisible(false);
      setActivityToDelete(null);
    });
  };

  const handleDeleteActivity = () => {
    if (!activityToDelete) return;

    const requestObject = {
      method: "DELETE",
      endpoint: `/api/activities/${activityToDelete.id}`,
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    };

    const responseObject = {
      success: true,
      message: "Activity deleted successfully",
    };

    setApiRequests((prev) => [...prev, requestObject]);
    setApiResponses((prev) => [...prev, responseObject]);

    setActivities((prevActivities) =>
      prevActivities.filter((activity) => activity.id !== activityToDelete.id)
    );

    closeDeleteModal();
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
            navigation.navigate("Login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAddActivity = (newActivity: Partial<Activity>) => {
    const duration = newActivity.duration || "00:00:00";
    const remainingSeconds = timeToSeconds(duration);

    const activity = {
      ...newActivity,
      id: Date.now().toString(),
      isRunning: false,
      currentTimer: duration,
      remainingSeconds: remainingSeconds,
      elapsedSeconds: 0,
      isCompleted: false,
      duration: duration,
      priority: newActivity.priority || Math.floor(Math.random() * 100) + 1,
    } as ActivityWithTimer;

    const requestObject = {
      method: "POST",
      endpoint: "/api/activities",
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "Content-Type": "application/json",
      },
      body: newActivity,
    };

    const responseObject = {
      success: true,
      activity,
    };

    setApiRequests((prev) => [...prev, requestObject]);
    setApiResponses((prev) => [...prev, responseObject]);

    setActivities([...activities, activity]);
    setModalVisible(false);
  };

  const renderActivityItem = ({
    item,
    index,
  }: {
    item: ActivityWithTimer;
    index: number;
  }) => {
    const isFuture = isActivityInFuture(item);
    const isLongPressed = longPressedId === item.id;
    const showDeleteUI = isLongPressed && deleteReady;
    const isCompleted = item.isCompleted;

    return (
      <Animated.View
        style={[
          styles.activityItemContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50],
                }),
              },
              { scale: isLongPressed ? scaleAnim : 1 },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.activityItem,
            isFuture && styles.futureActivityItem,
            isCompleted && styles.completedActivityItem,
          ]}
          onPress={() => {
            if (deleteMode.current && isLongPressed) {
              resetDeleteMode();
              return;
            }

            navigation.navigate("ActivityDetail", {
              title: item.title,
              category: item.category,
              isPersonal: item.category === "Personal",
            });

            const requestObject = {
              method: "GET",
              endpoint: `/api/activities/${item.id}`,
              headers: {
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
            };

            const responseObject = {
              success: true,
              activity: {
                ...item,
                sessions: [
                  { date: item.startDate, duration: "00:45" },
                  {
                    date: formatDate(new Date()),
                    duration: item.currentTimer || "00:00",
                  },
                ],
              },
            };

            setApiRequests((prev) => [...prev, requestObject]);
            setApiResponses((prev) => [...prev, responseObject]);
          }}
          onLongPress={() => handleLongPress(item)}
          onPressIn={() => handlePressIn(item.id)}
          onPressOut={handlePressOut}
          delayLongPress={300}
          activeOpacity={0.85}
        >
          {showDeleteUI ? (
            <LinearGradient
              colors={["#FF6B6B", "#FF8E53"]}
              style={styles.deleteCardContent}
            >
              <Animated.View
                style={[
                  styles.deleteIconContainer,
                  {
                    transform: [{ scale: deleteScaleAnim }],
                    opacity: deleteOpacityAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.deleteIconButton}
                  onPress={() => showDeleteConfirmation(item)}
                >
                  <Icon name="trash-outline" size={scale(36)} color="#fff" />
                  <Text style={styles.deleteCardText}>Delete activity</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={resetDeleteMode}
              >
                <Icon name="close" size={scale(20)} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={getGradientColors(item)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activityContent}
            >
              {/* Activity glow effect for running items */}
              {item.isRunning && (
                <Animated.View
                  style={[
                    styles.activityGlow,
                    {
                      opacity: timerGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.6],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "rgba(0, 229, 255, 0.2)",
                      "rgba(156, 108, 218, 0.2)",
                    ]}
                    style={styles.glowGradient}
                  />
                </Animated.View>
              )}

              <View style={styles.cardLeft}>
                <Text
                  style={[
                    styles.activityTitle,
                    isFuture && styles.futureActivityText,
                    isCompleted && styles.completedActivityText,
                  ]}
                >
                  {item.title}
                  {isFuture && " (Future)"}
                </Text>

                {isCompleted ? (
                  <View style={styles.completedMessageContainer}>
                    <Icon
                      name="checkmark-circle"
                      size={scale(20)}
                      color="#fff"
                    />
                    <Text style={styles.completedMessageText}>
                      Congratulations! Task completed for today.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.datesContainer}>
                    <View style={styles.dateContainer}>
                      <Icon
                        name="calendar-outline"
                        size={scale(14)}
                        color={isFuture ? "#aaa" : "#fff"}
                      />
                      <Text
                        style={[
                          styles.dateText,
                          isFuture && styles.futureActivityText,
                        ]}
                      >
                        {item.startDate}
                      </Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Icon
                        name="calendar-outline"
                        size={scale(14)}
                        color={isFuture ? "#aaa" : "#fff"}
                      />
                      <Text
                        style={[
                          styles.dateText,
                          isFuture && styles.futureActivityText,
                        ]}
                      >
                        {item.endDate}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.cardRight}>
                <View style={styles.categoryContainer}>
                  <LinearGradient
                    colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]}
                    style={styles.categoryGradient}
                  >
                    <Icon
                      name={
                        item.category === "Personal"
                          ? "person-outline"
                          : item.category === "Work"
                          ? "briefcase-outline"
                          : "fitness-outline"
                      }
                      size={scale(12)}
                      color={isFuture ? "#aaa" : "#fff"}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isFuture && styles.futureActivityText,
                      ]}
                    >
                      {item.category}
                    </Text>
                  </LinearGradient>
                </View>

                {!isFuture && !isCompleted && (
                  <View style={styles.timerControlContainer}>
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        item.isRunning && styles.playButtonActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleTimer(item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          item.isRunning
                            ? [
                                "rgba(255, 255, 255, 0.2)",
                                "rgba(255, 255, 255, 0.1)",
                              ]
                            : ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]
                        }
                        style={styles.playButtonGradient}
                      >
                        <Animated.View
                          style={{
                            transform: [
                              { scale: item.isRunning ? pulseAnim : 1 },
                            ],
                          }}
                        >
                          <Icon
                            name={item.isRunning ? "pause" : "play"}
                            size={scale(18)}
                            color="#fff"
                          />
                        </Animated.View>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.remainingTimeContainer}>
                      <LinearGradient
                        colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)"]}
                        style={styles.timeGradient}
                      >
                        <Text style={styles.remainingTimeValue}>
                          {item.currentTimer}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                )}

                {isCompleted && (
                  <View style={styles.completedIcon}>
                    <LinearGradient
                      colors={["#4ECDC4", "#44A08D"]}
                      style={styles.completedIconGradient}
                    >
                      <Icon
                        name="checkmark-circle"
                        size={scale(30)}
                        color="#fff"
                      />
                    </LinearGradient>
                  </View>
                )}
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsideTouch}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Background with animated elements */}
        <View style={styles.background}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={`bg-element-${index}`}
              style={[
                styles.backgroundElement,
                {
                  left: `${15 + index * 15}%`,
                  top: `${10 + (index % 3) * 20}%`,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.1],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={["#00E5FF", "#9C6CDA"]}
                style={styles.backgroundElementGradient}
              />
            </Animated.View>
          ))}
        </View>

        {/* Enhanced Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Icon name="settings-outline" size={scale(24)} color="#00E5FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Activities</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                navigation.navigate("Stats", { activeTab: "activities" })
              }
            >
              <Icon name="bar-chart-outline" size={scale(24)} color="#9C6CDA" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <Icon name="log-out-outline" size={scale(24)} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Tab Container */}
        <Animated.View
          style={[
            styles.tabCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#0A0A0A", "#1A1A1A"]}
            style={styles.tabContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === "ACTIVITY" && styles.activeTab]}
              onPress={() => setActiveTab("ACTIVITY")}
            >
              {activeTab === "ACTIVITY" && (
                <LinearGradient
                  colors={["#00E5FF", "#9C6CDA"]}
                  style={styles.activeTabGradient}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ACTIVITY" && styles.activeTabText,
                ]}
              >
                Activity
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "TASK" && styles.activeTab]}
              onPress={() => {
                setActiveTab("TASK");
                navigation.navigate("Task");
              }}
            >
              {activeTab === "TASK" && (
                <LinearGradient
                  colors={["#00E5FF", "#9C6CDA"]}
                  style={styles.activeTabGradient}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === "TASK" && styles.activeTabText,
                ]}
              >
                Task
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced Add Button */}
        <Animated.View
          style={[
            styles.addButtonCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={["#00E5FF", "#9C6CDA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Icon name="add" size={scale(24)} color="#fff" />
              <Text style={styles.addButtonText}>Add new activity</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Activities List */}
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.activityList}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Activity Modal */}
        <AddActivityModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddActivity}
        />

        {/* Enhanced Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.deleteModalContainer,
                {
                  transform: [{ scale: modalScaleAnim }],
                  opacity: modalOpacityAnim,
                },
              ]}
            >
              <LinearGradient
                colors={["#0A0A0A", "#1A1A1A"]}
                style={styles.deleteModalGradient}
              >
                <Text style={styles.deleteModalTitle}>Delete Activity</Text>
                {activityToDelete && (
                  <Text style={styles.deleteModalText}>
                    Are you sure you want to delete "{activityToDelete.title}"?
                  </Text>
                )}
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={styles.deleteModalButton}
                    onPress={closeDeleteModal}
                  >
                    <LinearGradient
                      colors={["#333", "#444"]}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.deleteModalButtonText}>Cancel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteModalButton}
                    onPress={handleDeleteActivity}
                  >
                    <LinearGradient
                      colors={["#FF6B6B", "#FF8E53"]}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.deleteModalConfirmButtonText}>
                        Delete
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElement: {
    position: "absolute",
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    overflow: "hidden",
  },
  backgroundElementGradient: {
    flex: 1,
    borderRadius: scale(4),
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === "ios" ? scale(50) : scale(30),
    paddingBottom: scale(20),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(15),
  },
  headerButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: scale(28),
    marginLeft: scale(15),
    letterSpacing: 1,
  },

  // Tab styles
  tabCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(20),
    borderRadius: scale(25),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: scale(50),
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: scale(25),
    overflow: "hidden",
  },
  activeTab: {
    // Active tab styling handled by gradient
  },
  activeTabGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scale(25),
  },
  tabText: {
    color: "#9C9C9C",
    fontWeight: "600",
    fontSize: scale(16),
    zIndex: 1,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Add button styles
  addButtonCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(20),
    borderRadius: scale(15),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButton: {
    borderRadius: scale(15),
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
  addButtonText: {
    color: "#FFFFFF",
    marginLeft: scale(12),
    fontSize: scale(16),
    fontWeight: "700",
  },

  // Activity list styles
  activityList: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },
  activityItemContainer: {
    marginBottom: scale(15),
  },
  activityItem: {
    borderRadius: scale(20),
    overflow: "hidden",
    height: scale(120),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  futureActivityItem: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
  },
  completedActivityItem: {
    borderWidth: 1,
    borderColor: "#4ECDC4",
  },
  activityContent: {
    flexDirection: "row",
    padding: scale(20),
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  activityGlow: {
    position: "absolute",
    top: -scale(10),
    left: -scale(10),
    right: -scale(10),
    bottom: -scale(10),
    borderRadius: scale(30),
  },
  glowGradient: {
    flex: 1,
    borderRadius: scale(30),
  },

  // Card content styles
  cardLeft: {
    flex: 2,
    justifyContent: "center",
    paddingRight: scale(15),
    zIndex: 1,
  },
  cardRight: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
  },
  activityTitle: {
    fontWeight: "800",
    color: "#FFFFFF",
    fontSize: scale(18),
    marginBottom: scale(8),
    letterSpacing: 0.5,
  },
  futureActivityText: {
    color: "#AAAAAA",
    opacity: 0.8,
  },
  completedActivityText: {
    color: "#FFFFFF",
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(15),
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#FFFFFF",
    marginLeft: scale(6),
    fontSize: scale(12),
    fontWeight: "500",
  },

  // Category and timer styles
  categoryContainer: {
    marginRight: scale(15),
    borderRadius: scale(20),
    overflow: "hidden",
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
  },
  categoryText: {
    color: "#FFFFFF",
    marginLeft: scale(6),
    fontWeight: "600",
    fontSize: scale(12),
  },
  timerControlContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: scale(100),
  },
  playButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginBottom: scale(8),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  playButtonActive: {
    elevation: 5,
    shadowColor: "#00E5FF",
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  remainingTimeContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
    minWidth: scale(80),
  },
  timeGradient: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  remainingTimeValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: scale(14),
    textAlign: "center",
  },

  // Completed activity styles
  completedMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedMessageText: {
    color: "#FFFFFF",
    marginLeft: scale(8),
    fontWeight: "600",
    fontSize: scale(14),
  },
  completedIcon: {
    borderRadius: scale(25),
    overflow: "hidden",
  },
  completedIconGradient: {
    width: scale(50),
    height: scale(50),
    justifyContent: "center",
    alignItems: "center",
  },

  // Delete mode styles
  deleteCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(20),
    position: "relative",
  },
  deleteIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: scale(120),
    height: scale(80),
  },
  deleteCardText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: scale(8),
    fontSize: scale(14),
  },
  cancelDeleteButton: {
    position: "absolute",
    top: scale(15),
    right: scale(15),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  deleteModalContainer: {
    width: "90%",
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  deleteModalGradient: {
    padding: scale(30),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  deleteModalTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: scale(15),
    letterSpacing: 1,
  },
  deleteModalText: {
    fontSize: scale(16),
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: scale(30),
    lineHeight: scale(22),
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: scale(15),
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalButtonGradient: {
    paddingVertical: scale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: scale(16),
  },
  deleteModalConfirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: scale(16),
  },
});

export default ActivityScreen;
