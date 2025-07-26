import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation";
import Icon from "react-native-vector-icons/Ionicons";
import StyledText from "../../components/StyledText";
import { appService } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

// Create animated components
const AnimatedStyledText = Animated.createAnimatedComponent(StyledText);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Simplified animation values
  const clockScale = useRef(new Animated.Value(0)).current;
  const clockRotation = useRef(new Animated.Value(0)).current;
  const bookScale = useRef(new Animated.Value(0)).current;
  const bookFlip = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const penLineAnimation = useRef(new Animated.Value(0)).current;
  const penPosition = useRef(new Animated.Value(-50)).current;

  // Create interpolations
  const clockSpin = clockRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bookRotateY = bookFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "90deg", "0deg"],
  });

  // Pen line drawing animation
  const penLineWidth = penLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.8],
  });

  // Pen position animation (moving horizontally like signing)
  const penX = penPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.8],
  });

  const startAnimations = () => {
    // Entrance sequence
    Animated.sequence([
      // Dual icon entrance
      Animated.parallel([
        Animated.spring(clockScale, {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(bookScale, {
          toValue: 1,
          friction: 8,
          tension: 120,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),

      // Text animations
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 1200,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Pen signing animation (horizontal line)
      Animated.parallel([
        Animated.timing(penLineAnimation, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(penPosition, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous animations

    // Clock rotation
    Animated.loop(
      Animated.timing(clockRotation, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Book flip animation
    Animated.loop(
      Animated.timing(bookFlip, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();
  };

  // Initialize the app
  useEffect(() => {
    const initializeApplication = async () => {
      try {
        setIsInitializing(true);
        startAnimations();

        const initResult = await appService.initializeApp();

        if (!initResult.success) {
          console.error("App initialization failed:", initResult.error);
          setInitError(
            initResult.error?.message ||
              "Failed to initialize the app. Please try again."
          );
          return;
        }

        if (initResult.data?.maintenance?.active) {
          setInitError(
            initResult.data.maintenance.message ||
              "App is currently under maintenance. Please try again later."
          );
          return;
        }

        if (initResult.data?.updates?.required) {
          setInitError(
            "A required update is available. Please update the app to continue."
          );
          return;
        }

        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        const minDisplayTime = 4000;
        const endTime = Date.now() + minDisplayTime;
        const remainingTime = Math.max(0, endTime - Date.now());

        setTimeout(() => {
          if (isLoggedIn === "true") {
            navigation.replace("Activity");
          } else {
            navigation.replace("Login");
          }
        }, remainingTime);
      } catch (error) {
        console.error("Error during app initialization:", error);
        setInitError("An unexpected error occurred. Please restart the app.");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApplication();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Pure black background */}
      <View style={styles.background}>
        <View style={styles.content}>
          {/* Dual logo section */}
          <View style={styles.logoSection}>
            {/* Dual icons container */}
            <View style={styles.iconsContainer}>
              {/* Clock icon with rotation animation */}
              <Animated.View
                style={[
                  styles.clockContainer,
                  {
                    transform: [{ scale: clockScale }, { rotate: clockSpin }],
                  },
                ]}
              >
                <LinearGradient
                  colors={["#1A1A1A", "#2A2A2A"]}
                  style={styles.iconBackground}
                >
                  <Icon name="time-outline" size={scale(40)} color="#00E5FF" />
                </LinearGradient>
              </Animated.View>

              {/* Book icon with flip animation */}
              <Animated.View
                style={[
                  styles.bookContainer,
                  {
                    transform: [{ scale: bookScale }, { rotateY: bookRotateY }],
                  },
                ]}
              >
                <LinearGradient
                  colors={["#1A1A1A", "#2A2A2A"]}
                  style={styles.iconBackground}
                >
                  <Icon name="book-outline" size={scale(40)} color="#9C6CDA" />
                </LinearGradient>
              </Animated.View>
            </View>
          </View>

          {/* Title section */}
          <AnimatedStyledText
            variant="title"
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [
                  {
                    scale: titleOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            Learning Tracker
          </AnimatedStyledText>

          <AnimatedStyledText
            variant="subtitle"
            style={[
              styles.subtitle,
              {
                opacity: subtitleOpacity,
                transform: [
                  {
                    translateY: subtitleOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Master your time, enhance your knowledge
          </AnimatedStyledText>

          {/* Horizontal pen signing line */}
          <View style={styles.penSignatureContainer}>
            <Animated.View
              style={[
                styles.penLine,
                {
                  width: penLineWidth,
                },
              ]}
            >
              <LinearGradient
                colors={["#00E5FF", "#4ECDC4", "#9C6CDA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.penLineGradient}
              />
            </Animated.View>

            {/* Animated pen icon moving horizontally */}
            <Animated.View
              style={[
                styles.penIcon,
                {
                  transform: [
                    { translateX: penX },
                    { rotate: "15deg" }, // Slight angle like writing
                  ],
                },
              ]}
            >
              <Icon name="create-outline" size={scale(20)} color="#FFFFFF" />
            </Animated.View>
          </View>

          {/* Loading indicator */}
          {isInitializing && (
            <Animated.View
              style={[
                styles.loadingContainer,
                {
                  opacity: subtitleOpacity,
                },
              ]}
            >
              <ActivityIndicator
                size="small"
                color="#00E5FF"
                style={styles.loader}
              />
              <StyledText variant="body" style={styles.loadingText}>
                Initializing...
              </StyledText>
            </Animated.View>
          )}

          {/* Error container */}
          {initError && (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: titleOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(244, 67, 54, 0.15)", "rgba(244, 67, 54, 0.05)"]}
                style={styles.errorGradient}
              >
                <Icon
                  name="alert-circle-outline"
                  size={scale(20)}
                  color="#FF6B6B"
                />
                <StyledText variant="body" style={styles.errorText}>
                  {initError}
                </StyledText>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: "#000000", // Pure black background
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: scale(20),
  },
  logoSection: {
    alignItems: "center",
    marginBottom: scale(60),
    position: "relative",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: scale(140),
  },
  clockContainer: {
    alignItems: "center",
  },
  bookContainer: {
    alignItems: "center",
  },
  iconBackground: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: scale(40),
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: scale(15),
    textAlign: "center",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: scale(16),
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: scale(60),
    fontWeight: "500",
    letterSpacing: 0.8,
    lineHeight: scale(24),
  },
  penSignatureContainer: {
    width: width * 0.8,
    height: scale(60),
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: scale(40),
    position: "relative",
  },
  penLine: {
    height: scale(3),
    borderRadius: scale(1.5),
    overflow: "hidden",
  },
  penLineGradient: {
    flex: 1,
    borderRadius: scale(1.5),
  },
  penIcon: {
    position: "absolute",
    top: scale(-8),
    left: 0,
    zIndex: 10,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: scale(30),
  },
  loader: {
    marginBottom: scale(15),
  },
  loadingText: {
    color: "#9C9C9C",
    fontSize: scale(14),
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginTop: scale(40),
    maxWidth: width - scale(60),
    borderRadius: scale(15),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  errorGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(20),
  },
  errorText: {
    color: "#E0E0E0",
    fontSize: scale(14),
    lineHeight: scale(20),
    fontWeight: "400",
    marginLeft: scale(12),
    flex: 1,
  },
});

export default SplashScreen;
