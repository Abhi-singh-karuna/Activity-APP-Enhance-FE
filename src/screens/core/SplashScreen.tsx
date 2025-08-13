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
import { appService } from "./api";
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
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Animation values for logo
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const ringDash = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const letterLTranslate = useRef(new Animated.Value(-60)).current;
  const letterTTranslate = useRef(new Animated.Value(60)).current;
  const penLineAnimation = useRef(new Animated.Value(0)).current;
  const penPosition = useRef(new Animated.Value(0)).current;
  const bookSlide = useRef(new Animated.Value(0)).current;
  const bookBounce = useRef(new Animated.Value(0)).current;

  // Interpolations
  const ringSpin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const R = 80; // SVG ring radius
  const C = 2 * Math.PI * R;
  const ringDashOffset = ringDash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, C],
  });
  const penLineWidth = penLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.8],
  });
  const penX = penPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.8],
  });
  const bookX = bookSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });
  const bookY = bookBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const startAnimations = () => {
    // Entrance sequence
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(letterLTranslate, {
          toValue: 0,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(letterTTranslate, {
          toValue: 0,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 1100,
          delay: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous animations
    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ringDash, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Pen line and moving book icon
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
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bookSlide, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bookSlide, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bookBounce, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bookBounce, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Initialize the app
  useEffect(() => {
    const initializeApplication = async () => {
      try {
        setIsInitializing(true);
        startAnimations();

        const initResult = await appService.initializeApp();
        if (!initResult.status) {
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
          {/* Logo section */}
          <View style={styles.logoSection}>
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              {/* Build the logo using layered SVGs so we can animate ring and letters */}
              <View style={styles.logoWrapper}>
                {/* Base disc */}
                <Svg
                  width={scale(200)}
                  height={scale(200)}
                  viewBox="0 0 200 200"
                >
                  <Defs>
                    <SvgLinearGradient
                      id="monoBase"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <Stop offset="0%" stopColor="#EDEDED" />
                      <Stop offset="100%" stopColor="#CFCFCF" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx={100} cy={100} r={70} fill="#0F0F0F" />
                  <Circle
                    cx={100}
                    cy={100}
                    r={70}
                    fill="#121212"
                    opacity={0.3}
                  />
                  <AnimatedCircle
                    cx={100}
                    cy={100}
                    r={68}
                    fill="#1A1A1A"
                    opacity={glowOpacity}
                  />
                </Svg>

                {/* Rotating outer ring */}
                <Animated.View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: [{ rotate: ringSpin }],
                  }}
                >
                  <Svg
                    width={scale(200)}
                    height={scale(200)}
                    viewBox="0 0 200 200"
                  >
                    <Defs>
                      <SvgLinearGradient id="ring2" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#00E5FF" />
                        <Stop offset="50%" stopColor="#4ECDC4" />
                        <Stop offset="100%" stopColor="#9C6CDA" />
                      </SvgLinearGradient>
                    </Defs>
                    <AnimatedCircle
                      cx={100}
                      cy={100}
                      r={R}
                      stroke="url(#ring2)"
                      strokeWidth={8}
                      fill="none"
                      strokeDasharray={C}
                      strokeDashoffset={ringDashOffset as unknown as number}
                    />
                  </Svg>
                </Animated.View>

                {/* L entering from left */}
                <Animated.View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: [{ translateX: letterLTranslate }],
                  }}
                >
                  <Svg
                    width={scale(200)}
                    height={scale(200)}
                    viewBox="0 0 200 200"
                  >
                    <Defs>
                      <SvgLinearGradient
                        id="ringLT"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <Stop offset="0%" stopColor="#00E5FF" />
                        <Stop offset="50%" stopColor="#4ECDC4" />
                        <Stop offset="100%" stopColor="#9C6CDA" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path d="M70 70h16v64h56v16H70V70z" fill="url(#ringLT)" />
                  </Svg>
                </Animated.View>

                {/* T entering from right */}
                <Animated.View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: [{ translateX: letterTTranslate }],
                  }}
                >
                  <Svg
                    width={scale(200)}
                    height={scale(200)}
                    viewBox="0 0 200 200"
                  >
                    <Defs>
                      <SvgLinearGradient
                        id="monoLT"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <Stop offset="0%" stopColor="#EDEDED" />
                        <Stop offset="100%" stopColor="#CFCFCF" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path
                      d="M56 70h96v16H112v64H96V86H56V70z"
                      fill="url(#monoLT)"
                    />
                  </Svg>
                </Animated.View>
              </View>
            </Animated.View>
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
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            Time Log
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
            Track your time. Stay focused.
          </AnimatedStyledText>

          {/* Horizontal pen signing line */}
          <View style={styles.penSignatureContainer}>
            <Animated.View style={[styles.penLine, { width: penLineWidth }]}>
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
                { transform: [{ translateX: penX }, { rotate: "15deg" }] },
              ]}
            >
              <Icon name="create-outline" size={scale(20)} color="#FFFFFF" />
            </Animated.View>

            {/* Animated moving book/notebook icon following the line */}
            <Animated.View
              style={{
                position: "absolute",
                left: 0,
                bottom: scale(-18),
                transform: [{ translateX: bookX }, { translateY: bookY }],
              }}
            >
              <Icon name="book-outline" size={scale(22)} color="#9C6CDA" />
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
  logoWrapper: {
    width: scale(200),
    height: scale(200),
    alignItems: "center",
    justifyContent: "center",
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
