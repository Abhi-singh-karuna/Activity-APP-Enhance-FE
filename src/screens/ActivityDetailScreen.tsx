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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../navigation";
import StyledText from "../components/StyledText";
import Svg, { Path } from "react-native-svg";

// Get device dimensions for responsive design
const { width, height } = Dimensions.get("window");

// Type definitions
type ActivityDetailRouteProp = RouteProp<RootStackParamList, "ActivityDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Interruption = {
  StartTime: string;
  CoverdTime: string;
  id?: string;
  timeInMillis?: number;
};

type ActivityData = {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  activityDuration: string;
  color: string;
  interuption: Interruption[];
  remainingActivityTime: string;
};

type TimerStatus = "running" | "paused" | "completed" | "interrupted";

/**
 * Custom hook for creating SVG arcs for the timer visualization
 * Generates SVG path data for arc segments based on angles and dimensions
 */
const useArcPath = () => {
  const getArcPath = (
    startAngle: number,
    endAngle: number,
    radius: number,
    thickness: number
  ) => {
    // Convert angles from degrees to radians
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    // Calculate coordinates
    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);

    // Inner radius
    const innerRadius = radius - thickness;
    const x3 = radius + innerRadius * Math.cos(endRad);
    const y3 = radius + innerRadius * Math.sin(endRad);
    const x4 = radius + innerRadius * Math.cos(startRad);
    const y4 = radius + innerRadius * Math.sin(startRad);

    // Determine if we need to draw more than 180 degrees
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Build the path
    return [
      `M ${x1} ${y1}`, // Move to start point
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Outer arc
      `L ${x3} ${y3}`, // Line to inner arc start
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Inner arc
      "Z", // Close path
    ].join(" ");
  };

  return getArcPath;
};

/**
 * ActivityDetailScreen - Displays detailed information about an activity with timer functionality
 * Features include:
 * - Circular timer visualization with SVG arcs
 * - Timer controls (start, pause, interrupt)
 * - Interruption tracking
 * - Tag management
 */
const ActivityDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ActivityDetailRouteProp>();
  const { title, category, isPersonal } = route.params;

  // Mock activity data - in real app this would come from props or API
  const [activityData, setActivityData] = useState<ActivityData>({
    id: "1",
    title: title || "Gym",
    category: category || "Personal",
    startDate: "2022/02/03",
    endDate: "2022/02/05",
    activityDuration: "01:30:00",
    color: "#00E5FF",
    interuption: [
      {
        StartTime: "10:10:00",
        CoverdTime: "00:20:00",
      },
      {
        StartTime: "13:30:00",
        CoverdTime: "00:30:00",
      },
    ],
    remainingActivityTime: "00:40:00",
  });

  // Timer state management
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("paused");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [activityTotalDuration, setActivityTotalDuration] = useState(0);
  const [currentInterruption, setCurrentInterruption] =
    useState<Interruption | null>(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Reference to store timer interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Tags management
  const [tags, setTags] = useState<
    { id: string; name: string; icon: string }[]
  >([
    { id: "1", name: "Research", icon: "search-outline" },
    { id: "2", name: "UI", icon: "apps-outline" },
    { id: "3", name: "UX", icon: "color-palette-outline" },
  ]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("pricetag-outline");

  // Animation value for timer pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Use our custom hook for SVG arcs
  const getArcPath = useArcPath();

  // Timer dimensions
  const timerSize = Math.min(width * 0.75, 300);
  const timerRadius = timerSize / 2;
  const timerThickness = 16;
  const timerInnerOffset = 4; // Space between border and colored segments

  // Initialize timer values from activity data
  useEffect(() => {
    const activityDurationMillis = timeStringToMillis(
      activityData.activityDuration
    );
    const remainingTimeMillis = timeStringToMillis(
      activityData.remainingActivityTime
    );

    setActivityTotalDuration(activityDurationMillis);
    setRemainingTime(remainingTimeMillis);

    // Process interruptions to add millisecond values and ensure unique IDs
    const processedInterruptions = activityData.interuption.map(
      (interruption, index) => ({
        ...interruption,
        id: interruption.id || `interruption-${index}-${Date.now()}`,
        timeInMillis: timeStringToMillis(interruption.CoverdTime),
      })
    );

    setActivityData({
      ...activityData,
      interuption: processedInterruptions,
    });
  }, []);

  /**
   * Calculate segment angles for the timer visualization
   * @returns Object containing start and end angles for interruption and remaining time
   */
  const calculateArcAngles = () => {
    // Calculate the percentages
    const interruptionPercentage = calculateInterruptionPercentage();
    const remainingPercentage = calculateRemainingPercentage();

    // Convert percentages to angles (360 degrees total)
    const interruptionAngle = (interruptionPercentage / 100) * 360;
    const remainingAngle = (remainingPercentage / 100) * 360;

    return {
      interruptionStart: 0,
      interruptionEnd: interruptionAngle,
      remainingStart: interruptionAngle,
      remainingEnd: interruptionAngle + remainingAngle,
    };
  };

  /**
   * Convert time string "HH:MM:SS" to milliseconds
   */
  const timeStringToMillis = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
  };

  /**
   * Format time for display (convert milliseconds to MM:SS)
   */
  const formatDisplayTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * Format time for display (convert milliseconds to HH:MM:SS or MM:SS)
   */
  const formatFullTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * Calculate the total duration of all interruptions
   */
  const getInterruptionsTotalDuration = () => {
    return activityData.interuption.reduce((total, interruption) => {
      const duration = interruption.timeInMillis || 0;
      return total + duration;
    }, 0);
  };

  /**
   * Calculate the progress percentage (0-100)
   */
  const calculateProgress = () => {
    if (activityTotalDuration === 0) return 0;
    const completed = activityTotalDuration - remainingTime;
    return Math.min(100, (completed / activityTotalDuration) * 100);
  };

  /**
   * Calculate the interruption percentage (0-100)
   */
  const calculateInterruptionPercentage = () => {
    if (activityTotalDuration === 0) return 0;
    return Math.min(
      100,
      (getInterruptionsTotalDuration() / activityTotalDuration) * 100
    );
  };

  /**
   * Calculate the remaining percentage (0-100)
   */
  const calculateRemainingPercentage = () => {
    if (activityTotalDuration === 0) return 0;
    return Math.min(100, (remainingTime / activityTotalDuration) * 100);
  };

  /**
   * Calculate the completed percentage (0-100)
   */
  const calculateCompletedPercentage = () => {
    if (activityTotalDuration === 0) return 0;
    const interruptionPercentage = calculateInterruptionPercentage();
    const remainingPercentage = calculateRemainingPercentage();
    return Math.max(0, 100 - interruptionPercentage - remainingPercentage);
  };

  // Helper function to get the correct timer color
  const getTimerColor = () => {
    if (timerStatus === "completed") {
      return "#4CAF50"; // Green for completed
    } else if (timerStatus === "interrupted") {
      return "#F44336"; // Red for interruptions
    } else {
      return activityData.color; // Default color from activity data
    }
  };

  /**
   * Start the timer
   * Begins countdown from remaining time
   */
  const startTimer = () => {
    if (timerStatus !== "running" && remainingTime > 0) {
      const now = Date.now();
      startTimeRef.current = now;

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          setElapsedTime(elapsed);

          const newRemainingTime = Math.max(0, remainingTime - elapsed);
          setRemainingTime(newRemainingTime);

          // Check if timer is completed
          if (newRemainingTime <= 0) {
            completeTimer();
          }
        }
      }, 1000);

      setTimerStatus("running");
    }
  };

  /**
   * Pause the timer
   * Stops countdown and updates remaining time
   */
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      setRemainingTime((prev) => Math.max(0, prev - elapsed));
      startTimeRef.current = null;
    }

    setTimerStatus("paused");
    setElapsedTime(0);
  };

  /**
   * Toggle timer between start/pause/resume
   */
  const toggleTimer = () => {
    if (timerStatus === "running") {
      pauseTimer();
    } else if (timerStatus === "interrupted") {
      endInterruption();
    } else if (remainingTime > 0) {
      startTimer();
    }
  };

  /**
   * Complete the timer
   * Shows completion message and alerts user
   */
  const completeTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimerStatus("completed");
    setRemainingTime(0);
    setShowCompletionMessage(true);

    // In a real app, you would save completion status to database
    Alert.alert(
      "Activity Completed!",
      "Congratulations on completing your activity for today!"
    );
  };

  /**
   * Start an interruption
   * Pauses timer and creates new interruption record
   */
  const startInterruption = () => {
    if (timerStatus === "running") {
      pauseTimer();

      const newInterruption: Interruption = {
        StartTime: new Date().toLocaleTimeString(),
        CoverdTime: "00:00:00",
        id: Date.now().toString(),
        timeInMillis: 0,
      };

      setCurrentInterruption(newInterruption);
      setTimerStatus("interrupted");
    }
  };

  /**
   * End an interruption
   * Records duration and adds to interruption list
   */
  const endInterruption = () => {
    if (currentInterruption && timerStatus === "interrupted") {
      const interruptionDuration =
        Date.now() - (startTimeRef.current || Date.now());
      const coveredTimeMillis = Math.max(1000, interruptionDuration); // Minimum 1 second

      const updatedInterruption: Interruption = {
        ...currentInterruption,
        CoverdTime: formatFullTime(coveredTimeMillis),
        timeInMillis: coveredTimeMillis,
      };

      // Add to interruptions list
      const updatedInterruptions = [
        ...activityData.interuption,
        updatedInterruption,
      ];

      setActivityData({
        ...activityData,
        interuption: updatedInterruptions,
      });

      setCurrentInterruption(null);
      setTimerStatus("paused");

      // Reset timer start for next session
      startTimeRef.current = null;
    }
  };

  // Delete activity confirmation
  const confirmDelete = () => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Delete logic would go here
            navigation.goBack();
          },
        },
      ]
    );
  };

  /**
   * Tag management - Add a new tag
   */
  const addTag = () => {
    if (newTagName.trim()) {
      const newTag = {
        id: Date.now().toString(),
        name: newTagName.trim(),
        icon: selectedIcon,
      };

      setTags([...tags, newTag]);
      setNewTagName("");
      setSelectedIcon("pricetag-outline");
      setShowTagModal(false);
    }
  };

  /**
   * Tag management - Remove a tag
   */
  const removeTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  // Icon selection options
  const iconOptions = [
    "pricetag-outline",
    "leaf-outline",
    "bulb-outline",
    "book-outline",
    "briefcase-outline",
    "cafe-outline",
    "code-outline",
    "desktop-outline",
    "game-controller-outline",
    "fitness-outline",
    "home-outline",
    "medical-outline",
  ];

  /**
   * Calculate positions for minute markers around the timer
   */
  const getMinuteLabelPosition = (minute: number, totalDuration: number) => {
    // Calculate the angle based on the percentage of total duration
    // 0% is at the top, 50% at the bottom, so we need to adjust
    const angleInRadians = (minute / totalDuration) * 2 * Math.PI - Math.PI / 2;

    // Timer radius (adjust based on your timerOuterRing size)
    const radius = width * 0.3 - 30; // Slightly inside the outer ring

    // Calculate x and y coordinates based on the angle
    const x = Math.cos(angleInRadians) * radius;
    const y = Math.sin(angleInRadians) * radius;

    return {
      position: "absolute" as const,
      transform: [{ translateX: x }, { translateY: y }],
      textAlign: "center" as const,
      width: 30,
      left: "50%" as any,
      top: "50%" as any,
      marginLeft: -15,
      marginTop: -10,
    };
  };

  /**
   * Calculate markers for the timer based on total activity duration
   */
  const getTimerMarkers = () => {
    const totalMinutes = Math.ceil(activityTotalDuration / (60 * 1000));
    const markers = [];
    const numMarkers = 12; // We want 12 markers around the timer

    for (let i = 0; i < numMarkers; i++) {
      const percentage = i / numMarkers;
      const minutes = Math.round(percentage * totalMinutes);
      markers.push({
        value: minutes,
        percentage: percentage * totalMinutes,
        isLarge: i % 3 === 0, // Make every 3rd marker larger
      });
    }

    return markers;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Setup pulse animation when timer is running
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;

    if (timerStatus === "running") {
      // Create pulsing animation
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Start the animation
      pulseAnimation.start();
    } else {
      // Reset opacity when timer is not running
      pulseAnim.setValue(1);
    }

    // Clean up animation on state change
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [timerStatus, pulseAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerTitle}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Icon name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{activityData.title}</Text>
          <Text style={styles.category}>{activityData.category}</Text>
        </View>

        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={`tag-${tag.id}-${index}`} style={styles.tag}>
              <Icon name={tag.icon} size={14} color="#fff" />
              <Text style={styles.tagText}>{tag.name}</Text>
              <TouchableOpacity onPress={() => removeTag(tag.id)}>
                <Icon name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => setShowTagModal(true)}
          >
            <Text style={styles.addTagText}>+ADD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Time</Text>
            <Text style={styles.statValue}>
              {formatFullTime(activityTotalDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>
              {formatFullTime(remainingTime)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Interruptions</Text>
            <Text style={styles.statValue}>
              {activityData.interuption.length}
            </Text>
          </View>
        </View>

        <View style={styles.timerSection}>
          <Animated.Text
            style={[
              styles.timerValue,
              timerStatus === "completed" && styles.completedTimerValue,
              { opacity: timerStatus === "running" ? pulseAnim : 1 },
            ]}
          >
            {formatFullTime(remainingTime)}
          </Animated.Text>
          <Text style={styles.timerSubtext}>
            {timerStatus === "completed"
              ? "Completed!"
              : timerStatus === "interrupted"
              ? "Interruption in progress..."
              : `${formatFullTime(
                  activityTotalDuration - remainingTime
                )} of ${formatFullTime(activityTotalDuration)}`}
          </Text>
        </View>

        {showCompletionMessage && (
          <View style={styles.completionContainer}>
            <Icon name="checkmark-circle" size={40} color="#4CAF50" />
            <Text style={styles.completionText}>
              Congratulations! Activity completed for today.
            </Text>
          </View>
        )}

        <View style={styles.timerControls}>
          <View style={styles.timerOuterRing}>
            {/* Minutes markers */}
            {getTimerMarkers().map((marker, index) => (
              <Text
                key={`minute-marker-${marker.value}-${index}`}
                style={[
                  styles.minuteLabel,
                  marker.isLarge ? styles.largeMinuteLabel : {},
                  getMinuteLabelPosition(
                    marker.value,
                    Math.ceil(activityTotalDuration / (60 * 1000))
                  ),
                ]}
              >
                {marker.value}
              </Text>
            ))}

            {/* Progress indicator at the top */}
            <View style={styles.timerIndicator} />

            {/* Background circle */}
            <View style={styles.timerBackground} />

            {/* Calculate the arc angles */}
            {(() => {
              const arcAngles = calculateArcAngles();

              return (
                <>
                  {/* Interruption Arc - Purple */}
                  {arcAngles.interruptionEnd > 0 && (
                    <View
                      style={styles.arcContainer}
                      key="interruption-arc-container"
                    >
                      <Svg
                        width={timerSize}
                        height={timerSize}
                        style={styles.arcSvg}
                      >
                        <Path
                          key="interruption-arc-path"
                          d={getArcPath(
                            arcAngles.interruptionStart,
                            arcAngles.interruptionEnd,
                            timerRadius - timerInnerOffset,
                            timerThickness - timerInnerOffset * 2
                          )}
                          fill="#9c6cda"
                          strokeWidth={0}
                        />
                      </Svg>
                    </View>
                  )}

                  {/* Remaining Arc - Cyan */}
                  {arcAngles.remainingEnd > arcAngles.remainingStart && (
                    <View
                      style={styles.arcContainer}
                      key="remaining-arc-container"
                    >
                      <Svg
                        width={timerSize}
                        height={timerSize}
                        style={styles.arcSvg}
                      >
                        <Path
                          key="remaining-arc-path"
                          d={getArcPath(
                            arcAngles.remainingStart,
                            arcAngles.remainingEnd,
                            timerRadius - timerInnerOffset,
                            timerThickness - timerInnerOffset * 2
                          )}
                          fill="#00E5FF"
                          strokeWidth={0}
                        />
                      </Svg>
                    </View>
                  )}
                </>
              );
            })()}

            {/* Inner circle with gradient */}
            <LinearGradient
              colors={
                timerStatus === "completed"
                  ? ["#388E3C", "#4CAF50"]
                  : timerStatus === "interrupted"
                  ? ["#D32F2F", "#F44336"]
                  : ["#3a2b4f", "#4a3b6f"]
              }
              style={styles.timerInnerRing}
            >
              <View style={styles.timerButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.timerButton,
                    timerStatus === "completed" && styles.completedButton,
                    timerStatus === "interrupted" && styles.interruptedButton,
                  ]}
                  onPress={toggleTimer}
                  activeOpacity={0.8}
                  disabled={timerStatus === "completed"}
                >
                  <Icon
                    name={
                      timerStatus === "completed"
                        ? "checkmark"
                        : timerStatus === "running"
                        ? "pause"
                        : "play"
                    }
                    size={28}
                    color="#fff"
                  />
                  <Text style={styles.buttonLabel}>
                    {timerStatus === "completed"
                      ? "Done"
                      : timerStatus === "running"
                      ? "Pause"
                      : timerStatus === "interrupted"
                      ? "Resume"
                      : "Start"}
                  </Text>
                </TouchableOpacity>

                {timerStatus === "running" && (
                  <TouchableOpacity
                    style={styles.interruptButton}
                    onPress={startInterruption}
                  >
                    <Icon name="hand-right-outline" size={18} color="#fff" />
                    <Text style={styles.buttonLabel}>Interrupt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Timeline Legend */}
          <View style={styles.timelineLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#00E5FF" }]}
              />
              <Text style={styles.legendText}>
                Remaining: {formatFullTime(remainingTime)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#9c6cda" }]}
              />
              <Text style={styles.legendText}>
                Interruptions: {formatFullTime(getInterruptionsTotalDuration())}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#555" }]} />
              <Text style={styles.legendText}>
                Total: {formatFullTime(activityTotalDuration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Interruptions section */}
        {activityData.interuption.length > 0 && (
          <View style={styles.interruptionsSection}>
            <Text style={styles.sectionTitle}>Interruptions</Text>
            <View style={styles.interruptionsContainer}>
              {activityData.interuption.map((interruption, index) => (
                <View
                  key={`interruption-item-${interruption.id || index}`}
                  style={styles.interruptionItem}
                >
                  <View style={styles.interruptIcon}>
                    <Icon name="pause" size={16} color="#fff" />
                  </View>
                  <Text style={styles.interruptionText}>
                    {interruption.CoverdTime} · {interruption.StartTime}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add New Tag</Text>

            <TextInput
              style={styles.input}
              placeholder="Tag name"
              placeholderTextColor="#666"
              value={newTagName}
              onChangeText={setNewTagName}
            />

            <Text style={styles.iconSectionTitle}>Select Icon</Text>

            <FlatList
              data={iconOptions}
              keyExtractor={(item, index) => `icon-option-${item}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  key={`icon-${item}-${index}`}
                  style={[
                    styles.iconOption,
                    selectedIcon === item && styles.selectedIconOption,
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <Icon name={item} size={24} color="#fff" />
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTagModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addTag}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  contentContainer: {
    paddingBottom: 30,
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#121212",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // Title and category styles
  titleContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: "#9c9c9c",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  // Tag styles
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252525",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#fff",
    marginLeft: 5,
    marginRight: 5,
    fontSize: 12,
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addTagText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  // Timer section styles
  timerSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },
  completedTimerValue: {
    color: "#4CAF50",
  },
  timerSubtext: {
    fontSize: 16,
    color: "#9c9c9c",
    marginTop: 5,
  },

  // Completion message styles
  completionContainer: {
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  completionText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 8,
    fontWeight: "500",
  },

  // Timer controls and visualization styles
  timerControls: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  timerOuterRing: {
    width: width * 0.75,
    height: width * 0.75,
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: width * 0.375,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "transparent",
    marginTop: 15,
  },
  timerBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: width * 0.375,
    borderWidth: 16,
    borderColor: "#2a2a2a",
  },
  timerIndicator: {
    position: "absolute",
    top: 0,
    width: 4,
    height: 15,
    backgroundColor: "#fff",
    borderRadius: 2,
    zIndex: 10,
  },
  timerInnerRing: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 160,
    maxHeight: 160,
    borderRadius: width * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  arcContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  arcSvg: {
    position: "absolute",
  },

  // Timer button styles
  timerButtonsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerButton: {
    width: width * 0.3,
    height: width * 0.3,
    maxWidth: 120,
    maxHeight: 120,
    borderRadius: width * 0.15,
    backgroundColor: "rgba(58, 43, 79, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: "rgba(56, 142, 60, 0.8)",
  },
  interruptedButton: {
    backgroundColor: "rgba(211, 47, 47, 0.8)",
  },
  interruptButton: {
    flexDirection: "row",
    width: 90,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(211, 47, 47, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 5,
  },

  // Minute label styles
  minuteLabel: {
    color: "#9c9c9c",
    fontSize: 12,
    fontWeight: "400",
  },
  largeMinuteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Timeline and legend styles
  timelineContainer: {
    marginHorizontal: 20,
    height: 8,
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  timelineSegment: {
    height: "100%",
  },
  timelineLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: "#fff",
    fontSize: 12,
  },

  // Progress bar styles
  progressBar: {
    height: 8,
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
    marginHorizontal: 20,
  },
  progressSegment: {
    height: "100%",
  },

  // Stats section styles
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#9c9c9c",
    marginBottom: 5,
    fontSize: 13,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Interruption styles
  interruptionsSection: {
    marginBottom: 20,
  },
  interruptionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  interruptionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e2c",
    padding: 16,
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 20,
  },
  interruptIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3a2b4f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  interruptionText: {
    color: "#fff",
    fontSize: 14,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#666",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  iconSectionTitle: {
    color: "#ccc",
    marginBottom: 10,
    fontSize: 16,
  },
  iconList: {
    paddingVertical: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  selectedIconOption: {
    backgroundColor: "#3a2b4f",
    borderWidth: 2,
    borderColor: "#9c6cda",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333",
  },
  addButton: {
    backgroundColor: "#9c6cda",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ActivityDetailScreen;
